# 协议域名与基础设施

## 业务域名

| 域名 | 角色 | 典型流量 |
|------|------|----------|
| `api.zhihu.com` | **主业务 API** | 推荐、热榜、用户、任务、AB、健康检查 |
| `page-info.zhihu.com` | **内容详情渲染** | `/answers/v2/{token}` 结构化正文 |
| `www.zhihu.com` | Web / 部分 App 上报 | `check_health`、`sc-profiler-zhapp` |
| `appcloud2.zhihu.com` | 远程配置中心 | `/v3/config` |
| `zhuanlan.zhihu.com` | 专栏（Web 向，本次会话较少） | 文章页 |
| `api-quic.zhihu.com` | QUIC 通道（HTTP-DNS 列表中出现） | 需注意是否被 MITM 代理到 |
| `apm.zhihu.com` | APM | 性能监控 |
| `m-cloud.zhihu.com` | 云相关 | HTTP-DNS 列表 |
| `zhihu-web-analytics.zhihu.com` | 分析 | 埋点类 |
| `duga.zhihu.com` | 推送 / 其它 | HTTP-DNS 列表 |

## 静态资源

| 域名 | 角色 |
|------|------|
| `picx.zhimg.com` / `pica.zhimg.com` / `pic1.zhimg.com` 等 | 图片 CDN |
| 其它 `*.zhimg.com` | 媒体资源 |

业务接口返回的 URL 常指向 zhimg；**正文 JSON 在 api / page-info，图片在 CDN**。

## HTTP DNS

抓包中出现类似：

```http
GET http://{dns-server-ip}/v2/resolv?host=apm.zhihu.com,api.zhihu.com,www.zhihu.com,...&uid=...&did=...&nettype=mobile&os=Android&version=10.103.0
```

- 返回 JSON：各 `host` → IPv4/IPv6 列表、`vendor`（如 tx/ksy）、`ttl`。  
- 客户端可能 **不依赖系统 DNS**，直连解析结果 IP。  
- 抓包时若只拦域名过滤，注意 **裸 IP + Host 头** 的请求。

### 响应结构（示意）

```json
{
  "client_ip_v4": "...",
  "belong": "运营商_地区",
  "dns": [
    {
      "host": "api.zhihu.com",
      "ips": [
        { "ip": "...", "version": "v4", "type": "edge", "vendor": "tx" }
      ]
    }
  ],
  "ttl": 300
}
```

## 协议与栈

| 观察 | 说明 |
|------|------|
| HTTP/2 | `api.zhihu.com` 上大量业务请求为 h2 |
| OkHttp | 健康检查 UA 为 `okhttp/3.14.9` |
| WebView UA | 业务请求 UA 混有 `Chrome/133... Mobile Safari` + App 标识 |
| 压缩 | `br` / `gzip` 常见；Reqable 解密后多为明文 JSON |
| 二级代理 | 研究环境中 Reqable → `127.0.0.1:7890`（Clash）出网 |

## 流量占比（定性，基于一次完整刷推荐会话）

1. **最多**：`api.zhihu.com/topstory/*`、图片 CDN  
2. **中等**：`page-info` 回答详情、用户接口、配置  
3. **高频但低价值**：`check_health`、埋点 profiler  
4. **低频基础设施**：HTTP-DNS、AB config  

分析业务时优先过滤：

```text
host: api.zhihu.com OR host: page-info.zhihu.com
NOT path: check_health
```
