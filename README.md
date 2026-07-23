# reqable-zhihu

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![OpenCLI Plugin](https://img.shields.io/badge/OpenCLI-plugin-blue)](./opencli-plugin.json)
[![Status](https://img.shields.io/badge/status-experimental-orange)](./docs/roadmap.md)

`reqable-zhihu` 是一个面向实验和长期演进的 OpenCLI 插件：它通过 ADB 驱动已登录的知乎 Android App，由 Reqable 读取 App 本次产生的响应，再以 OpenCLI 命令输出推荐和正文。

项目仍是非官方、研究向实现。它不会破解验证码或绕过访问控制，也不会把抓到的 Bearer、Cookie、`x-zse-*` 写入仓库。

## 当前能力

- OpenCLI 插件命名空间：`zhihu-mobile`
- 真实 Android 数据源：ADB 驱动知乎 App，Reqable 实时读取响应
- 默认不需要 Chrome 或 OpenCLI Browser Bridge
- 远程兼容源：仍可显式使用电脑 OpenCLI/Chrome
- Reqable 导出读取：从本地脱敏 capture JSON 解析推荐流和回答正文
- 统一数据模型：Web API 与 Android App API 映射到同一列结构
- 离线 fixture：不连接知乎即可验证 normalizer 和 CLI 契约
- 原有协议手册：保留域名、鉴权、推荐流、正文和抓包说明

## 快速开始

要求 Node.js 21+、OpenCLI 1.8.6+。

直接从 GitHub 安装：

```bash
opencli plugin install github:xiaoqianran/reqable-zhihu
opencli zhihu-mobile doctor --probe
```

安装完成后可以在任意目录调用插件。当前可用命令只有
`doctor`、`recommend` 和 `answer-detail`；`search` 尚未实现。

所有安装、配置、参数、数据源、输出格式和调试命令见
[完整调用命令](./docs/commands.md)。

连接 Android 和 Reqable 后，默认 `auto` 就是真实手机来源：

```powershell
. .\scripts\setup-adb-reqable.ps1
opencli zhihu-mobile recommend --limit 2
opencli zhihu-mobile answer-detail 2046205897593173427
```

第一行需要在克隆的仓库目录运行；开头的点号会把设备序列号写入当前 PowerShell。也可以手动完成：

```powershell
adb reverse tcp:9000 tcp:9000
adb shell settings put global http_proxy 127.0.0.1:9000
opencli zhihu-mobile doctor --probe
```

使用内置脱敏 fixture 做离线验证：

```bash
opencli zhihu-mobile recommend --source fixture --limit 2 -f json
opencli zhihu-mobile answer-detail 900000000000000001 --source fixture -f plain
```

本地开发时，克隆仓库并安装本地版本：

```bash
git clone https://github.com/xiaoqianran/reqable-zhihu.git
cd reqable-zhihu
npm test
opencli plugin install file://<本仓库绝对路径>
```

同名插件不能同时安装 GitHub 版和本地版。切换来源前先执行：

```bash
opencli plugin uninstall reqable-zhihu
```

## 真实手机链路

正式数据流是：

```text
opencli zhihu-mobile recommend
  → ADB 打开知乎首页、切到推荐并下拉刷新
  → 知乎 App 自己生成登录态和请求签名
  → adb reverse 把 App 流量送到 Reqable :9000
  → 插件轮询 Reqable capture/live/filter + capture/live/get
  → 只接受本次新增、adb 来源、URL 匹配、HTTP 2xx 的 JSON
  → normalizer 输出稳定 columns
```

回答详情使用 `zhihu://answers/<id>` 打开 App。插件不会复制 Cookie、Bearer 或 `x-zse-*`，也不会重放签名请求。

要求：

- 一台 `adb devices` 状态为 `device` 的 Android 设备
- 已安装并登录 `com.zhihu.android`
- Reqable 桌面端正在抓包，手机已信任其 CA
- 手机代理为 `127.0.0.1:9000`，并存在 `adb reverse tcp:9000 tcp:9000`

如连接多台设备：

```powershell
. .\scripts\setup-adb-reqable.ps1 -Serial emulator-5554
opencli zhihu-mobile recommend --adb-serial emulator-5554 --limit 2
```

## 旧版远程兼容源

需要时仍可让可信电脑上的 OpenCLI/Chrome 执行：

```bash
# 电脑 PowerShell
$env:ZHIHU_MOBILE_GATEWAY_TOKEN="<随机长令牌>"
npm run gateway

# 手机 / Termux
export ZHIHU_MOBILE_GATEWAY_URL=http://<电脑局域网IP>:17830
export ZHIHU_MOBILE_GATEWAY_TOKEN=<同一令牌>
opencli zhihu-mobile recommend --source remote --limit 10
```

网关默认只监听 `127.0.0.1`。若要监听局域网，必须显式设置 `ZHIHU_MOBILE_GATEWAY_HOST=0.0.0.0`，并使用强随机令牌和可信网络。

## 架构

```text
电脑 OpenCLI
        │
        ▼
zhihu-mobile 命令层
        │
        ├── AdbReqableProvider   ──→ 知乎 Android App + Reqable live API
        ├── RemoteGatewayProvider ──→ 电脑 OpenCLI + Chrome（兼容）
        ├── CaptureFileProvider  ──→ Reqable 脱敏导出
        └── FixtureProvider      ──→ 离线契约测试
                    │
                    ▼
         normalizers + domain rows
```

详细说明：

- [总体架构](./docs/architecture.md)
- [完整调用命令](./docs/commands.md)
- [Strategy 选择记录](./docs/strategy-note.md)
- [运行与安全模型](./docs/runtime.md)
- [演进路线](./docs/roadmap.md)
- [开发指南](./docs/development.md)

## 命令

| 命令 | 说明 |
|------|------|
| `zhihu-mobile doctor` | 检查 source、网关和 capture 配置 |
| `zhihu-mobile recommend` | 读取首页推荐 |
| `zhihu-mobile answer-detail <id-or-url>` | 读取回答正文 |

`source` 支持：

- `auto`：使用真实 `adb` 手机链路
- `adb`：显式使用 ADB + Reqable live
- `remote`：调用可信执行器
- `capture`：读取 Reqable 导出文件
- `fixture`：仅用于开发和离线验证，必须显式指定

## 协议研究文档

| 文档 | 内容 |
|------|------|
| [docs/00-overview.md](./docs/00-overview.md) | Android App 协议总览 |
| [docs/01-domains.md](./docs/01-domains.md) | 域名 / HTTP-DNS / CDN |
| [docs/02-auth-headers.md](./docs/02-auth-headers.md) | Bearer、Cookie 与 `x-zse-*` |
| [docs/03-apis-feed.md](./docs/03-apis-feed.md) | 推荐流 / 热榜 / 动态 |
| [docs/04-apis-content.md](./docs/04-apis-content.md) | 回答与结构化正文 |
| [docs/07-capture-setup.md](./docs/07-capture-setup.md) | Reqable 抓包环境 |
| [schemas/openapi-zhihu-partial.yaml](./schemas/openapi-zhihu-partial.yaml) | 部分 OpenAPI 草图 |

## 仓库结构

```text
reqable-zhihu/
├── *.js                    # OpenCLI 根命令，插件加载器只扫描根目录
├── src/
│   ├── normalizers/        # Web/App 响应归一化
│   ├── providers/          # adb+Reqable/remote/capture/fixture
│   └── runtime/            # 参数、source 和配置
├── scripts/gateway.mjs     # 可信电脑执行网关
├── fixtures/               # 合成且脱敏的离线响应
├── test/                   # Node 内置测试
├── verify/                 # OpenCLI verify fixture 模板
├── docs/                   # 架构 + 原协议手册
├── examples/
└── schemas/
```

## Commit 规范

提交遵循阿里/Angular 约定式格式：

```text
<type>(<scope>): <subject>
```

详见 [docs/commit-convention.md](./docs/commit-convention.md)。

## 合规与安全

1. 只分析自己的设备、账号或已获授权的流量。
2. 不提交真实 HAR、Bearer、Cookie、设备标识或完整私人响应。
3. 默认只读；写操作不属于当前实验范围。
4. 不保证非官方接口长期有效，字段漂移必须通过 fixture 和 verify 暴露。

## License

[MIT](./LICENSE)
