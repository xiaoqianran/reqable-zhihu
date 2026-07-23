# 手机知乎 OpenCLI 架构

## 目标

让 OpenCLI 直接驱动 Android 知乎 App，并把 Reqable 捕获的本次 App 响应转换成稳定命令输出。

## 非目标

- 不实现验证码绕过、账号接管或风控规避。
- 不把 Reqable 捕获到的动态签名当作长期凭证。
- 不在第一阶段实现点赞、关注、评论、回答等写操作。
- 不复制或重写 OpenCLI 的参数解析、输出格式和 typed error 系统。

## 组件

```text
┌────────────────────────────────────────────┐
│ Android / Termux                           │
│ opencli zhihu-mobile <command>             │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────┐
│ OpenCLI plugin command layer               │
│ recommend / answer-detail / doctor         │
└──────────────────────┬─────────────────────┘
                       │ normalized provider API
          ┌────────────┼──────────────┬─────────────┐
          ▼            ▼              ▼             ▼
   ADB + Reqable   Remote gateway  Capture file   Fixture
          │            │              │             │
          ▼            ▼              ▼             ▼
  Android Zhihu   Desktop OpenCLI  Reqable export Offline tests
  App live traffic + Chrome
```

### 命令层

根目录 `.js` 文件只负责：

1. 声明 OpenCLI 命令、参数与 columns。
2. 使用 typed error 校验用户输入。
3. 选择 provider。
4. 将领域结果映射为稳定 row。

插件加载器只扫描插件根目录的 `.js` / `.ts`，因此 command entry 保持在根目录，复杂实现放在 `src/`。

### Provider 层

所有 provider 返回相同领域对象：

```js
{
  source: "adb" | "remote" | "capture" | "fixture",
  rows: []
}
```

- `AdbReqableProvider`：驱动 App 产生请求，轮询 Reqable live API 获取新增响应。
- `RemoteGatewayProvider`：兼容路径；调用可信电脑并复用 Chrome 登录态。
- `CaptureFileProvider`：读取用户显式提供的 Reqable JSON 导出，不重放签名请求。
- `FixtureProvider`：读取合成脱敏样例，只用于测试与开发。

当前 live API 使用 Reqable 本机的 `capture/live/filter` 与 `capture/live/get`，不依赖 AI 客户端或 MCP。

### Normalizer 层

知乎 Web 与 App 的同一业务字段路径不同。Normalizer 将其转换成稳定结构：

- 推荐卡片：`rank/type/title/author/votes/url/source`
- 回答正文：`id/author/votes/comments/questionId/questionTitle/url/createdAt/updatedAt/content/source`

所有 ID 保持字符串，避免超过 JavaScript 安全整数范围。

## 命名空间

实验阶段使用 `zhihu-mobile`，不覆盖 OpenCLI 已内置的 `zhihu` 命令。等 provider 和移动执行器稳定后，再讨论：

1. 向 OpenCLI 上游贡献 provider 能力；或
2. 在独立发行版中把 `zhihu-mobile` 映射为 `zhihu`。

## 数据流

### Remote

```text
phone command
  → POST gateway /v1/execute
  → allowlist + argument validation
  → spawn opencli zhihu recommend/answer-detail
  → parse JSON
  → normalize
  → phone output
```

### Capture

```text
Reqable export
  → select latest completed record by method/path/status
  → parse response.body.text
  → normalize App/Web payload
  → OpenCLI rows
```

### ADB + Reqable live

```text
snapshot matching capture IDs
  → ADB launch + one Home tap, or zhihu://answers/<id>
  → poll matching Reqable IDs
  → require new ID + adb process + 2xx + JSON
  → normalize App payload
  → OpenCLI rows
```

## 关键约束

- 网关用 `spawn` 参数数组，不通过 shell 拼接命令。
- 非 loopback 监听必须配置 Bearer token。
- capture 文件路径由用户显式提供或通过环境变量配置。
- fixture 永不作为 `auto` 的隐式 fallback。
- `auto` 固定选择 `adb`，不会无提示改走 Chrome。
- API 空结果抛 `EmptyResultError`，配置/协议错误抛 `CommandExecutionError`。
