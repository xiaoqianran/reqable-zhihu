import assert from 'node:assert/strict';
import test from 'node:test';
import { AdbClient, adbInternals } from '../src/providers/adb.js';

test('ADB parser preserves device serials and prefers override screen size', () => {
  assert.deepEqual(
    adbInternals.parseDevices(
      'List of devices attached\nemulator-5554 device product:sdk\nphone offline\n',
    ),
    ['emulator-5554'],
  );
  assert.deepEqual(
    adbInternals.parseScreenSize('Physical size: 1080x2400\nOverride size: 720x1600\n'),
    { width: 720, height: 1600 },
  );
});

test('ADB client prepares reverse proxy and refreshes Zhihu recommendation once', async () => {
  const calls = [];
  const runner = async (_file, args) => {
    calls.push(args);
    const command = args.join(' ');
    if (command === 'devices -l') {
      return { stdout: 'List of devices attached\nemulator-5554 device product:sdk\n' };
    }
    if (command.includes('shell pm path com.zhihu.android')) {
      return { stdout: 'package:/data/app/com.zhihu.android/base.apk\n' };
    }
    if (command.includes('shell settings get global http_proxy')) {
      return { stdout: '127.0.0.1:9000\n' };
    }
    if (command.includes('shell wm size')) {
      return { stdout: 'Physical size: 1080x2400\n' };
    }
    return { stdout: '' };
  };
  const client = new AdbClient(
    { adbPath: 'adb', adbSerial: null },
    { runner, delay: async () => {} },
  );
  const result = await client.prepare(new URL('http://127.0.0.1:9000'));
  assert.deepEqual(result, {
    serial: 'emulator-5554',
    proxy: '127.0.0.1:9000',
    port: 9000,
  });
  await client.openRecommend();
  assert.ok(calls.some((args) => args.join(' ').includes('reverse tcp:9000 tcp:9000')));
  const inputCalls = calls.filter((args) => args.includes('input'));
  assert.deepEqual(inputCalls, [[
    '-s',
    'emulator-5554',
    'shell',
    'input',
    'tap',
    '108',
    '2280',
  ]]);
});

test('ADB client requires an explicit serial when multiple devices are online', async () => {
  const client = new AdbClient(
    { adbPath: 'adb', adbSerial: null },
    {
      runner: async () => ({
        stdout: 'List of devices attached\none device\ntwo device\n',
      }),
    },
  );
  await assert.rejects(() => client.resolveDevice(), /pass --adb-serial/);
});

test('ADB search uses an encoded Zhihu deeplink without keyboard injection', async () => {
  const calls = [];
  const client = new AdbClient(
    { adbPath: 'adb', adbSerial: 'emulator-5554' },
    {
      runner: async (_file, args) => {
        calls.push(args);
        return { stdout: '' };
      },
    },
  );
  client.serial = 'emulator-5554';
  await client.openSearch('人工智能 AI');
  assert.deepEqual(calls[0], [
    '-s',
    'emulator-5554',
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    'zhihu://search?q=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD+AI',
    'com.zhihu.android',
  ]);
  assert.ok(!calls[0].includes('input'));
});
