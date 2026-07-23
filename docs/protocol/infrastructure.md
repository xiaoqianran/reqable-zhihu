# 基础设施协议：配置 / 健康检查 / DNS / 埋点 / AB

## 1. 健康检查

高频、低信息量，分析业务时可过滤。

### api

```http
GET /check_health
Host: api.zhihu.com
User-Agent: okhttp/3.14.9
Cache-Control: no-cache
```

响应正文近似：

```text
~zhi
```

### www

```http
GET /check_health
Host: www.zhihu.com
```

同样返回 `~zhi` 类短文本，并可能 Set-Cookie `_xsrf` / `BEC`。

---

## 2. 远程配置 appcloud

```http
GET /v3/config
Host: appcloud2.zhihu.com
```

### 额外头

| Header | 说明 |
|--------|------|
| `x-app-key` | 如抓包中的 key 字符串 |
| `x-app-id` | 应用 ID |
| `x-req-ts` | 秒级时间戳 |
| `x-req-signature` | hex 签名 |
| `x-env` | `online` |

### 响应

超大 JSON：`config` 下含开关、实验、域名策略、WebView/X5、推送、阅读配置等。  
适合做 **客户端行为开关** 研究，不适合当内容 API。

---

## 3. AB 实验配置

```http
POST /ab/api/v1/products/zhihu/platforms/android/config
Host: api.zhihu.com
Content-Type: application/x-protobuf
```

- Body 为 **protobuf** 二进制（含 udid、设备 id、版本等）。  
- 响应可为 JSON，例如：

```json
{ "chains": [ { "chainId": "_all_" } ] }
```

---

## 4. 埋点 / Profiler

```http
POST /sc-profiler-zhapp
Host: www.zhihu.com
Content-Type: application/json
Content-Encoding: gzip
```

Body 为性能与特征计数数组（gzip）。与推荐内容无关，但说明 App 侧有独立上报通道。

---

## 5. HTTP DNS

见[域名与基础设施](./domains.md)。形态：

```http
GET /v2/resolv?host=api.zhihu.com,www.zhihu.com,...&uid=...&did=...&nettype=mobile&os=Android&version=10.103.0
Host: {dns-ip}
```

---

## 6. next-content-render（长文续拉）

回答详情 `structured_content.paging.next` 指向：

```http
GET https://api.zhihu.com/next-content-render?offset={n}&url_token={answer_token}&content_type=answer&version_id={id}
```

用于分页拉正文 segments。参数以详情响应为准。

---

## 7. 过滤建议（Reqable）

| 目的 | 过滤 |
|------|------|
| 只要业务 | host 含 `api.zhihu.com` 或 `page-info`，排除 `check_health` |
| 只要配置 | `appcloud2` 或 path `ab/api` |
| 只要 DNS | path `resolv` 或 method GET 到非 zhihu 域名但 query 含 `api.zhihu.com` |
