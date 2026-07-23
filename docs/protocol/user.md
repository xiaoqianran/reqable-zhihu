# 用户与任务协议

## 1. 当前登录用户资料

### 基本信息

| 项 | 值 |
|----|-----|
| Method | `GET` |
| Host | `api.zhihu.com` |
| Path | `/people/self` |

### 示例

```http
GET /people/self HTTP/2
Host: api.zhihu.com
Authorization: Bearer <REDACTED>
x-app-id: 1355
... 公共头 + zse ...
```

### 响应字段（摘录）

| 字段 | 说明 |
|------|------|
| `id` | 用户 hash id |
| `url_token` | 个人主页 token（URL 段） |
| `name` | 昵称 |
| `avatar_url` / `avatar_url_template` | 头像 |
| `headline` | 一句话介绍 |
| `gender` | 性别枚举 |
| `vip_info` | 盐选会员相关 |
| `follower_count` / `following_count` | 粉丝 / 关注 |
| `answer_count` / `question_count` / `articles_count` | 创作计数 |
| `url` | `https://api.zhihu.com/people/{id}` |
| `uid` | 数字 uid |
| `is_bind_phone` | 是否绑手机 |
| `account_status` | 账号状态（如 lock 等） |
| `exposed_medal` | 展示勋章 |
| `ip_info` | IP 属地文案 |

完整 JSON 体积较大，适合作为「账号诊断」接口。

---

## 2. 「我的」页图标

```http
GET /people/homepage_mine_icon
Host: api.zhihu.com
```

### 响应示例

```json
{
  "icon": "",
  "icon_token": "",
  "text": "",
  "type": "default"
}
```

用于个人页入口角标 / 活动图标配置。

---

## 3. 使用 App 任务上报

```http
POST /usertask-core/action/use_app
Host: api.zhihu.com
Content-Type: application/json; charset=UTF-8
```

### Body 示例

```json
{
  "extra": { "duration": 120 },
  "action_time": 1784818277
}
```

| 字段 | 说明 |
|------|------|
| `action_time` | Unix 时间戳 |
| `extra.duration` | 使用时长（秒） |

### 响应

```json
{ "success": true }
```

与成长 / 任务体系相关，非内容接口。

---

## 4. 其它用户主页（模式）

抓包中他人主页多以：

- Web：`https://www.zhihu.com/people/{url_token}`  
- API 形态（常见社区惯例，需自行抓包确认当前 App）：  
  `GET /people/{url_token}` 或 hash id  

本仓库会话重点在 `self`；补充 PR 请附 Reqable 记录 id 或脱敏 cURL。

---

## 5. 隐私注意

`/people/self` 响应可能含：

- 脱敏手机号形态  
- 推送 channel  
- 账号惩罚提醒 HTML  

**禁止** 将真实响应入库或公开 issue 附件。
