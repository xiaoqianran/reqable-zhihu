# 命令手册

本文以 PowerShell 为主，覆盖插件安装、ADB + Reqable 配置、全部
`zhihu-mobile` 命令、数据源、输出格式、环境变量和调试方式。

## 1. 安装与更新

```powershell
# 从 GitHub 安装
opencli plugin install github:xiaoqianran/reqable-zhihu

# 更新到 GitHub 最新版本
opencli plugin update reqable-zhihu

# 查看安装状态
opencli plugin list -f json

# 卸载
opencli plugin uninstall reqable-zhihu
```

本地开发版：

```powershell
opencli plugin uninstall reqable-zhihu
opencli plugin install file://D:/path/to/reqable-zhihu
```

## 2. 配置 Android + Reqable

如果已经克隆仓库，可以在仓库目录运行一键配置脚本：

```powershell
cd D:\path\to\reqable-zhihu
. .\scripts\setup-adb-reqable.ps1
```

连接多台设备时指定序列号：

```powershell
. .\scripts\setup-adb-reqable.ps1 -Serial emulator-5554
```

没有克隆仓库时，可以手动配置：

```powershell
adb devices -l
adb reverse tcp:9000 tcp:9000
adb shell settings put global http_proxy 127.0.0.1:9000
```

使用结束后恢复手机代理：

```powershell
adb shell settings put global http_proxy :0
adb reverse --remove-all
```

## 3. 环境诊断

```powershell
# 查看静态配置
opencli zhihu-mobile doctor

# 实际探测 ADB、知乎 App 和 Reqable
opencli zhihu-mobile doctor --probe

# JSON 输出
opencli zhihu-mobile doctor --probe -f json

# 指定设备
opencli zhihu-mobile doctor --probe --adb-serial emulator-5554

# 指定 Reqable live API
opencli zhihu-mobile doctor --probe `
  --reqable-url http://127.0.0.1:9000

# 指定 ADB 可执行文件
opencli zhihu-mobile doctor --probe `
  --adb-path D:\AndroidSdk\platform-tools\adb.exe
```

`doctor --probe` 的主链路应显示：

- `reqableLive: ok`
- `adbDevice: ok`
- `zhihuApp: ok`

`gateway` 和 `captureFile` 是兼容数据源，未配置时显示 `missing` 不影响默认
ADB 链路。

## 4. 获取手机知乎推荐

`auto` 是默认 source，并固定选择真实 ADB 手机链路：

```powershell
opencli zhihu-mobile recommend
opencli zhihu-mobile recommend --limit 2
opencli zhihu-mobile recommend --limit 10 -f json
```

显式选择 ADB：

```powershell
opencli zhihu-mobile recommend --source adb --limit 10
```

指定设备、等待时间和 Reqable：

```powershell
opencli zhihu-mobile recommend `
  --source adb `
  --limit 20 `
  --wait-seconds 30 `
  --adb-path adb `
  --adb-serial emulator-5554 `
  --reqable-url http://127.0.0.1:9000 `
  -f json
```

参数范围：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--source` | `auto` | `auto / adb / remote / capture / fixture` |
| `--limit` | `20` | 返回 `1-100` 条 |
| `--wait-seconds` | `20` | 等待 App 响应 `1-120` 秒 |
| `--adb-path` | `adb` | ADB 可执行文件 |
| `--adb-serial` | 空 | 多设备时必须指定 |
| `--reqable-url` | `http://127.0.0.1:9000` | Reqable live API |
| `--gateway-url` | 空 | `remote` 兼容源地址 |
| `--capture-file` | 空 | Reqable JSON 导出路径 |

## 5. 获取回答正文

`target` 支持三种格式。

使用回答 ID：

```powershell
opencli zhihu-mobile answer-detail 23109591027
```

使用知乎回答 URL：

```powershell
opencli zhihu-mobile answer-detail `
  "https://www.zhihu.com/question/2175138096/answer/23109591027"
```

使用类型化 ID：

```powershell
opencli zhihu-mobile answer-detail `
  "answer:2175138096:23109591027"
```

限制正文长度：

```powershell
opencli zhihu-mobile answer-detail 23109591027 `
  --max-content 1000
```

获取完整正文：

```powershell
opencli zhihu-mobile answer-detail 23109591027 `
  --max-content 0 `
  -f json
```

完整参数示例：

```powershell
opencli zhihu-mobile answer-detail 23109591027 `
  --source adb `
  --max-content 2000 `
  --wait-seconds 30 `
  --adb-path adb `
  --adb-serial emulator-5554 `
  --reqable-url http://127.0.0.1:9000 `
  -f json
