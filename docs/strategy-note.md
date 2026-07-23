# OpenCLI Strategy Note

## 默认读取路径

Strategy: `COOKIE_API`（由远程电脑上的内置 OpenCLI 知乎 adapter 执行）

Contract: `stable`

Evidence:

- observed request/state: 现有 OpenCLI 1.8.6 注册了 `zhihu/recommend`、`zhihu/search`、`zhihu/answer-detail` 等 COOKIE 命令。
- auth source: 已登录 Chrome 会话；Cookie 由 OpenCLI Browser Bridge 管理，不传给手机。
- replay result: 当前工作区已确认 22 个知乎命令存在；实际联网验证依赖 Browser Bridge 扩展连接。

选择原因：

- 手机端只接收结构化结果，不接触 Cookie。
- 命令和分页逻辑直接复用 OpenCLI 现有实现。
- 第一阶段无需在 Android 上复刻 Chrome 扩展协议。

## Reqable / Android App 路径

Strategy: `INTERCEPT`

Contract: `internal-unstable`

Evidence:

- observed request/state: `GET api.zhihu.com/topstory/recommend`、`GET */answers/v2/{id}` 返回非空 JSON。
- auth source: Android App 自己生成的 Bearer、Cookie、`x-zse-96`、`x-zst-*` 和设备头。
- replay result: Reqable 能解密并读取成功响应；修改 URL 或长期重放原签名没有稳定契约。

Why PUBLIC_API / COOKIE_API are unavailable:

- App 推荐流包含 Web API 未必提供的卡片与实验字段。
- Android 签名与设备会话绑定，不能安全抽象成静态请求模板。

Why UI_SELECTOR / DOM_STATE are not safer:

- 目标数据是增量信息流和结构化正文，单屏 DOM 无法表达完整分页协议。
- App 场景没有可供 OpenCLI 直接读取的浏览器 DOM。

Why the maintenance cost is acceptable:

- Intercept 仅用于 App 独占数据、协议侦察、fixture 更新与故障修复。
- 默认用户路径仍是 remote COOKIE provider，不把高漂移策略扩散到全部命令。

## Capture file 路径

Strategy: `LOCAL`

Contract: `stable`

Evidence:

- observed state: Reqable 导出的记录包含 `url/request/response/body.text`。
- auth source: 不需要；只读取已经完成并由用户显式导出的本地响应。
- replay result: synthetic fixture 覆盖推荐和回答正文两类响应。

Capture provider 不发起知乎请求，因此不是签名绕过方案。
