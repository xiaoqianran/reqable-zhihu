import { createGateway } from '../src/gateway/server.js';

const host = String(process.env.ZHIHU_MOBILE_GATEWAY_HOST ?? '127.0.0.1').trim();
const port = Number(process.env.ZHIHU_MOBILE_GATEWAY_PORT ?? 17830);
const token = String(process.env.ZHIHU_MOBILE_GATEWAY_TOKEN ?? '').trim();

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('ZHIHU_MOBILE_GATEWAY_PORT must be an integer between 1 and 65535');
}

const server = createGateway({ token });
server.listen(port, host, () => {
  process.stdout.write(`reqable-zhihu gateway listening on http://${host}:${port}\n`);
});
