import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { ProviderError } from '../errors.js';
import { buildOpenCliInvocation } from './command.js';

const MAX_BODY_BYTES = 64 * 1024;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

function sendJson(response, status, data) {
  const body = JSON.stringify(data);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  response.end(body);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new ProviderError('argument', 'Request body is too large');
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    throw new ProviderError('argument', 'Request body must be valid JSON', { cause: error });
  }
}

function authorized(request, token) {
  const expected = `Bearer ${token}`;
  return request.headers.authorization === expected;
}

export function executeOpenCli(command, args, options = {}) {
  const invocation = buildOpenCliInvocation(command, args);
  const executable = options.opencliBin
    ?? process.env.OPENCLI_BIN
    ?? (process.platform === 'win32' ? 'opencli.cmd' : 'opencli');
  const timeoutMs = options.timeoutMs ?? 120_000;
  return new Promise((resolve) => {
    const child = spawn(executable, invocation, {
      shell: false,
      windowsHide: true,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let outputSize = 0;
    let terminated = false;
    const timer = setTimeout(() => {
      terminated = true;
      child.kill();
    }, timeoutMs);
    const append = (target, chunk) => {
      outputSize += chunk.length;
      if (outputSize > MAX_OUTPUT_BYTES) {
        terminated = true;
        child.kill();
        return;
      }
      target.push(chunk);
    };
    child.stdout.on('data', (chunk) => append(stdout, chunk));
    child.stderr.on('data', (chunk) => append(stderr, chunk));
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        exitCode: 1,
        message: `Unable to start OpenCLI: ${error.message}`,
      });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (terminated) {
        resolve({
          ok: false,
          exitCode: outputSize > MAX_OUTPUT_BYTES ? 1 : 75,
          message: outputSize > MAX_OUTPUT_BYTES
            ? 'OpenCLI output exceeded the gateway limit'
            : 'OpenCLI command timed out',
          seconds: Math.ceil(timeoutMs / 1000),
        });
        return;
      }
      const out = Buffer.concat(stdout).toString('utf8').trim();
      const err = Buffer.concat(stderr).toString('utf8').trim().slice(0, 4000);
      if (code !== 0) {
        resolve({
          ok: false,
          exitCode: Number.isInteger(code) ? code : 1,
          message: err || `OpenCLI exited with code ${code}`,
        });
        return;
      }
      try {
        const rows = JSON.parse(out);
        if (!Array.isArray(rows)) throw new Error('stdout is not a JSON array');
        resolve({ ok: true, rows });
      } catch (error) {
        resolve({
          ok: false,
          exitCode: 1,
          message: `OpenCLI returned malformed JSON: ${error.message}`,
          details: err || null,
        });
      }
    });
  });
}

export function createGateway(options) {
  const token = String(options.token ?? '').trim();
  if (token.length < 24) {
    throw new Error('ZHIHU_MOBILE_GATEWAY_TOKEN must contain at least 24 characters');
  }
  const execute = options.execute ?? executeOpenCli;
  return createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, {
        ok: true,
        service: 'reqable-zhihu-gateway',
        version: 1,
      });
      return;
    }
    if (request.method !== 'POST' || request.url !== '/v1/execute') {
      sendJson(response, 404, { ok: false, message: 'Not found' });
      return;
    }
    if (!authorized(request, token)) {
      sendJson(response, 401, { ok: false, message: 'Invalid gateway token' });
      return;
    }
    try {
      const body = await readJsonBody(request);
      const result = await execute(body.command, body.args ?? {});
      sendJson(response, 200, result);
    } catch (error) {
      const status = error instanceof ProviderError && error.kind === 'argument' ? 400 : 500;
      sendJson(response, status, {
        ok: false,
        exitCode: status === 400 ? 2 : 1,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
