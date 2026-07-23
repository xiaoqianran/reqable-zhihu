# 使用 Reqable 复现本仓库的抓包环境

## 架构

```text
Android 模拟器 / 真机
    │  HTTP 代理 或 协同 VPN
    ▼
Windows Reqable :9000  （MITM + 列表 + MCP）
    │  可选二级代理
    ▼
Clash / 系统网络 :7890
```

## 前置条件

1. 安装 [Reqable](https://reqable.com/) 桌面端（建议 ≥ 3.2，便于 MCP）。  
2. Android 模拟器或真机；模拟器可用 ADB。  
3. 安装 **与桌面端同一套** CA 根证书到设备：  
   - **系统证书**（模拟器/Root 一键，HTTPS 对 App 更友好）  
   - **用户证书**（Chrome 等高版本浏览器可能更依赖用户区）  
4. 证书文件本机路径示例：  
   `%APPDATA%\Reqable\certificate\reqable-root.crt`  
   下载入口（走代理时）：`http://cert.reqable.com/ca`

## 模拟器推荐：adb reverse + 系统代理

```powershell
# 1. 把本机 9000/7890 映射进模拟器 localhost
adb reverse tcp:9000 tcp:9000
adb reverse tcp:7890 tcp:7890

# 2. 全局 HTTP 代理指向 Reqable
adb shell settings put global http_proxy 127.0.0.1:9000

# 3. Windows 上 Reqable 开启「调试」
```

恢复：

```powershell
adb shell settings put global http_proxy :0
adb reverse --remove-all
```

### 关于 `10.0.2.2`

- 模拟器访问宿主机的经典地址是 **`10.0.2.2`**。  
- 该地址 **不会** 出现在 Windows `ipconfig` 里。  
- Extended Controls 里对 `10.0.2.2` 常显示 **Proxy is unreachable**（主机侧探测失败），可忽略或改用 `127.0.0.1` + `adb reverse`。

## 真机

1. 手机与电脑同一局域网。  
2. Wi‑Fi 代理：电脑 LAN IP + Reqable 端口（如 `9000`）。  
3. 或使用 Reqable **协同模式**（手机 App VPN 转发，无需手设 Wi‑Fi 代理）。  
4. 安装 **电脑端 CA** 到手机。

## 证书安装（用户 CA）正确路径

```text
Settings
 → Security & privacy
 → More security & privacy
 → Encryption & credentials
 → Install a certificate
 → CA certificate
 → 选择 reqable-ca.crt
 → 用途：VPN and apps
```

校验：

```text
Trusted credentials → User 页签 → 应有 Reqable
```

Windows Reqable「安装证书到 Android」对话框通过 ADB 检查：

- 系统：`/system/etc/security/cacerts/` 或 apex 路径  
- 用户：`/data/misc/user/0/cacerts-added/`  

仅下载到 `Download` **不等于** 已安装。

## 知乎 App 调试包注意

Android 7+ 默认不信任用户 CA。若只装用户证书且目标是 **自研 App**，需 `network_security_config` 信任 user。  
知乎 **商店包** 在装有 **系统 CA** 时，本次研究可解密大量 API（不代表永久无 Pinning）。

## Reqable MCP

官方文档：<https://reqable.com/docs/mcp/>  
开源：<https://github.com/reqable/reqable-mcp-server>

配置后可在 Cursor / Claude / 其它 MCP 客户端中：

- `capture_live_filter` 按 host/keyword 筛记录  
- `capture_live_get_by_id` 拉完整请求/响应  
- `capture_live_generate_curl` 导出 cURL  

本仓库接口表即通过 MCP + 人工整理产生。

## 推荐过滤

```text
zhihu
api.zhihu.com
page-info
topstory
answers/v2
```

排除噪音：

```text
check_health
zhimg.com   # 仅当只关心 JSON 时
```

## 导出与脱敏

1. 导出 HAR / 集合前删除 `Authorization`、`Cookie`、`x-suger` 等。  
2. 不要将含登录态的文件 push 到本仓库（见 `.gitignore`）。  
3. 文档中只保留 path、query 名、字段结构。
