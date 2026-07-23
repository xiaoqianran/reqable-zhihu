# reqable-zhihu

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-接口手册-blue)](./docs/00-overview.md)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-partial-lightgrey)](./schemas/openapi-zhihu-partial.yaml)

> **非官方、研究向**文档仓库：基于 **Reqable MITM** 对 **知乎 Android App（约 10.103.x）** 流量的逆向整理。  
> 不是知乎官方 SDK，不保证接口长期有效，**禁止**用于未授权采集或绕过安全机制的生产滥用。

---

## 这是什么？

把「抓包能看见、但散落在几千条记录里」的知乎 App 协议，整理成：

- 域名与基础设施说明  
- 鉴权 / 签名头语义（`Authorization`、`x-zse-96` 等）  
- **推荐流、热榜、回答详情、用户、配置** 等接口手册  
- 部分 **OpenAPI 草图**  
- **Reqable + 模拟器** 复现步骤  
- **相关开源项目** 导航（签名实现、热榜归档、mitm→OpenAPI、Reqable MCP…）

数据来源：真实抓包会话（Reqable + 可选 MCP 结构化导出）+ 人工归纳。

---

## 快速入口

| 文档 | 内容 |
|------|------|
| [docs/00-overview.md](./docs/00-overview.md) | 总览与能力边界 |
| [docs/01-domains.md](./docs/01-domains.md) | 域名 / HTTP-DNS / CDN |
| [docs/02-auth-headers.md](./docs/02-auth-headers.md) | 登录态与 x-zse-* |
| [docs/03-apis-feed.md](./docs/03-apis-feed.md) | **推荐流 / 热榜 / 动态** |
| [docs/04-apis-content.md](./docs/04-apis-content.md) | **回答详情 page-info** |
| [docs/05-apis-user.md](./docs/05-apis-user.md) | 用户 / 任务 |
| [docs/06-apis-infra.md](./docs/06-apis-infra.md) | 配置 / 健康检查 / 埋点 |
| [docs/07-capture-setup.md](./docs/07-capture-setup.md) | Reqable 抓包环境 |
| [docs/08-related-projects.md](./docs/08-related-projects.md) | **相关项目推荐** |
| [examples/](./examples/) | 脱敏请求/响应样例 |
| [schemas/openapi-zhihu-partial.yaml](./schemas/openapi-zhihu-partial.yaml) | 部分 OpenAPI |

---

## 核心接口一览（App）

| 场景 | Method | URL |
|------|--------|-----|
| 首页推荐 | `GET` | `https://api.zhihu.com/topstory/recommend` |
| 热榜 | `GET` | `https://api.zhihu.com/topstory/hot-lists/total` |
| 动态角标 | `GET` | `https://api.zhihu.com/moments/tab_v2` |
| 回答正文 | `GET` | `https://page-info.zhihu.com/answers/v2/{answer_token}` |
| 当前用户 | `GET` | `https://api.zhihu.com/people/self` |
| 使用上报 | `POST` | `https://api.zhihu.com/usertask-core/action/use_app` |
| 远程配置 | `GET` | `https://appcloud2.zhihu.com/v3/config` |
| 健康检查 | `GET` | `https://api.zhihu.com/check_health` → `~zhi` |

业务请求普遍需要：

```http
Authorization: Bearer …
Cookie: z_c0=…; _xsrf=…
x-zse-93: 101_1_1.0
x-zse-96: …   # 每次可能变化，需算法或现抓
```

细节见 [docs/02-auth-headers.md](./docs/02-auth-headers.md) 与各 API 章节。

---

## 数据流（推荐 → 全文）

```text
打开知乎首页
  → GET api.zhihu.com/topstory/recommend
  → 卡片里 content_id / route_url
  → 点击回答
  → GET page-info.zhihu.com/answers/v2/{token}
  → structured_content.segments（段落 + 图）
  → 图片 pic*.zhimg.com
```

---

## 推荐：相关开源项目（不局限本仓库）

完整列表与说明见 **[docs/08-related-projects.md](./docs/08-related-projects.md)**。精选：

### 签名 / 可调用逆向

- [cv-cat/ZhihuApis](https://github.com/cv-cat/ZhihuApis) — 知乎算法逆向，文档提及 **x-zse-96/93**、评论采集、FastAPI（较新，与本仓库互补）

### 经典非官方 API（可能过时）

- [lzjun567/zhihu-api](https://github.com/lzjun567/zhihu-api) — 社区常用 Python 向  
- [syaning/zhihu-api](https://github.com/syaning/zhihu-api) — Node 非官方 API（已 archive）

### 热榜 / 趋势归档（持续抓公开榜）

- [justjavac/zhihu-trending-top-search](https://github.com/justjavac/zhihu-trending-top-search)  
- [justjavac/zhihu-trending-hot-questions](https://github.com/justjavac/zhihu-trending-hot-questions)

### 抓包 → OpenAPI

- [alufers/mitmproxy2swagger](https://github.com/alufers/mitmproxy2swagger) — 流量自动生成 Swagger（高星）

### Reqable 生态

- [reqable/reqable-app](https://github.com/reqable/reqable-app)  
- [reqable/reqable-mcp-server](https://github.com/reqable/reqable-mcp-server) — 官方 MCP，AI 直接读抓包  
- [firdausmntp/reqable-cert-installer](https://github.com/firdausmntp/reqable-cert-installer) — 系统 CA 安装模块  

### 建议学习路径

```text
本仓库接口地图
  → Reqable / MCP 自己扩展
  → ZhihuApis 等解决签名
  → mitmproxy2swagger 固化 OpenAPI
  → trending 仓库做公开热度数据
```

---

## 如何用 Reqable 自己扩文档

详见 [docs/07-capture-setup.md](./docs/07-capture-setup.md)。

最短模拟器命令：

```powershell
adb reverse tcp:9000 tcp:9000
adb shell settings put global http_proxy 127.0.0.1:9000
# Reqable 开调试 + 装好 CA 后打开知乎 App
```

欢迎 PR：新增 path、补全评论列表 HTTP、修正版本差异。请 **不要** 提交含 Cookie/Bearer 的 HAR。

---

## 仓库结构

```text
reqable-zhihu/
├── README.md
├── LICENSE
├── docs/           # 完整接口与抓包手册
├── examples/       # 脱敏样例
└── schemas/        # OpenAPI 草图
```

---

## 免责声明

1. 接口来自公开客户端与自有账号流量分析，**非**知乎开放平台授权。  
2. 仅供学习、安全研究、个人调试。  
3. 请遵守法律法规与知乎用户协议；不得用于骚扰、未授权批量爬取或商业盗用内容。  
4. 作者不对接口变更、账号封禁或任何损失负责。

---

## Commit 规范

提交信息遵循阿里/约定式提交：`<type>(<scope>): <subject>`。详见 [docs/commit-convention.md](./docs/commit-convention.md)。

## License

[MIT](./LICENSE)
