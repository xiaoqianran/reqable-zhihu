# 示例请求（全部脱敏）

以下 **不能直接 curl 成功**，仅作字段对照。请从自己的 Reqable 会话复制最新签名与登录态。

## 推荐流（冷启动）

```http
GET /topstory/recommend?action=down&limit=10&start_type=cold&device=phone&refresh_scene=0&is_feed_first_request=0 HTTP/2
Host: api.zhihu.com
Authorization: Bearer <REDACTED>
Cookie: z_c0=<REDACTED>; _xsrf=<REDACTED>
x-udid: <REDACTED>
x-app-version: 10.103.0
x-api-version: 3.1.8
x-app-bundleid: com.zhihu.android
x-app-flavor: zhihuwap64
x-app-build: release
x-zse-93: 101_1_1.0
x-zse-96: <REGENERATE>
User-Agent: com.zhihu.android/Futureve/10.103.0 Mozilla/5.0 (Linux; Android 16; ...) Chrome/133.0.0.0 Mobile Safari/537.36
```

## 热榜

```http
GET /topstory/hot-lists/total?limit=10&is_browse_model=0&new_hot_list=false HTTP/2
Host: api.zhihu.com
Authorization: Bearer <REDACTED>
x-zse-93: 101_1_1.0
x-zse-96: <REGENERATE>
```

## 回答详情

```http
GET /answers/v2/<answer_token>?source=feed HTTP/1.1
Host: page-info.zhihu.com
Authorization: Bearer <REDACTED>
Cookie: z_c0=<REDACTED>
x-zse-93: 101_1_1.0
x-zse-96: <REGENERATE>
```

## 当前用户

```http
GET /people/self HTTP/2
Host: api.zhihu.com
Authorization: Bearer <REDACTED>
x-zse-96: <REGENERATE>
```

## 使用时长上报

```http
POST /usertask-core/action/use_app HTTP/2
Host: api.zhihu.com
Content-Type: application/json; charset=UTF-8
Authorization: Bearer <REDACTED>
x-zse-96: <REGENERATE>

{"extra":{"duration":120},"action_time":1700000000}
```

## 从 Reqable 生成真实 cURL

1. 选中一条已成功 200 的记录。  
2. 使用「生成 cURL」或 MCP `capture_live_generate_curl`。  
3. 本地保存到 **不入库** 的 `secrets/` 目录测试。  
4. 将 path/query **结构** 回写进 `docs/`，不要提交 secrets。
