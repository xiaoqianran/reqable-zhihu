# OpenCLI 数据获取策略

## 默认读取路径：Reqable / Android App

Strategy: `INTERCEPT`

Contract: `internal-unstable`

Evidence:

- observed request/state: `GET api.zhihu.com/topstory/recommend`、`GET */answers/v2/{id}` 返回非空 JSON。
- auth source: Android App 自己生成的 Bearer、Cookie、`x-zse-96`、`x-zst-*` 和设备头。
- replay result: 2026-07-24 已实测单次首页触发返回真实推荐；`recommend` 返回 2 条，第一条 ID 随后经 `answer-detail` 返回非空结构化正文。同一轮刷新可能由 App 自行预取多个分页响应。

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
- 推荐页只保留一次自然刷新动作，避免同一命令产生两轮显式 UI 刷新。App 内部预取多个分页响应不视为插件重复触发。
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

## 组合读取路径

`recommend-answers` 不引入新的数据策略。它串行复用推荐与回答详情两段 `INTERCEPT`，只把 `type=answer` 的推荐 URL 传入现有 `parseAnswerTarget` / `readAnswer` 契约。专栏和问题卡片不做隐式类型转换；批次没有回答时返回 typed empty error。

## 搜索路径

Strategy: `INTERCEPT`

Contract: `internal-unstable`

- observed request/state: `zhihu://search?q=<query>` 打开 `SearchResultActivity`，随后产生 `GET api.zhihu.com/search_v3?...&q=<query>`。
- auth source: Android App 自己生成 Bearer、Cookie、动态签名与设备头。
- replay result: 2026-07-24 使用 `AI` 实测返回 20 个原始卡片，包含非空 `answer/article/people` 业务结果。

公开/Cookie API 无法稳定复用 App 的搜索签名和实验参数；单屏 UI 也无法提供完整结构化字段。实现只接受本次新增且 `q` 与用户输入完全一致的 `search_v3` 响应，并过滤广告、热词等非 `search_result` 卡片。