```

`--max-content 0` 表示不截断；最大允许值为 `1000000`。

## 6. 推荐后读取第一条回答

```powershell
$recommendJson = opencli zhihu-mobile recommend --limit 2 -f json
$rows = $recommendJson | ConvertFrom-Json
$answerId = [regex]::Match(
  [string]$rows[0].url,
  '/answer/(\d+)'
).Groups[1].Value

opencli zhihu-mobile answer-detail $answerId `
  --max-content 2000 `
  -f json
```

推荐结果可能包含文章或问题。生产脚本应先检查 `type -eq "answer"`，再调用
`answer-detail`。

## 7. 离线 fixture

fixture 是合成、脱敏数据，只用于开发和离线验证：

```powershell
opencli zhihu-mobile recommend `
  --source fixture `
  --limit 2 `
  -f json

opencli zhihu-mobile answer-detail 900000000000000001 `
  --source fixture `
  -f json
```

## 8. Reqable 导出文件

读取推荐记录：

```powershell
opencli zhihu-mobile recommend `
  --source capture `
  --capture-file D:\captures\zhihu.json `
  --limit 10 `
  -f json
```

读取回答记录：

```powershell
opencli zhihu-mobile answer-detail 23109591027 `
  --source capture `
  --capture-file D:\captures\zhihu.json `
  -f json
```

## 9. 旧版 Chrome 远程兼容源

在第一个 PowerShell 窗口启动网关：

```powershell
cd D:\path\to\reqable-zhihu
.\scripts\start-adb-gateway.ps1
```

在第二个窗口加载配置并调用：

```powershell
cd D:\path\to\reqable-zhihu
. .\scripts\use-adb-gateway.ps1

opencli zhihu-mobile doctor --probe
opencli zhihu-mobile recommend --source remote --limit 2
opencli zhihu-mobile answer-detail 23109591027 --source remote
```

也可以手动配置：

```powershell
$env:ZHIHU_MOBILE_GATEWAY_URL = "http://127.0.0.1:17830"
$env:ZHIHU_MOBILE_GATEWAY_TOKEN = "<gateway-token>"

opencli zhihu-mobile recommend --source remote --limit 10
```

`remote` 需要电脑 Chrome、OpenCLI Browser Bridge 和知乎登录态。默认
`auto/adb` 不需要 Chrome。

## 10. 输出格式

所有命令支持：

```text
table
json
yaml
plain
md
csv
```

示例：

```powershell
opencli zhihu-mobile recommend --limit 5 -f table
opencli zhihu-mobile recommend --limit 5 -f json
opencli zhihu-mobile answer-detail 23109591027 -f plain
```

Agent 或脚本通常应显式使用 `-f json`。

## 11. Trace 与调试

```powershell
# 详细日志
opencli zhihu-mobile recommend -v

# 总是保留 trace
opencli zhihu-mobile recommend --trace on

# 仅失败时保留 trace
opencli zhihu-mobile recommend --trace retain-on-failure

opencli zhihu-mobile answer-detail 23109591027 `
  --trace retain-on-failure `
  -v
```

Trace 模式：

| 模式 | 说明 |
|------|------|
| `off` | 默认，不保存 |
| `on` | 始终保存 |
| `retain-on-failure` | 失败时保存 |

## 12. 环境变量

```powershell
$env:ZHIHU_MOBILE_SOURCE = "adb"
$env:ZHIHU_MOBILE_ADB_PATH = "adb"
$env:ZHIHU_MOBILE_ADB_SERIAL = "emulator-5554"
$env:REQABLE_ZHIHU_URL = "http://127.0.0.1:9000"

$env:REQABLE_ZHIHU_CAPTURE_FILE = "D:\captures\zhihu.json"

$env:ZHIHU_MOBILE_GATEWAY_URL = "http://127.0.0.1:17830"
$env:ZHIHU_MOBILE_GATEWAY_TOKEN = "<gateway-token>"
```

命令行参数优先于环境变量。

## 13. 帮助与验证

```powershell
opencli zhihu-mobile --help
opencli zhihu-mobile doctor --help
opencli zhihu-mobile recommend --help
opencli zhihu-mobile answer-detail --help

opencli validate zhihu-mobile
opencli verify zhihu-mobile/recommend
opencli verify zhihu-mobile/answer-detail
```

日常最短流程：

```powershell
opencli zhihu-mobile doctor --probe
opencli zhihu-mobile recommend --limit 2
opencli zhihu-mobile answer-detail 23109591027
```
