import assert from 'node:assert/strict';
import test from 'node:test';
import {
  answerLiveFilters,
  recommendLiveFilters,
  ReqableLiveClient,
} from '../src/providers/reqable-live.js';

function jsonResponse(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return value;
    },
  };
}

test('Reqable live client waits for a new ADB JSON response', async () => {
  const requests = [];
  let getCalls = 0;
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    const body = JSON.parse(options.body);
    requests.push({ path, body });
    if (path === '/capture/live/filter') return jsonResponse([40, 41]);
    if (path === '/capture/live/get') {
      getCalls += 1;
      return jsonResponse({
        id: body.id,
        url: 'https://api.zhihu.com/topstory/recommend?action=pull',
        application: { name: 'adb', id: 'adb.exe' },
        connection: { timestamp: '2026-07-24T02:30:00.000Z' },
        response: getCalls === 1
          ? null
          : {
              code: 200,
              body: { text: '{"data":[{"id":"mobile"}]}' },
            },
      });
    }
    throw new Error(`unexpected path ${path}`);
  };
  const client = new ReqableLiveClient(
    { reqableUrl: 'http://127.0.0.1:9000' },
    { fetchImpl, delay: async () => {} },
  );
  const result = await client.waitForJson({
    filters: recommendLiveFilters(),
    seenIds: new Set([40]),
    timeoutSeconds: 2,
    label: 'topstory/recommend',
    acceptRecord: () => true,
  });
  assert.equal(result.record.id, 41);
  assert.equal(result.payload.data[0].id, 'mobile');
  assert.equal(getCalls, 2);
  assert.deepEqual(requests[0].body.filters, recommendLiveFilters());
});

test('live filters target the mobile recommendation and requested answer', () => {
  assert.equal(recommendLiveFilters()[0].hosts[0], 'api.zhihu.com');
  assert.match(answerLiveFilters('123')[1].pattern, /123/);
});

test('Reqable live URL is restricted to loopback HTTP', () => {
  assert.throws(
    () => new ReqableLiveClient({ reqableUrl: 'https://example.com' }),
    /loopback HTTP URL/,
  );
});
