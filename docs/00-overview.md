# 总览：从抓包到接口地图

## 研究背景

本仓库文档基于 **真实设备/模拟器流量**，使用：

| 组件 | 版本 / 说明 |
|------|-------------|
| 客户端 | 知乎 Android App **10.103.x**（包名 `com.zhihu.android`，UA 中 `Futureve`） |
| 抓包 | **Reqable** 桌面端 MITM（HTTPS 解密） |
| 链路 | 模拟器代理 / `adb reverse` → Reqable `:9000` → 可选二级代理 Clash `:7890` |
| AI 辅助 | Reqable **MCP** 拉取 live capture 做结构化分析 |

目标不是实现完整爬虫，而是沉淀一份 **可维护、可对照抓包复核** 的 **非官方接口手册**。

## 能力边界

### 已经能说明白的

- 主域名与职责划分  
- 推荐流 / 热榜 / 回答详情 / 用户信息等 **路径、方法、关键 query**  
- 公共 Header、登录态载体（Bearer / Cookie）  
- 响应 JSON 的大致结构（卡片、segments 正文等）  
- 与 App 操作的对应关系（打开首页 → 哪个 URL）

### 故意不承诺的

- **完整 x-zse-96 算法实现**（随版本变更，见 [02-auth-headers](./02-auth-headers.md) 与推荐项目）  
- 覆盖知乎 **全部** 业务线（直播、盐选、私信、搜索全量等需继续抓包补充）  
- 任何生产环境滥用、绕过风控或未授权数据获取  

## 接口分层（心智模型）

```text
┌─────────────────────────────────────────────┐
│  知乎 Android UI（推荐 / 热榜 / 回答页 / 我的） │
└───────────────────┬─────────────────────────┘
                    │ HTTPS (OkHttp / WebView)
        ┌───────────┴───────────┐
        ▼                       ▼
 api.zhihu.com          page-info.zhihu.com
 (列表/用户/任务)         (回答结构化正文)
        │                       │
        └───────────┬───────────┘
                    ▼
            图片 CDN zhimg.com
            配置 appcloud2 / AB
            HTTP-DNS / 埋点
```

## 文档索引

| 文档 | 内容 |
|------|------|
| [01-domains](./01-domains.md) | 域名与基础设施 |
| [02-auth-headers](./02-auth-headers.md) | 鉴权与签名头 |
| [03-apis-feed](./03-apis-feed.md) | 推荐流 / 热榜 / 动态 |
| [04-apis-content](./04-apis-content.md) | 回答 / 问题详情 |
| [05-apis-user](./05-apis-user.md) | 用户与任务 |
| [06-apis-infra](./06-apis-infra.md) | 配置 / 健康检查 / DNS / 埋点 |
| [07-capture-setup](./07-capture-setup.md) | Reqable + 模拟器抓包复现 |
| [08-related-projects](./08-related-projects.md) | 相关开源项目推荐 |
| [../schemas/openapi-zhihu-partial.yaml](../schemas/openapi-zhihu-partial.yaml) | 部分 OpenAPI 草图 |

## 复现一条请求的最短路径

1. 用 Reqable 抓到目标接口。  
2. 导出 **脱敏** cURL（去掉真实 Cookie / Bearer）。  
3. 对照本仓库对应章节核对 path 与 query。  
4. 若需自动签名，参考 [08-related-projects](./08-related-projects.md) 中的签名向项目，而不是硬编码抓包值。  

## 版本记录

| 日期 | 说明 |
|------|------|
| 2026-07-24 | 初版：基于 App 10.103.x + Reqable 会话整理 |
