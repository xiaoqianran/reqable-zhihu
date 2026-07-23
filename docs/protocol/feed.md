# 信息流协议：推荐 / 热榜 / 动态

## 1. 首页推荐流

### 基本信息

| 项 | 值 |
|----|-----|
| Method | `GET` |
| Host | `api.zhihu.com` |
| Path | `/topstory/recommend` |
| 协议 | HTTP/2 |
| 内容类型 | 响应 `application/json`（常 br 压缩） |

### 场景映射

| App 行为 | 典型 query |
|----------|------------|
| 冷启动首屏 | `start_type=cold`，`action=down`，`limit=10` |
| 热启动 / 再次进入 | `start_type=warm` |
| 上滑加载更多 | `action=down`，带 `page_number`、`after_id`、`session_token` |
| 点击后相关刷新 | 可能带 `is_click_recommend_request`、`click_content_token` 等 |

### Query 参数（抓包归纳）

| 参数 | 类型 | 说明 |
|------|------|------|
| `action` | string | 如 `down`、`pull`（分页方向） |
| `page_number` | int | 页码，从 1/2 递增 |
| `after_id` | string/int | 游标：上一页最后位置相关 |
| `end_offset` | int | 偏移 |
| `session_token` | string | 推荐会话 token，分页必须带齐 |
| `start_type` | string | `cold` / `warm` |
| `limit` | int | 条数，如 10 |
| `device` | string | `phone` |
| `refresh_scene` | int | 刷新场景码 |
| `is_feed_first_request` | 0/1 | 是否首屏请求 |
| `scroll` | string | 如 `up` |
| `ad_interval` | int | 广告间隔相关 |
| `component_frequency_state` | JSON string | 组件曝光频控状态 |
| `include_guide_relation` | bool | 引导关系 |
| `short_container_setting_value` | int | 容器实验 |
| `tsp_ad_cardredesign` | string | 广告卡片实验 |
| `feed_card_exp` | string | 卡片实验 |
| `v_serial` | int | 序列号 |
| `isDoubleFlow` | 0/1 | 双列 |
| `is_click_recommend_request` | bool | 点击后推荐 |
| `click_content_source` | string | 如 `normal` |
| `click_content_token` | string | 被点击内容 token |
| `click_content_type` | string | 如 `answer` |

### 冷启动示例 URL（脱敏）

```http
GET /topstory/recommend?tsp_ad_cardredesign=0&feed_card_exp=card_corner%7C1&v_serial=1&isDoubleFlow=0&action=down&refresh_scene=0&scroll=up&limit=10&start_type=cold&device=phone&short_container_setting_value=0&include_guide_relation=false&is_feed_first_request=0
Host: api.zhihu.com
```

### 翻页示例 URL（脱敏）

```http
GET /topstory/recommend?action=down&ad_interval=3&after_id=5&end_offset=6&page_number=2&session_token=<SESSION>&start_type=warm&refresh_scene=0&device=phone&...
```

### 响应结构（概念）

```jsonc
{
  "data": [
    {
      "id": "<card_id>",
      "type": "ComponentCard",
      "style": "card_padding_dynamic_...",
      "children": [
        /* Text / Line / Avatar / Reaction / Divider 等 UI 原子 */
      ],
      "action": {
        "type": "Route",
        "parameter": "route_url=https%3A%2F%2Fzhihu.com%2Fquestion%2F...%2Fanswer%2F..."
      },
      "extra": {
        "content_id": "<answer_token>",
        "content_type": "answer",
        "business_ext_map": {
          "passthrough_info": {
            "author": { "name": "...", "url_token": "...", "avatar": "..." },
            "content": { "title": "...", "summary": "..." },
            "reactions": {
              "vote": { "count": 0 },
              "collect": { "count": 0 },
              "comment": { "count": 0 }
            }
          }
        }
      }
    }
  ],
  "paging": {
    "is_end": false,
    "next": "https://api.zhihu.com/topstory/recommend?action=down&...",
    "previous": "..."
  },
  "feed_request_id": "...",
  "fresh_text": "推荐已更新"
}
```

### 从卡片到详情

1. 读 `extra.content_id` / `content_type`（多为 `answer`）。  
2. 或解析 `action.parameter` 里的 `route_url`。  
3. 详情正文走 **page-info**，见[内容协议](./content.md)。

---

## 2. 热榜

### 基本信息

| 项 | 值 |
|----|-----|
| Method | `GET` |
| Host | `api.zhihu.com` |
| Path | `/topstory/hot-lists/total` |

### Query

| 参数 | 示例 | 说明 |
|------|------|------|
| `limit` | `10` | 条数 |
| `is_browse_model` | `0` | 浏览模式 |
| `new_hot_list` | `false` | 新热榜开关 |

### 示例

```http
GET /topstory/hot-lists/total?limit=10&is_browse_model=0&new_hot_list=false
Host: api.zhihu.com
```

### 响应结构（概念）

```jsonc
{
  "data": [
    {
      "type": "hot_list_feed",
      "style_type": "10",
      "seq_num": 1,
      "card_id": "Q_<question_id>",
      "feed_specific": { "answer_count": 291 },
      "target": {
        "title_area": { "text": "热榜标题..." },
        "excerpt_area": { "text": "摘要..." },
        "image_area": { "url": "https://pic....zhimg.com/..." },
        "metrics_area": { "text": "xxxx 万热度" },
        "link": { "url": "https://www.zhihu.com/question/..." },
        "hot_event": {
          "event_id": "...",
          "event_name": "...",
          "pv_count": 0
        }
      },
      "card_label": { "type": "boiling" | "hot", "icon": "..." }
    }
  ]
}
```

---

## 3. 动态 Tab / 未读

### 基本信息

| 项 | 值 |
|----|-----|
| Method | `GET` |
| Path | `/moments/tab_v2` |

### Query

| 参数 | 示例 |
|------|------|
| `ab_param` | `only_dynamic` |
| `feed_type` | `recommend` |
| `update_time` | `0` |

### 响应示例

```json
{
  "unread_count": 198,
  "avatar_url": "",
  "show_count": false
}
```

---

## 4. 推荐接口相关 Header 补充

除公共鉴权头外，推荐流常见：

| Header | 说明 |
|--------|------|
| `x-api-version: 3.1.8` | 与其它接口的 `3.0.93` 不同，以抓包为准 |
| `x-ad-styles` | 广告组件能力声明（极长） |
| `x-close-recommend` | 关闭推荐相关 |
| `x-feed-prefetch` | 预取 |

---

## 5. 分析建议

1. Reqable 过滤：`topstory`。  
2. 对比 cold / warm / page_number=2 三次请求的 query 差集。  
3. 将 `session_token` 与 `paging.next` 视为分页协议核心。  
4. UI 原子（`ComponentCard`）适合做 **渲染协议** 研究；业务爬取可优先挖 `passthrough_info`。
