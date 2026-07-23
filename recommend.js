import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { readRecommend } from './src/providers/index.js';
import {
  resolveSource,
  runtimeConfig,
  SOURCES,
  validateLimit,
} from './src/runtime/config.js';
import { asOpenCliError } from './src/runtime/typed-errors.js';

cli({
  site: 'zhihu-mobile',
  name: 'recommend',
  access: 'read',
  description: '读取知乎首页推荐；支持远程执行器或 Reqable 导出',
  domain: 'localhost',
  strategy: Strategy.LOCAL,
  browser: false,
  args: [
    {
      name: 'source',
      type: 'string',
      default: 'auto',
      choices: SOURCES,
      help: '数据源：auto / remote / capture / fixture',
    },
    {
      name: 'limit',
      type: 'int',
      default: 20,
      help: '返回数量（1-100）',
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
  columns: ['rank', 'type', 'title', 'author', 'votes', 'url', 'source'],
  func: async (args) => {
    try {
      const config = runtimeConfig(args);
      const source = resolveSource(config);
      const limit = validateLimit(args.limit, 20, 100);
      const rows = await readRecommend(source, config, { limit });
      if (rows.length === 0) {
        throw new EmptyResultError(
          'zhihu-mobile recommend',
          `The ${source} source returned no recommendation rows`,
        );
      }
      return rows;
    } catch (error) {
      if (error instanceof EmptyResultError) throw error;
      throw asOpenCliError(error, 'zhihu-mobile recommend');
    }
  },
});
