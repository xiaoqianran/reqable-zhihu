import { cli, Strategy } from '@jackwener/opencli/registry';
import { EmptyResultError } from '@jackwener/opencli/errors';
import { readAnswer } from './src/providers/index.js';
import {
  parseAnswerTarget,
  resolveSource,
  runtimeConfig,
  SOURCES,
  validateMaxContent,
} from './src/runtime/config.js';
import { asOpenCliError } from './src/runtime/typed-errors.js';

cli({
  site: 'zhihu-mobile',
  name: 'answer-detail',
  access: 'read',
  description: '读取知乎回答正文；支持远程执行器或 Reqable 导出',
  domain: 'localhost',
  strategy: Strategy.LOCAL,
  browser: false,
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
      help: '数据源：auto / remote / capture / fixture',
    },
    {
      name: 'max-content',
      type: 'int',
      default: 0,
      help: '正文最大字符数；0 表示不截断',
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
      const rows = await readAnswer(source, config, target, { maxContent });
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
