import { cli, Strategy } from '@jackwener/opencli/registry';
import { access } from 'node:fs/promises';
import { runtimeConfig } from './src/runtime/config.js';
import { probeGateway } from './src/providers/remote-gateway.js';

cli({
  site: 'zhihu-mobile',
  name: 'doctor',
  access: 'read',
  description: '检查手机知乎 OpenCLI 的 source、网关和 capture 配置',
  domain: 'localhost',
  strategy: Strategy.LOCAL,
  browser: false,
  args: [
    {
      name: 'probe',
      type: 'bool',
      default: false,
      help: '实际探测远程网关健康接口',
    },
    {
      name: 'gateway-url',
      type: 'string',
      default: '',
      help: '远程执行网关 URL；也可使用 ZHIHU_MOBILE_GATEWAY_URL',
    },
    {
      name: 'capture-file',
      type: 'string',
      default: '',
      help: 'Reqable JSON 导出路径；也可使用 REQABLE_ZHIHU_CAPTURE_FILE',
    },
  ],
  columns: ['component', 'status', 'source', 'detail'],
  func: async (args) => {
    const config = runtimeConfig(args);
    const rows = [{
      component: 'runtime',
      status: 'ok',
      source: config.requestedSource,
      detail: `node ${process.version}; platform ${process.platform}`,
    }];
    if (config.gatewayUrl) {
      const result = args.probe
        ? await probeGateway(config.gatewayUrl)
        : { ok: true, detail: 'configured; pass --probe to test' };
      rows.push({
        component: 'gateway',
        status: result.ok ? 'ok' : 'unavailable',
        source: 'remote',
        detail: result.detail,
      });
      rows.push({
        component: 'gatewayToken',
        status: config.gatewayToken ? 'ok' : 'missing',
        source: 'remote',
        detail: config.gatewayToken ? 'configured' : 'set ZHIHU_MOBILE_GATEWAY_TOKEN',
      });
    } else {
      rows.push({
        component: 'gateway',
        status: 'missing',
        source: 'remote',
        detail: 'set ZHIHU_MOBILE_GATEWAY_URL',
      });
    }
    if (config.captureFile) {
      let status = 'ok';
      let detail = 'readable';
      try {
        await access(config.captureFile);
      } catch {
        status = 'unavailable';
        detail = 'configured path is not readable';
      }
      rows.push({
        component: 'captureFile',
        status,
        source: 'capture',
        detail,
      });
    } else {
      rows.push({
        component: 'captureFile',
        status: 'missing',
        source: 'capture',
        detail: 'set REQABLE_ZHIHU_CAPTURE_FILE',
      });
    }
    return rows;
  },
});
