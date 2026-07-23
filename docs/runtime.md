# 运行与安全模型

## 执行源

| source | 位置 | 凭证 | 适用阶段 |
|--------|------|------|----------|
| `adb` | Android + Reqable | App 会话留在手机 | 默认 |
| `remote` | 可信电脑 | Chrome 会话留在电脑 | 兼容 |
| `capture` | 手机或电脑本地文件 | 无运行时凭证 | 抓包复盘 |
| `fixture` | 插件内置文件 | 无 | 测试 |
| Android WebView | 手机 Companion | Android Keystore/WebView | 后续 |
| Reqable live API | 电脑本机 | Reqable 本地会话 | 已实现 |

## 配置

```text
ZHIHU_MOBILE_SOURCE=auto|adb|remote|capture|fixture
ZHIHU_MOBILE_ADB_PATH=adb
ZHIHU_MOBILE_ADB_SERIAL=emulator-5554
REQABLE_ZHIHU_URL=http://127.0.0.1:9000
ZHIHU_MOBILE_GATEWAY_URL=http://127.0.0.1:17830
ZHIHU_MOBILE_GATEWAY_TOKEN=<secret>
REQABLE_ZHIHU_CAPTURE_FILE=/path/to/export.json
ZHIHU_MOBILE_GATEWAY_HOST=127.0.0.1
ZHIHU_MOBILE_GATEWAY_PORT=17830
```

`auto` 使用 `adb`。它不会回退到 Chrome、capture 或 fixture；手机链路异常会明确失败。

## 网关边界

允许的命令：

- `zhihu recommend`
- `zhihu answer-detail`

网关拒绝：

- 任意 site/command 拼接
- OpenCLI 通用写命令
- `--execute`
- 未知参数
- 超出上限的 `limit` / `max-content`

默认监听 loopback。绑定 `0.0.0.0` 时必须配置令牌；生产化前建议通过 Tailscale、WireGuard 或反向代理 TLS 使用。

## 敏感信息

下列内容不得进入 Git、正常 CLI 输出或网关错误响应：

- `Authorization`
- `Cookie`
- `x-zse-*`
- `x-zst-*`
- `x-udid`
- `x-suger`
- 手机号、私信、账号私有资料

网关只返回 OpenCLI 结构化 stdout、稳定退出码和截断后的 stderr。

## 退出码

沿用 OpenCLI typed error：

| 场景 | 错误 | exit |
|------|------|------|
| 参数错误 | `ArgumentError` | 2 |
| 合法空结果 | `EmptyResultError` | 66 |
| 执行/协议错误 | `CommandExecutionError` | 1 |
| 登录失效 | `AuthRequiredError` | 77 |
| 超时 | `TimeoutError` | 75 |
