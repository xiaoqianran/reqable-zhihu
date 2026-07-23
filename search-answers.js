import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import {
  resolveSource,
  runtimeConfig,
  validateLimit,
  validateMaxContent,
  validateQuery,
  validateWaitSeconds,
} from './src/runtime/config.js';
import { asOpenCliError } from './src/runtime/typed-errors.js';
import { readSearchAnswers } from './src/workflows/search-answers.js';

const SEARCH_ANSWER_SOURCES = Object.freeze(['auto', 'adb', 'capture', 'fixture']);

cli({
  site: 'zhihu-mobile',
  name: 'search-answers',
  access: 'read',
  description: '搜索手机知乎，并逐条展开结果中的所有回答正文',
  domain: 'localhost',
  strategy: Strategy.LOCAL,
  browser: false,
  defaultFormat: 'plain',
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
      choices: SEARCH_ANSWER_SOURCES,
      help: '数据源：auto / adb / capture / fixture；auto 使用 adb',
    },
    {
      name: 'limit',
      type: 'int',
      default: 5,
      help: '本轮检查的搜索结果数（1-20）',
    },
    {
      name: 'max-content',
      type: 'int',
      default: 0,
      help: '每篇正文最大字符数；0 表示完整正文',
    },
    {
      name: 'wait-seconds',
      type: 'int',
      default: 20,
      help: '等待每次手机 App 响应的秒数（1-120）',
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
    'id',
    'author',
    'votes',
    'comments',
    'questionId',
    'questionTitle',
    'url',
    'createdAt',
    'updatedAt',
    'content',
    'source',
  ],
  func: async (args) => {
    try {
      const query = validateQuery(args.query);
      const config = runtimeConfig(args);
      const source = resolveSource(config);
      const limit = validateLimit(args.limit, 5, 20);
      const maxContent = validateMaxContent(args['max-content']);
      const waitSeconds = validateWaitSeconds(args['wait-seconds']);
      const rows = await readSearchAnswers(source, config, query, {
        limit,
        maxContent,
        waitSeconds,
      });
      if (rows.length === 0) {
        throw new EmptyResultError(
          'zhihu-mobile search-answers',
          `No answer details for "${query}"`,
        );
      }
      return rows;
    } catch (error) {
      if (error instanceof EmptyResultError) throw error;
      throw asOpenCliError(error, 'zhihu-mobile search-answers');
    }
  },
});
