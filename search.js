import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { readSearch } from './src/providers/index.js';
import {
  resolveSource,
  runtimeConfig,
  validateLimit,
  validateQuery,
  validateWaitSeconds,
} from './src/runtime/config.js';
import { asOpenCliError } from './src/runtime/typed-errors.js';

const SEARCH_SOURCES = Object.freeze(['auto', 'adb', 'capture', 'fixture']);

cli({
  site: 'zhihu-mobile',
  name: 'search',
  access: 'read',
  description: '通过 Android 知乎 App 搜索回答、文章、问题和用户',
  domain: 'localhost',
  strategy: Strategy.LOCAL,
  browser: false,
  args: [
    {
      name: 'query',
      type: 'string',
      required: true,
      positional: true,
      help: '搜索关键词',
    },
    {
      name: 'source',
      type: 'string',
      default: 'auto',
      choices: SEARCH_SOURCES,
      help: '数据源：auto / adb / capture / fixture；auto 使用 adb',
    },
    {
      name: 'limit',
      type: 'int',
      default: 20,
      help: '返回数量（1-100）',
    },
    {
      name: 'wait-seconds',
      type: 'int',
      default: 20,
      help: '等待手机 App 响应的秒数（1-120）',
    },
    {
      name: 'adb-path',
      type: 'string',
      default: 'adb',
      help: 'ADB 可执行文件；也可使用 ZHIHU_MOBILE_ADB_PATH',
    },
    {
      name: 'adb-serial',
      type: 'string',
      default: '',
      help: 'ADB 设备序列号；多设备时必填',
    },
    {
      name: 'reqable-url',
      type: 'string',
      default: 'http://127.0.0.1:9000',
      help: 'Reqable 实时 API；也可使用 REQABLE_ZHIHU_URL',
    },
    {
      name: 'capture-file',
      type: 'string',
      default: '',
      help: 'Reqable JSON 导出路径；也可使用 REQABLE_ZHIHU_CAPTURE_FILE',
    },
  ],
  columns: [
    'rank',
    'type',
    'id',
    'title',
    'author',
    'votes',
    'comments',
    'excerpt',
    'url',
    'source',
  ],
  func: async (args) => {
    try {
      const query = validateQuery(args.query);
      const config = runtimeConfig(args);
      const source = resolveSource(config);
      const limit = validateLimit(args.limit, 20, 100);
      const waitSeconds = validateWaitSeconds(args['wait-seconds']);
      const rows = await readSearch(source, config, query, { limit, waitSeconds });
      if (rows.length === 0) {
        throw new EmptyResultError(
          'zhihu-mobile search',
          `No results for "${query}"`,
        );
      }
      return rows;
    } catch (error) {
      if (error instanceof EmptyResultError) throw error;
      throw asOpenCliError(error, 'zhihu-mobile search');
    }
  },
});
