import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ProviderError } from '../errors.js';

const execFileAsync = promisify(execFile);
const ZHIHU_PACKAGE = 'com.zhihu.android';
const ZHIHU_LAUNCHER = `${ZHIHU_PACKAGE}/.app.ui.activity.LauncherActivity`;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function defaultRunner(file, args, options) {
  return execFileAsync(file, args, options);
}

function parseDevices(stdout) {
  return String(stdout)
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim().match(/^(\S+)\s+device(?:\s|$)/)?.[1] ?? null)
    .filter(Boolean);
}

function parseScreenSize(stdout) {
  const matches = [...String(stdout).matchAll(/(?:Physical|Override) size:\s*(\d+)x(\d+)/g)];
  const match = matches.at(-1);
  if (!match) return { width: 1080, height: 2400 };
  return { width: Number(match[1]), height: Number(match[2]) };
}

function rounded(value) {
  return String(Math.round(value));
}

export class AdbClient {
  constructor(config, dependencies = {}) {
    this.binary = config.adbPath ?? 'adb';
    this.requestedSerial = config.adbSerial ?? null;
    this.runner = dependencies.runner ?? defaultRunner;
    this.delay = dependencies.delay ?? wait;
    this.serial = null;
  }

  async run(args, options = {}) {
    try {
      return await this.runner(this.binary, args, {
        encoding: 'utf8',
        timeout: options.timeoutMs ?? 15_000,
        windowsHide: true,
        maxBuffer: 4 * 1024 * 1024,
      });
    } catch (error) {
      const detail = String(error?.stderr ?? error?.message ?? error).trim();
      throw new ProviderError(
        options.kind ?? 'command',
        `ADB command failed: ${detail || args.join(' ')}`,
        { cause: error },
      );
    }
  }

  deviceArgs(args) {
    if (!this.serial) {
      throw new ProviderError('command', 'ADB device has not been resolved');
    }
    return ['-s', this.serial, ...args];
  }

  async resolveDevice() {
    const { stdout } = await this.run(['devices', '-l']);
    const devices = parseDevices(stdout);
    if (this.requestedSerial) {
      if (!devices.includes(this.requestedSerial)) {
        throw new ProviderError(
          'command',
          `ADB device ${this.requestedSerial} is not connected and authorized`,
        );
      }
      this.serial = this.requestedSerial;
      return this.serial;
    }
    if (devices.length === 0) {
      throw new ProviderError(
        'command',
        'No authorized Android device is connected through ADB',
      );
    }
    if (devices.length > 1) {
      throw new ProviderError(
        'argument',
        'Multiple Android devices are connected; pass --adb-serial',
      );
    }
    [this.serial] = devices;
    return this.serial;
  }

  async ensurePackage(packageName = ZHIHU_PACKAGE) {
    const { stdout } = await this.run(this.deviceArgs([
      'shell',
      'pm',
      'path',
      packageName,
    ]));
    if (!String(stdout).trim().startsWith('package:')) {
      throw new ProviderError(
        'command',
        `Android package ${packageName} is not installed on ${this.serial}`,
      );
    }
  }

  async getProxy() {
    const { stdout } = await this.run(this.deviceArgs([
      'shell',
      'settings',
      'get',
      'global',
      'http_proxy',
    ]));
    return String(stdout).trim();
  }

  async ensureReverse(port) {
    await this.run(this.deviceArgs([
      'reverse',
      `tcp:${port}`,
      `tcp:${port}`,
    ]));
  }

  async prepare(reqableUrl) {
    await this.resolveDevice();
    await this.ensurePackage();
    const port = Number(reqableUrl.port || 80);
    await this.ensureReverse(port);
    const proxy = await this.getProxy();
    if (proxy !== `127.0.0.1:${port}` && proxy !== `localhost:${port}`) {
      throw new ProviderError(
        'command',
        `Android HTTP proxy is ${proxy || 'not configured'}; expected 127.0.0.1:${port}. Run scripts/setup-adb-reqable.ps1.`,
      );
    }
    return { serial: this.serial, proxy, port };
  }

  async screenSize() {
    const { stdout } = await this.run(this.deviceArgs(['shell', 'wm', 'size']));
    return parseScreenSize(stdout);
  }

  async input(...args) {
    await this.run(this.deviceArgs(['shell', 'input', ...args]));
  }

  async openRecommend() {
    await this.run(this.deviceArgs([
      'shell',
      'am',
      'start',
      '-W',
      '-a',
      'android.intent.action.MAIN',
      '-c',
      'android.intent.category.LAUNCHER',
      '-f',
      '0x04000000',
      '-n',
      ZHIHU_LAUNCHER,
    ]), { timeoutMs: 25_000 });
    await this.delay(800);
    const { width, height } = await this.screenSize();
    await this.input('tap', rounded(width * 0.10), rounded(height * 0.95));
  }

  async openAnswer(answerId) {
    await this.run(this.deviceArgs([
      'shell',
      'am',
      'start',
      '-W',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      `zhihu://answers/${answerId}`,
      ZHIHU_PACKAGE,
    ]), { timeoutMs: 25_000 });
  }

  async openSearch(query) {
    const target = new URL('zhihu://search');
    target.searchParams.set('q', query);
    await this.run(this.deviceArgs([
      'shell',
      'am',
      'start',
      '-W',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      target.toString(),
      ZHIHU_PACKAGE,
    ]), { timeoutMs: 25_000 });
  }
}

export const adbInternals = Object.freeze({
  parseDevices,
  parseScreenSize,
});
