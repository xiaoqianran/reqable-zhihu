import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { buildOpenCliInvocation } from '../src/gateway/command.js';
import { createGateway } from '../src/gateway/server.js';
import { requestGateway } from '../src/providers/remote-gateway.js';

const TOKEN = 'test-token-that-is-longer-than-24-characters';

test('gateway invocation is allowlisted and shell-free', () => {
  assert.deepEqual(
    buildOpenCliInvocation('recommend', { limit: 3 }),
    ['zhihu', 'recommend', '--limit', '3', '-f', 'json'],
  );
  assert.deepEqual(
    buildOpenCliInvocation('answer-detail', {
      target: '900000000000000001',
      maxContent: 100,
    }),
    [
      'zhihu',
      'answer-detail',
      '900000000000000001',
      '--max-content',
      '100',
      '-f',
      'json',
    ],
  );
  assert.throws(
    () => buildOpenCliInvocation('comment', { execute: true }),
    /not allowed/,
  );
});

test('gateway health is public but execution requires a token', async (t) => {
  const server = createGateway({
    token: TOKEN,
    execute: async (command, args) => ({
      ok: true,
      rows: [{ command, limit: args.limit }],
    }),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).service, 'reqable-zhihu-gateway');

  const unauthorized = await fetch(`${base}/v1/execute`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ command: 'recommend', args: { limit: 2 } }),
  });
  assert.equal(unauthorized.status, 401);

  const authorized = await fetch(`${base}/v1/execute`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ command: 'recommend', args: { limit: 2 } }),
  });
  assert.equal(authorized.status, 200);
  assert.deepEqual((await authorized.json()).rows, [{
    command: 'recommend',
    limit: 2,
  }]);

  const remoteRows = await requestGateway(
    {
      gatewayUrl: base,
      gatewayToken: TOKEN,
    },
    'recommend',
    { limit: 4 },
  );
  assert.deepEqual(remoteRows, [{
    command: 'recommend',
    limit: 4,
  }]);
});
