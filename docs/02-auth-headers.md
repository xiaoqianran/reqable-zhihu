# 鉴权与公共请求头

> **安全警告**：切勿将真实 `Authorization`、`Cookie`、`x-udid` 提交到 Git。本文仅描述字段语义与形态。

## 登录态载体

知乎 Android 业务请求通常 **同时** 携带：

| 载体 | 示例形态 | 作用 |
|------|----------|------|
| `Authorization` | `Bearer 2.1...` | 主访问令牌 |
| `Cookie` | `z_c0=...; _xsrf=...; BEC=...` | Web 兼容登录态 / CSRF |
| `x-udid` | Base64 风格设备标识 | 设备维度识别 |

未登录或 token 失效时，部分接口 401，或返回降级数据。

### Cookie 字段（常见）

| 名 | 说明 |
|----|------|
| `z_c0` | 核心登录 cookie（与 Web 互通） |
| `_xsrf` | CSRF / 部分校验 |
| `BEC` | 边缘 / 会话相关，短时有效 |

Web 向文档中常见的 `d_c0` 多用于 **浏览器 x-zse-96**；Android App 抓包里设备侧更突出 `x-udid` + Bearer。不同端签名输入可能不同。

## 客户端身份头

| Header | 抓包观察示例 | 说明 |
|--------|----------------|------|
| `User-Agent` | `com.zhihu.android/Futureve/10.103.0 Mozilla/5.0 (Linux; Android 16; ...) Chrome/133...` | App + WebView 混合 |
| `x-app-version` | `10.103.0` | 客户端版本名 |
| `x-api-version` | `3.0.93` 或推荐接口上的 `3.1.8` | API 协议版本（接口间可能不同） |
| `x-app-bundleid` | `com.zhihu.android` | 包名 |
| `x-app-flavor` | `zhihuwap64` | 渠道 / 风味 |
| `x-app-build` | `release` | debug/release |
| `x-app-za` | `OS=Android&Release=16&Model=...&VersionName=10.103.0&...` | 设备与 App 元数据串 |
| `x-network-type` | `5G` / `WiFi` 等 | 网络类型 |
| `x-page-id` | 数字字符串 | 页面 / 场景 ID |
| `x-b3-traceid` | 32 hex | 分布式追踪 |
| `x-client-ri` | 数字 | 客户端请求标识类 |
| `x-ms-id` | 长串 | 会话 / 安全相关 |
| `x-suger` | Base64 长串 | 设备与地理等扩展信息（解码可见 UDID/OAID 等字段形态） |
| `x-ad` | `canvas_version:v=5.1;setting:cad=0` | 广告能力协商 |
| `x-zst-81` / `x-zst-82` | 固定形态较长串 | 设备指纹 / 安全令牌类 |
| `accept-encoding` | `br,gzip` | 压缩 |

推荐流还会出现大量广告样式相关头，例如：

- `x-ad-styles`：超长 `canvas_*=n;...` 能力位图  
- `x-close-recommend`、`x-feed-prefetch` 等实验/产品开关  

## 签名与风控：`x-zse-93` / `x-zse-96`

### 观察形态

```http
x-zse-93: 101_1_1.0
x-zse-96: 1.0_<base64-or-binary-looking-payload>
```

- 几乎所有 `api.zhihu.com` / `page-info.zhihu.com` **业务 JSON** 请求都会带。  
- **同一 URL 每次请求 `x-zse-96` 通常不同**。  
- 健康检查等轻量接口（纯 okhttp 探活）可能 **不带** 完整签名头。

### 含义（研究结论级别）

| 字段 | 含义 |
|------|------|
| `x-zse-93` | 签名算法 / 协议版本标识（抓包中较稳定） |
| `x-zse-96` | 对 URL（及可能 cookie/时间等）的 **请求签名** |

### 复打失败的常见原因

1. 复制了过期的 `Authorization` / `z_c0`  
2. 只改 query 未重算 `x-zse-96`  
3. Web 签名实现与 Android 端输入不一致  
4. 环境头（`x-app-za`、`x-udid`）与 token 绑定不一致  

本仓库 **不内嵌破解后的签名代码**。需要可运行的签名实现时，请参考：

- [cv-cat/ZhihuApis](https://github.com/cv-cat/ZhihuApis)（文档声称适配 x-zse-96/93，FastAPI）  
- 社区关于 x-zse-96 的逆向笔记（接口版本频繁变更，以最新仓库为准）

## appcloud 专用头

`GET https://appcloud2.zhihu.com/v3/config` 额外常见：

| Header | 说明 |
|--------|------|
| `x-app-key` | 应用 key |
| `x-app-id` | 应用数字 ID |
| `x-req-ts` | Unix 时间戳 |
| `x-req-signature` | 请求签名（hex） |
| `x-env` | 如 `online` |

与主 API 的 zse 体系 **不是同一套**，需单独分析。

## 脱敏 cURL 模板

```bash
curl -sS 'https://api.zhihu.com/topstory/recommend?action=down&limit=6&device=phone' \
  -H 'Authorization: Bearer <REDACTED>' \
  -H 'Cookie: z_c0=<REDACTED>; _xsrf=<REDACTED>' \
  -H 'x-udid: <REDACTED>' \
  -H 'x-app-version: 10.103.0' \
  -H 'x-api-version: 3.1.8' \
  -H 'x-app-bundleid: com.zhihu.android' \
  -H 'x-zse-93: 101_1_1.0' \
  -H 'x-zse-96: <MUST_REGENERATE>' \
  -H 'User-Agent: com.zhihu.android/Futureve/10.103.0 ...'
```

## 合规提示

- 仅分析 **自己账号、自己设备** 或已获授权的流量。  
- 不要公开分享含登录态的 HAR / Reqable 导出。  
- 本仓库示例一律使用占位符。
