# reqable-zhihu

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![OpenCLI Plugin](https://img.shields.io/badge/OpenCLI-plugin-blue)](./opencli-plugin.json)
[![Status](https://img.shields.io/badge/status-experimental-orange)](./docs/design/roadmap.md)

把已登录的知乎 Android App 变成可从 OpenCLI 调用的只读数据源。

插件通过 ADB 触发 App 页面，由知乎 App 自己生成登录态和动态签名；Reqable 捕获本次响应后，插件将推荐和回答正文归一化为稳定的命令行输出。默认链路不使用 Chrome，也不复制 Cookie、Bearer 或 `x-zse-*`。

## 当前可用

| 命令 | 作用 |
|------|------|
| `opencli zhihu-mobile doctor --probe` | 检查 ADB、知乎 App 和 Reqable |
| `opencli zhihu-mobile recommend --limit 2` | 获取真实首页推荐 |
| `opencli zhihu-mobile answer-detail <回答ID>` | 获取回答正文 |

`search`、`hot` 等命令尚未实现。项目是非官方实验，不保证知乎内部协议长期稳定。

## 快速开始

需要：

- Node.js 21+
- OpenCLI 1.8.6+
- 可由 `adb devices` 识别的 Android 设备或模拟器
- 已安装并登录的知乎 App（`com.zhihu.android`）
- 正在抓包且手机已信任其 CA 的 Reqable

从 GitHub 安装：

```powershell
opencli plugin install github:xiaoqianran/reqable-zhihu
opencli plugin list -f json
```

配置 ADB reverse 与手机代理。克隆仓库后推荐使用脚本：

```powershell
cd D:\path\to\reqable-zhihu
. .\scripts\setup-adb-reqable.ps1
```

也可以手动配置：

```powershell
adb reverse tcp:9000 tcp:9000
adb shell settings put global http_proxy 127.0.0.1:9000
```

检查链路：

```powershell
opencli zhihu-mobile doctor --probe
```

`reqableLive`、`adbDevice`、`zhihuApp` 应为 `ok`。`gateway` 和 `captureFile` 未配置不会影响默认手机链路。

读取推荐，再查看一条回答：

```powershell
opencli zhihu-mobile recommend --limit 2
opencli zhihu-mobile answer-detail 23109591027 --max-content 2000
```

推荐命令现在只执行一次底部“首页”触发，不再叠加点击“推荐”或滑动。一次调用只有一轮显式 UI 刷新；知乎 App 仍可能在这一轮内自行预取多页 HTTP 响应。

更新插件：

```powershell
opencli plugin update reqable-zhihu
```

## 工作方式

```text
opencli zhihu-mobile recommend
  → 记录 Reqable 中已有的匹配请求
  → ADB 打开知乎并执行一次首页刷新
  → 知乎 App 自己发送已签名请求
  → Reqable live API 返回本次新增响应
  → 插件校验 adb 来源、URL、HTTP 2xx 与 JSON
  → normalizer 输出稳定字段
```

回答详情通过 `zhihu://answers/<id>` 打开 App，并采用同样的“先快照、后触发、只接受新增响应”流程。

## 数据源

| `--source` | 用途 |
|------------|------|
| `auto` | 默认值，固定选择真实 `adb` 链路 |
| `adb` | 显式使用 ADB + Reqable live API |
| `capture` | 读取用户提供的脱敏 Reqable JSON 导出 |
| `fixture` | 离线开发与契约测试 |
| `remote` | 兼容旧版电脑 OpenCLI + Chrome 网关 |

项目不会在真实链路失败后静默降级到 fixture 或 Chrome。完整参数、环境变量、输出格式和远程兼容命令见[命令手册](./docs/getting-started/commands.md)。

## 常用参数

```powershell
opencli zhihu-mobile recommend `
  --source adb `
  --limit 10 `
  --wait-seconds 30 `
  --adb-serial emulator-5554 `
  --reqable-url http://127.0.0.1:9000 `
  -f json

opencli zhihu-mobile answer-detail 23109591027 `
  --source adb `
  --max-content 0 `
  -f json
```

连接多台设备时必须传 `--adb-serial`。`--max-content 0` 表示不截断正文。

结束后可恢复手机代理：

```powershell
adb shell settings put global http_proxy :0
adb reverse --remove-all
```

## 文档

- [文档中心](./docs/README.md)
- [命令手册](./docs/getting-started/commands.md)
- [Android 与 Reqable 配置](./docs/getting-started/android-reqable.md)
- [架构](./docs/design/architecture.md)
- [数据获取策略](./docs/design/strategy.md)
- [运行时与安全](./docs/design/runtime-security.md)
- [协议研究](./docs/protocol/README.md)
- [演进路线](./docs/design/roadmap.md)

## 开发

```powershell
git clone https://github.com/xiaoqianran/reqable-zhihu.git
cd reqable-zhihu
npm test
npm run check

opencli plugin uninstall reqable-zhihu
opencli plugin install file://D:/path/to/reqable-zhihu
```

同名 GitHub 版与本地版不能同时安装。命令入口保留在仓库根目录，具体实现位于 `src/providers`、`src/normalizers` 和 `src/runtime`。贡献前请阅读[开发指南](./docs/contributing/development.md)与 [Commit 规范](./docs/contributing/commits.md)。

## 安全边界

- 只分析自己的设备、账号或已获授权的流量。
- 不提交真实 capture、Cookie、Bearer、设备标识或私人响应。
- 当前命令均为只读；写操作不在现有权限模型内。
- 不破解验证码、不绕过访问控制，也不承诺规避平台风控。

## License

[MIT](./LICENSE)
