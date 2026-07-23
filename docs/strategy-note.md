# OpenCLI Strategy Note

## 默认读取路径：Reqable / Android App

Strategy: `INTERCEPT`

Contract: `internal-unstable`

Evidence:

- observed request/state: `GET api.zhihu.com/topstory/recommend`、`GET */answers/v2/{id}` 返回非空 JSON。
- auth source: Android App 自己生成的 Bearer、Cookie、`x-zse-96`、`x-zst-*` 和设备头。
- replay result: 2026-07-24 已实测 `recommend` 返回 2 条新推荐，第一条 ID 随后经 `answer-detail` 返回非空结构化正文。

Why PUBLIC_API / COOKIE_API are unavailable:

- App 推荐流包含 Web API 未必提供的卡片与实验字段。
- Android 签名与设备会话绑定，不能安全抽象成静态请求模板。

Why UI_SELECTOR / DOM_STATE are not safer:

- 目标数据是增量信息流和结构化正文，单屏 DOM 无法表达完整分页协议。
- App 场景没有可供 OpenCLI 直接读取的浏览器 DOM。

Why the maintenance cost is acceptable:

- Intercept 仅用于 App 独占数据、协议侦察、fixture 更新与故障修复。
- provider 只读取 App 本次合法获得的响应，不重放请求；fixture 和 typed error 暴露漂移。

实现边界：

- 命令声明仍是 `Strategy.LOCAL`、`browser: false`，因为 OpenCLI 只连接本机 ADB/Reqable；内部数据策略是 `INTERCEPT`。
- 触发前记录 Reqable ID 快照，只接受新增记录。
- 记录必须来自 `adb` 进程、URL 匹配、HTTP 2xx 且正文为 JSON。
- Reqable 的无时区时间戳不参与新旧判断，避免本地时区误差。

## 远程兼容路径

Strategy: `COOKIE_API`

Contract: `stable`

- observed request/state: OpenCLI 内置 `zhihu/recommend` 与 `zhihu/answer-detail`。
- auth source: 已登录 Chrome 会话。
- replay result: 仅在显式 `--source remote` 时使用。

## Capture file 路径

Strategy: `LOCAL`

Contract: `stable`

Evidence:

- observed state: Reqable 导出的记录包含 `url/request/response/body.text`。
- auth source: 不需要；只读取已经完成并由用户显式导出的本地响应。
- replay result: synthetic fixture 覆盖推荐和回答正文两类响应。

Capture provider 不发起知乎请求，因此不是签名绕过方案。
