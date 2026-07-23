# 演进路线

## Phase 0：协议知识库

状态：已完成

- Reqable 抓包环境
- 域名、鉴权和主要 API
- 推荐流与结构化正文
- 部分 OpenAPI

## Phase 1：可安装插件与远程纵向切片

状态：已完成，保留为兼容源

- OpenCLI plugin manifest
- `zhihu-mobile doctor`
- `zhihu-mobile recommend`
- `zhihu-mobile answer-detail`
- 可信电脑执行网关
- 合成 fixture 与单元测试

验收：

- 手机端通过网关返回推荐列表。
- 推荐 URL 可继续传给正文命令。
- 凭证不离开执行电脑。
- capture/fixture normalizer 离线通过。

## Phase 2：Reqable 本地桥接

状态：已完成

- 定义脱敏 capture export schema。
- 支持从 Reqable MCP 查询最新匹配记录。
- 对 schema 漂移生成可读诊断。
- 自动生成不含凭证的 fixture 候选。

## Phase 3：Android Companion

- Android WebView 登录容器。
- loopback-only bridge。
- 最小 `goto/fetchJson/getCurrentUrl/sessionStatus`。
- Android Keystore 保存 bridge token。
- Termux 内完全本地运行 COOKIE 类命令。

## Phase 4：App Intercept Provider

状态：推荐与回答正文纵向切片已完成

- 通过 Intent/用户操作触发知乎 App 请求。
- 等待匹配的 Reqable response。
- 支持 App 独占推荐卡片和结构化正文。
- 不实现静态签名复制或验证码绕过。

## Phase 5：扩大只读命令

候选顺序：

1. `hot`
2. `search`
3. `question`
4. `answer-comments`
5. `user`

写操作必须单独安全评审，不自动继承只读 provider 的权限。
