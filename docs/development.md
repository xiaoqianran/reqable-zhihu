# 开发指南

## 环境

- Node.js 21+
- OpenCLI 1.8.6+
- PowerShell、bash 或 Termux

## 本地验证

```bash
npm test
npm run check
opencli plugin install file://<repo>
opencli list -f json
opencli zhihu-mobile doctor
opencli zhihu-mobile recommend --source fixture --limit 2 -f json
```

## 新命令规则

1. 根目录增加一个 command entry。
2. 先在 `docs/strategy-note.md` 增加 strategy 证据。
3. 解析实现放到 `src/`。
4. columns 使用 camelCase，≤ 15 列。
5. 参数越界明确抛 `ArgumentError`，不得 silent clamp。
6. 空结果抛 `EmptyResultError`，不得返回 sentinel row。
7. 新增合成 fixture、单元测试和 `verify/` 模板。

## Reqable 样本

原始抓包只能存入 Git 忽略的 `capture-exports/`。用于测试的 fixture 必须：

- 删除所有请求头与 Cookie。
- 替换用户、内容和设备 ID。
- 使用合成文本。
- 保留解析所需的字段层级。

## Commit

使用阿里/Angular 约定式提交：

```text
feat(mobile): 增加远程执行纵向切片
docs(architecture): 记录 provider 选择
test(normalizer): 覆盖 App 推荐卡片
```

提交前检查：

```bash
git diff --check
npm test
npm run check
git status --short
```
