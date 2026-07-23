# 产品演进路线

路线图从当前可用产品出发，不再按早期原型的实现顺序组织。

## 当前基线：真实 Android 纵向切片

状态：已交付

- GitHub 可安装的 OpenCLI 插件与 `zhihu-mobile` 命名空间。
- `doctor`、`recommend`、`answer-detail` 三个稳定命令入口。
- `auto` 默认使用 ADB + Reqable，不依赖 Chrome。
- App 自己生成登录态和动态签名，插件只读取本次新增响应。
- 推荐只执行一次自然刷新，避免重复请求。
- capture、fixture 和 remote 作为显式辅助数据源。
- typed error、统一 normalizer、单元测试和真实链路验证。

## 近期：让现有命令更稳

优先级高于增加命令数量。

1. 用更稳健的 Android 页面状态判断替代固定等待时间。
2. 识别知乎 App 版本与界面差异，输出可操作的诊断。
3. 增加 Reqable 响应 schema 漂移样例和回归 fixture。
4. 输出触发次数、候选记录数和过滤原因等可观测信息。
5. 覆盖真实设备、模拟器、多设备选择和断线恢复。

## 中期：扩展只读能力

候选顺序：

1. `hot`
2. `search`
3. `question-detail`
4. `answer-comments`
5. `user`

每个命令都必须先有真实抓包证据、数据获取策略记录、脱敏 fixture 和端到端验证。

## 长期：手机内独立运行

- 评估 Termux 内运行 OpenCLI、ADB 与本地抓包桥的可行性。
- 研究最小 Android companion，只暴露 loopback、只读接口。
- 使用 Android Keystore 保存 bridge token。
- 保持 App 会话和签名材料不离开手机。

## 持续保留的兼容能力

- `remote`：显式连接电脑 OpenCLI + Chrome，仅用于兼容旧流程。
- `capture`：分析用户显式导出的脱敏 Reqable 记录。
- `fixture`：离线开发和契约测试，不作为 `auto` 的静默降级。

## 非目标

- 不破解验证码、绕过访问控制或复制长期签名算法。
- 不默认收集或持久化 Bearer、Cookie、设备标识。
- 写操作必须单独设计权限、安全确认和幂等模型，不继承只读 provider。
