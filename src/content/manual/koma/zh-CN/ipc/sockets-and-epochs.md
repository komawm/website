# 双通道套接字、Epoch 租约与 MCP

Koma 在 `$XDG_RUNTIME_DIR/koma/<signature>/` 下严格拆分管理员控制面与智能体执行面，确保人类桌面管理权与自动化操作互不越界。

## `koma-admin.sock` 与 `koma-agent.sock`

| 套接字 | 权限与鉴权机制 | 允许的操作范围 |
| :--- | :--- | :--- |
| **`koma-admin.sock`** | `0600`，强制同 UID 内核鉴权（`SO_PEERCRED` / `LOCAL_PEERCRED` / `getpeereid`） | `config.reload`、`config.status`、`auth.mint_token`、`sandbox.create_wayland_jail`、`sandbox.revoke_wayland_jail`、`scene.inventory`、`capture.frame`、人类接管 |
| **`koma-agent.sock`** | `0660`，首帧必须执行 `auth.authenticate`（`CapabilityToken`） | 仅限令牌授权工作区内的 `ws.create`、`capture.frame`、`vseat.*`、`macro.exec` |

连接到 `koma-agent.sock` 的第一帧 **必须** 是携带有效 `CapabilityToken`（由 `komactl token mint` 或 `koma-admin.sock` `auth.mint_token` 签发）的 `auth.authenticate` 请求；任何未鉴权请求或越权调用管理接口均会被直接拒绝。

## 单调 `Epoch` 并发租约围栏

每个工作区均维护随窗口创建、聚焦、几何变更与人类抢占单调递增的 `Epoch` 计数。智能体在发起 `vseat.*` 操作前必须先通过 `scene.inventory` 或 `capture.frame` 观测当前画面并传入 `expected_epoch`：

| 错误码 | 符号 | 含义与恢复动作 |
| :--- | :--- | :--- |
| **`4090`** | `ERR_STALE_EPOCH` | 观测后至执行前窗口状态发生变更；操作在派发前被安全中止（`koma-mcp` 会自动附带最新 `new_observed_epoch` 的重新抓屏 PNG） |
| **`4091`** | `ERR_HUMAN_PREEMPTED` | 人类按下 `Mod + G` 或触发真实键鼠输入；智能体必须立即停手交还控制权 |
| **`4032`** | `ERR_PROTECTED_SURFACE` | 目标坐标命中带 `block_out_from` 的受保护表面；输入被阻断且对应画面在截图中呈 `#000000` 遮蔽 |

## 虚拟座席（`vseat`）与零拷贝 `SCM_RIGHTS` 抓屏

- **工作区级隔离座席**：每个智能体工作区拥有独立的虚拟指针、键盘与剪贴板账本（`koma-seat`），绝不污染人类的 `seat0` 焦点或系统剪贴板。
- **三级 `TextInjectStrategy`**：UTF-8 文本注入按需自动调度 `xkb_keymap`（US QWERTY 按键序列）、`text_input_v3` 或 `clipboard`（`Ctrl+Shift+V`），绕过 Fcitx5/IBus 候选词弹窗。
- **只读密封 `SCM_RIGHTS` `memfd` / SHM（`koma-proto/src/scm_unix.rs`）**：`capture.frame` 将 RGBA8 帧写入只读密封的 `memfd`（Linux）或 `rustix::shm`（BSD 回退路径）并通过文件描述符传递，避免大体积像素经 JSON 拷贝。

## `koma-mcp` 标准 MCP 服务

`koma-mcp` 将 `koma-agent.sock` 封装为标准 stdio JSON-RPC 2.0 MCP 服务，供 `Claude Code`、`Codex`、`Cursor`、`OpenCode` 或 [Jiku](/zh-CN/jiku/) 直接接入：

```bash
# 离线查看全部内置工具与 Phodopus 动态宏 Schema
koma-mcp --print-tools

# 使用显式签发的 CapabilityToken 启动
KOMA_CAPABILITY_TOKEN=koma_cap_... koma-mcp

# 本地开发模式（自动通过 admin.sock 签发临时作用域令牌）
koma-mcp --auto-mint-admin
```

内置 MCP 工具包括：`koma_scene_inventory`、`koma_ws_create`、`koma_capture_frame`、`koma_click`、`koma_drag`、`koma_key`、`koma_inject_text`、`koma_paste_mime`、`koma_win_activate` 与 `koma_exec_macro`，以及所有通过 `koma.macro.define(...)` 注册的 `macro__<id>`。
