# Commit 规范（阿里巴巴 / Angular 约定式提交）

本仓库提交信息遵循 **约定式提交**，与阿里巴巴开放平台及多数国内 Java/前端项目常用格式一致。

## 格式

```text
<type>(<scope>): <subject>

<body>

<footer>
```

- `type`（必填）、`scope`（可选）、`subject`（必填）
- `subject` 使用祈使句、现在时；中英文均可；结尾不加句号
- `subject` 建议不超过 50 个字符（中文可略放宽）
- `body` 说明动机与变更要点，与标题空一行
- 禁止在 commit 中写入 Token、Cookie、抓包原文等敏感信息

## type 一览

| type | 含义 |
|------|------|
| `feat` | 新功能（新接口章节、新脚本等） |
| `fix` | 缺陷修复（文档错误、错误路径等） |
| `docs` | 仅文档变更 |
| `style` | 格式调整，不影响语义 |
| `refactor` | 重构（文档结构重组等） |
| `perf` | 性能相关（若有代码） |
| `test` | 测试相关 |
| `chore` | 构建、依赖、杂项 |
| `ci` | CI 配置 |
| `build` | 构建系统 |
| `revert` | 回滚 |

## scope 建议（本仓库）

| scope | 含义 |
|-------|------|
| `init` | 仓库初始化 |
| `feed` | 推荐/热榜 |
| `content` | 回答/问题详情 |
| `auth` | 鉴权与签名头 |
| `capture` | 抓包环境文档 |
| `openapi` | OpenAPI schema |
| `readme` | README / 推荐项目 |
| `examples` | examples 样例 |

## 示例

```text
docs(feed): 补充推荐流翻页 query 说明

完善 after_id、session_token 与 paging.next 的对应关系，
并增加冷启动/热启动示例 URL。
```

```text
fix(auth): 修正 x-zse-93 示例版本号

与 App 10.103.x 抓包中的 101_1_1.0 对齐。
```

```text
docs(readme): 更新相关开源项目链接
```

## 工具（可选）

本地可使用 [commitlint](https://commitlint.js.org/) + `@commitlint/config-conventional` 校验；与本规范兼容。
