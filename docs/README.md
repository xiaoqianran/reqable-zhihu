# 文档中心

文档按“如何使用、为什么这样设计、协议证据、如何贡献”组织。第一次使用请从命令手册开始，不需要先读协议研究。

## 开始使用

- [命令手册](./getting-started/commands.md)：安装、诊断、推荐、搜索、组合读取、回答详情、数据源和调试参数。
- [配置 Android 与 Reqable](./getting-started/android-reqable.md)：ADB reverse、系统代理、CA 与抓包过滤。

## 设计与演进

- [架构](./design/architecture.md)：OpenCLI 命令层、provider、normalizer 与真实手机数据流。
- [数据获取策略](./design/strategy.md)：为什么选择 App 触发 + Reqable intercept。
- [运行时与安全](./design/runtime-security.md)：source 选择、凭证边界与错误模型。
- [演进路线](./design/roadmap.md)：已经交付的能力和下一阶段优先级。

## 协议研究

- [协议总览](./protocol/README.md)
- [域名与基础设施](./protocol/domains.md)
- [鉴权与公共请求头](./protocol/authentication.md)
- [信息流协议](./protocol/feed.md)
- [搜索协议](./protocol/search.md)
- [内容协议](./protocol/content.md)
- [用户与任务协议](./protocol/user.md)
- [基础设施协议](./protocol/infrastructure.md)

协议文档记录抓包证据和字段结构，不代表稳定的公开 API。生产命令默认让知乎 App 自己生成会话和签名，插件只读取本次响应。

## 参与开发

- [开发指南](./contributing/development.md)
- [Commit 规范](./contributing/commits.md)
- [相关项目与参考实现](./contributing/related-projects.md)

## 当前主路径

```text
opencli zhihu-mobile
  → ADB 驱动已登录的知乎 App
  → App 自己发起签名请求
  → Reqable live API 返回本次响应
  → normalizer 输出稳定字段
```

`auto` 当前固定选择 `adb`。Chrome 网关只作为显式 `--source remote` 的兼容路径，不参与默认执行。
