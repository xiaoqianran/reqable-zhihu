# 搜索协议

## App 触发

知乎 Android App 接受 URL 编码的搜索 Deeplink：

```text
zhihu://search?q=<query>
```

该 URI 由 `RouterPortalActivity` 路由到 `SearchResultActivity`。使用 Deeplink 可以可靠传递中文、空格和其他 Unicode 字符，不依赖 ADB 键盘注入。

## 主结果接口

```http
GET https://api.zhihu.com/search_v3
```

关键 query：

| 参数 | 说明 |
|------|------|
| `q` | 搜索关键词 |
| `t=general` | 综合搜索 |
| `offset` / `limit` | 分页 |
| `search_source` | App 搜索场景 |
| `correction` | 搜索纠错开关 |

App 还会请求 `search/suggest`、`search/tabs`、`search/history/report` 等辅助接口；它们不是主要搜索结果，adapter 不读取。

## 响应结构

主响应为：

```text
data[]
  type
  object
    id / type
    title / name / excerpt
    author
    voteup_count / comment_count
paging
  is_end / next
```

`data` 同时包含业务结果和广告、热词等卡片。只有 `item.type == "search_result"` 才进入命令输出。

已观察的业务类型：

- `answer`
- `article`
- `question`
- `people`
- `topic`
- `pin`

输出 URL 会转换成 `www.zhihu.com` 或 `zhuanlan.zhihu.com` 的 canonical URL，方便继续传给详情命令或用户打开。

## 安全与稳定性

- 请求签名由 App 自己生成，插件不复制 Bearer、Cookie 或 `x-zse-*`。
- 触发前记录 Reqable ID，只接受本次新增响应。
- 响应 URL 的 `q` 必须与命令输入完全一致。
- 搜索是内部非稳定协议，字段变化通过脱敏 fixture 和 typed error 暴露。

## 验证记录

2026-07-24 使用查询词 `AI` 验证：

- Deeplink 成功进入 `SearchResultActivity`。
- `search_v3` 返回 HTTP 200 和 20 个原始卡片。
- 业务结果包含回答、专栏和用户。
- 广告、热词卡不会进入 normalizer 输出。
