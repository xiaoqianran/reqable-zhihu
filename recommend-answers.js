import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import {
  resolveSource,
  runtimeConfig,
  SOURCES,
  validateLimit,
  validateMaxContent,
  validateWaitSeconds,
} from './src/runtime/config.js';
import { asOpenCliError } from './src/runtime/typed-errors.js';
import { readRecommendedAnswers } from './src/workflows/recommend-answers.js';

cli({
  site: 'zhihu-mobile',
  name: 'recommend-answers',
  access: 'read',
  description: '读取一批手机知乎推荐，并逐条展开其中所有回答正文',
  domain: 'localhost',
  strategy: Strategy.LOCAL,
  browser: false,
  defaultFormat: 'plain',
  args: [
    {
      name: 'source',
      type: 'string',
      default: 'auto',
      choices: SOURCES,
      help: '数据源：auto / adb / remote / capture / fixture；auto 使用 adb',
    },
    {
      name: 'limit',
      type: 'int',
      default: 5,
      help: '本轮检查的推荐卡片数（1-20）',
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
      const config = runtimeConfig(args);
      const source = resolveSource(config);
      const limit = validateLimit(args.limit, 5, 20);
      const maxContent = validateMaxContent(args['max-content']);
      const waitSeconds = validateWaitSeconds(args['wait-seconds']);
      const rows = await readRecommendedAnswers(source, config, {
        limit,
        maxContent,
        waitSeconds,
      });
      if (rows.length === 0) {
        throw new EmptyResultError(
          'zhihu-mobile recommend-answers',
          `The ${source} source returned no recommended answer details`,
        );
      }
      return rows;
    } catch (error) {
      if (error instanceof EmptyResultError) throw error;
      throw asOpenCliError(error, 'zhihu-mobile recommend-answers');
    }
  },
});
