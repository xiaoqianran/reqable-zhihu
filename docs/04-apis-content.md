# 内容接口：回答 / 问题

## 1. 回答详情（结构化正文）

### 基本信息

| 项 | 值 |
|----|-----|
| Method | `GET` |
| Host | **`page-info.zhihu.com`**（注意不是 api） |
| Path | `/answers/v2/{answer_token}` |
| Query | `source=feed` 等 |

### 完整形态

```http
GET /answers/v2/1945077363542034415?source=feed
Host: page-info.zhihu.com
Authorization: Bearer <REDACTED>
Cookie: z_c0=<REDACTED>; _xsrf=<REDACTED>
x-zse-93: 101_1_1.0
x-zse-96: <MUST_REGENERATE>
... 其它公共头 ...
```

### Path 参数

| 参数 | 说明 |
|------|------|
| `answer_token` | 回答的长数字 token（推荐流 `content_id` / URL 中 answer 段） |

### 响应核心字段

| 字段 | 说明 |
|------|------|
| `id` | 回答 token |
| `author` | 作者：`name`、`url_token`、`avatar`、`id`、`headline` 等 |
| `header` | 问题标题区：`text`、`action_url`、`sub_title` |
| `question` | 嵌套问题：`id`、`title`、`answer_count`、`followers_count`、`url` |
| `excerpt` | 纯文本摘要 |
| `structured_content` | **正文主体** |
| `reaction` | 赞踩藏评统计与当前用户关系 |
| `content_end_info` | 创建时间、IP 属地等 |
| `biz_type_list` | 如 `["answer"]` |

### `structured_content` 结构

```jsonc
{
  "paging": "{ \"is_end\": true, \"next\": \"https://api.zhihu.com/next-content-render?...\", ... }",
  "segments": [
    {
      "id": "0",
      "type": "paragraph",
      "paragraph": {
        "text": "段落文本...",
        "marks": [
          { "type": "bold", "start_index": 0, "end_index": 2 }
        ],
        "pid": "..."
      }
    },
    {
      "id": "11",
      "type": "image",
      "image": {
        "token": "v2-....",
        "urls": ["https://pica.zhimg.com/..."],
        "width": 1080,
        "height": 608
      }
    }
  ]
}
```

| segment.type | 含义 |
|--------------|------|
| `paragraph` | 文本段，可含 bold / seg_like 等 marks |
| `image` | 图片，URL 在 `image.urls` |

### 长文分页

`structured_content.paging` 为 **JSON 字符串**（需二次 parse），`next` 指向：

```text
https://api.zhihu.com/next-content-render?offset=...&url_token=...&content_type=answer&version_id=...
```

用于继续拉取后续 segments。

### 问题对象内嵌 URL

```text
https://api.zhihu.com/questions/{question_id}
```

本次会话中更多作为 **嵌套字段** 出现；单独 GET 可在后续抓包中补全参数。

---

## 2. 从推荐到详情的数据流

```text
GET api.zhihu.com/topstory/recommend
        │
        │  content_id / route_url
        ▼
GET page-info.zhihu.com/answers/v2/{token}?source=feed
        │
        │  segments + images
        ▼
App 渲染回答页
        │
        │  图片
        ▼
GET pic*.zhimg.com/...
```

---

## 3. 评论

推荐卡片中评论入口常为 **路由** 而非直接 REST：

```text
zhihu://comment/list/answer/{answer_token}?open_editor=false&list_height_ratio=0.73&...
```

对应 HTTP 评论列表接口需在 **打开评论面板时** 再抓一轮（路径可能为 `api.zhihu.com` 下 comment 相关，随版本变化）。本仓库暂以路由形态记录，欢迎 PR 补充完整 HTTP 路径。

---

## 4. 内容 ID 体系（简化）

| 名称 | 出现位置 | 说明 |
|------|----------|------|
| `answer_token` / `content_id` | 推荐、详情 | 回答对外 token（很长的数字串） |
| `question_id` | 问题对象、热榜 `card_id` | 问题 ID；热榜 `Q_` 前缀 |
| `contentId`（business_ext） | 推荐 extra | 有时是另一套内部 id |
| `member hash id` | author.id | 用户 hash |

对接时优先使用 URL 与 `page-info` path 中的 **token**，避免混淆内部 id。

---

## 5. 与 Web URL 的对应

| Web | App API |
|-----|---------|
| `https://www.zhihu.com/question/{qid}/answer/{aid}` | page-info `/answers/v2/{aid}` + question 嵌套 `{qid}` |
| `https://www.zhihu.com/question/{qid}` | 热榜 link / 问题接口 |

---

## 6. 分析建议

1. 抓包过滤：`page-info` 或 path `answers/v2`。  
2. 用 jq 提取正文：`segments[?type=='paragraph'].paragraph.text`。  
3. 图片批量下载：收集 `type==image` 的 urls。  
4. 对比「仅推荐摘要」与「详情全文」字段差异，避免把 summary 当全文。
