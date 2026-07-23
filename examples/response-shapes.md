# 响应形态速查

## 推荐卡片（简化）

```json
{
  "data": [
    {
      "type": "ComponentCard",
      "extra": {
        "content_id": "1987175670867055855",
        "content_type": "answer",
        "business_ext_map": {
          "passthrough_info": {
            "author": {
              "name": "示例作者",
              "url_token": "example-token",
              "avatar": "https://picx.zhimg.com/..."
            },
            "content": {
              "title": "问题标题",
              "summary": "回答摘要……"
            },
            "reactions": {
              "vote": { "count": 100, "is_up": false },
              "collect": { "count": 20, "is_collect": false },
              "comment": { "count": 5 }
            }
          }
        }
      },
      "action": {
        "type": "Route",
        "parameter": "route_url=https%3A%2F%2Fzhihu.com%2Fquestion%2F123%2Fanswer%2F456"
      }
    }
  ],
  "paging": {
    "is_end": false,
    "next": "https://api.zhihu.com/topstory/recommend?..."
  }
}
```

## 热榜条目（简化）

```json
{
  "type": "hot_list_feed",
  "seq_num": 1,
  "card_id": "Q_2061502500440465960",
  "target": {
    "title_area": { "text": "热榜标题" },
    "metrics_area": { "text": "2412 万热度" },
    "link": { "url": "https://www.zhihu.com/question/..." }
  }
}
```

## 回答详情 segments（简化）

```json
{
  "id": "1945077363542034415",
  "author": { "name": "作者", "url_token": "xxx" },
  "header": { "text": "问题标题" },
  "structured_content": {
    "segments": [
      {
        "type": "paragraph",
        "paragraph": { "text": "第一段", "marks": [] }
      },
      {
        "type": "image",
        "image": {
          "urls": ["https://pica.zhimg.com/..."],
          "width": 1080,
          "height": 608
        }
      }
    ]
  }
}
```

## 用户 self（极简）

```json
{
  "id": "<hash>",
  "url_token": "example",
  "name": "昵称",
  "avatar_url": "https://picx.zhimg.com/...",
  "follower_count": 0,
  "following_count": 1,
  "vip_info": { "is_vip": false }
}
```
