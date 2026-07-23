# 相关开源项目推荐

下列项目与本仓库互补：**签名实现、历史 API 封装、热榜归档、抓包转 OpenAPI、Reqable 生态** 等。  
星标与活跃度会变化，请以 GitHub 页面为准。收录仅为导航，不代表背书或可合法商用。

---

## 一、知乎签名 / 较新的逆向向

| 项目 | 说明 | 链接 |
|------|------|------|
| **cv-cat/ZhihuApis** | 知乎算法逆向；文档提到 **x-zse-96 / x-zse-93**、评论采集、FastAPI 服务；相对新、与「能看接口但签不了名」场景互补 | https://github.com/cv-cat/ZhihuApis |

本仓库侧重 **MITM 文档化接口地图**；ZhihuApis 侧重 **可调用的签名与服务**。可组合使用。

---

## 二、知乎非官方 API / 爬虫库（经典，部分停更）

| 项目 | Stars 量级 | 说明 | 链接 |
|------|------------|------|------|
| **lzjun567/zhihu-api** | ~1k | “Zhihu API for Humans”，社区常用入口 | https://github.com/lzjun567/zhihu-api |
| **syaning/zhihu-api** | ~260 | Node 非官方 API（已 archive） | https://github.com/syaning/zhihu-api |
| **syaning/zhihuapi-py** | — | Python 对应文档站 | https://syaning.github.io/zhihuapi-py/ |
| **littlepai/Unofficial-Zhihu-API** | ~70+ | 会话管理 + 验证码等爬取向 | https://github.com/littlepai/Unofficial-Zhihu-API |

注意：经典库 **极易因 x-zse / 风控变更而失效**，对照本仓库 App 10.103.x 路径时需重新抓包验证。

---

## 三、热榜 / 趋势数据归档（持续更新向）

| 项目 | 说明 | 链接 |
|------|------|------|
| **justjavac/zhihu-trending-top-search** | 知乎热搜归档，定时抓取 | https://github.com/justjavac/zhihu-trending-top-search |
| **justjavac/zhihu-trending-hot-questions** | 知乎热门话题归档 | https://github.com/justjavac/zhihu-trending-hot-questions |
| **justjavac/zhihu-trending-hot-video** | 热门视频归档 | https://github.com/justjavac/zhihu-trending-hot-video |

适合做 **公开趋势分析 / 数据集**，与 App 推荐流（`/topstory/recommend`）数据源不同，但同属「知乎公开信息」研究。

本仓库热榜接口：`GET /topstory/hot-lists/total`（见 [03-apis-feed](./03-apis-feed.md)）。

---

## 四、抓包 → 接口文档自动化

| 项目 | 说明 | 链接 |
|------|------|------|
| **alufers/mitmproxy2swagger** | 从 mitmproxy 流量自动生成 OpenAPI/Swagger，**9k+ stars** | https://github.com/alufers/mitmproxy2swagger |
| **Arkptz/mitm2openapi** | Rust 向 HAR/mitm → OpenAPI | https://github.com/Arkptz/mitm2openapi |

工作流建议：

```text
Reqable 导出 HAR → mitmproxy2swagger / 手工整理 → 合并进本仓库 schemas/
```

本仓库已提供手工维护的 [openapi-zhihu-partial.yaml](../schemas/openapi-zhihu-partial.yaml)。

---

## 五、Reqable 生态

| 项目 | 说明 | 链接 |
|------|------|------|
| **reqable/reqable-app** | 官方 Issue / 产品仓库 | https://github.com/reqable/reqable-app |
| **reqable/reqable-mcp-server** | 官方 MCP：AI 直接读抓包、操作规则 | https://github.com/reqable/reqable-mcp-server |
| **ElonJask/reqable-mcp** | 社区 MCP 实现 | https://github.com/ElonJask/reqable-mcp |
| **firdausmntp/reqable-cert-installer** | Magisk/KSU 等安装 Reqable 系统 CA | https://github.com/firdausmntp/reqable-cert-installer |
| **reqable/reqable-docs** | 文档相关 | https://github.com/reqable/reqable-docs |

官方 MCP 文档：https://reqable.com/docs/mcp/

---

## 六、Android HTTPS 拦截相关

| 项目 | 说明 | 链接 |
|------|------|------|
| **0xSHAK1B/TIKTOK-SSL-Pinning-Bypass** | 证书固定绕过思路（其它 App，方法可参考） | https://github.com/0xSHAK1B/TIKTOK-SSL-Pinning-Bypass |

知乎是否全面 Pinning 因版本而异；本次 10.103.x 研究中 **大量 API 可被系统 CA MITM**。若遇 SSL 失败，再考虑 Frida/objection 等（不在本仓库范围）。

---

## 七、通用媒体爬虫（含多平台）

社区常有 **MediaCrawler** 一类多平台爬虫（微博/小红书/知乎等），分支众多、合规风险高。使用前请：

1. 确认许可证与作者声明；  
2. 仅用于授权研究；  
3. 用本仓库接口表 **核对** 其知乎模块是否已过时。

---

## 八、推荐学习路径

```text
1. 本仓库 docs/*          → 知道 App 打了哪些 URL
2. Reqable + MCP          → 自己复现、扩展接口表
3. ZhihuApis / 签名笔记   → 解决 x-zse-96 复打
4. mitmproxy2swagger      → 把新抓包变成 OpenAPI
5. trending 归档仓库      → 做公开热度数据，不碰登录态
```

---

## 九、如何向本列表 PR

欢迎补充：

- 近 12 个月仍活跃的知乎逆向 / 文档项目  
- 明确支持 Android App 协议的库  
- 与 Reqable / mitm 工作流集成的工具  

请附：仓库链接、最后更新时间、与本仓库的差异一句话。
