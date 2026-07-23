import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { readAnswer } from './src/providers/index.js';
import {
  parseAnswerTarget,
  resolveSource,
  runtimeConfig,
  SOURCES,
  validateMaxContent,
  validateWaitSeconds,
} from './src/runtime/config.js';
import { asOpenCliError } from './src/runtime/typed-errors.js';

cli({
  site: 'zhihu-mobile',
  name: 'answer-detail',
  access: 'read',
  description: '在 Android 知乎 App 打开回答，并从 Reqable 实时抓包读取正文',
  domain: 'localhost',
  strategy: Strategy.LOCAL,
  browser: false,
  defaultFormat: 'plain',
  args: [
    {
      name: 'target',
      type: 'string',
      required: true,
      positional: true,
      help: '回答 ID、知乎回答 URL 或 answer:<questionId>:<answerId>',
    },
    {
      name: 'source',
      type: 'string',
      default: 'auto',
      choices: SOURCES,
      help: '数据源：auto / adb / remote / capture / fixture；auto 使用 adb',
    },
    {
      name: 'max-content',
      type: 'int',
      default: 0,
      help: '正文最大字符数；0 表示不截断',
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
      const target = parseAnswerTarget(args.target);
      const config = runtimeConfig(args);
      const source = resolveSource(config);
      const maxContent = validateMaxContent(args['max-content']);
      const waitSeconds = validateWaitSeconds(args['wait-seconds']);
      const rows = await readAnswer(source, config, target, {
        maxContent,
        waitSeconds,
      });
      if (rows.length === 0) {
        throw new EmptyResultError(
          'zhihu-mobile answer-detail',
          `The ${source} source returned no answer content for ${target.answerId}`,
        );
      }
      return rows;
    } catch (error) {
      if (error instanceof EmptyResultError) throw error;
      throw asOpenCliError(error, 'zhihu-mobile answer-detail');
    }
  },
});
