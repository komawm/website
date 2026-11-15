# 双通道套接字、Epoch 租约与 MCP

Koma 在 `$XDG_RUNTIME_DIR/koma/<signature>/`（目录权限 `0700`）下提供两个独立的 Unix 域套接字，将人类桌面管理面与 AI 自动化执行面隔离开来。

## `koma-admin.sock` 与 `koma-agent.sock`

| 套接字 | 权限与鉴权方式 | 允许的操作范围 |
| :--- | :--- | :--- |
| **`koma-admin.sock`** | `0600`，同 UID 内核凭证校验（`SO_PEERCRED` / `LOCAL_PEERCRED` / `getpeereid`）；对沙箱受限 Wayland 客户端屏蔽 | `config.reload`、`config.status`、`auth.mint_token`、`sandbox.create_wayland_jail`、`sandbox.revoke_wayland_jail`、`scene.inventory`、`capture.frame`、人类接管（`ws.set_mode`） |
| **`koma-agent.sock`** | `0600`，首帧必须发送携带 `CapabilityToken` 的 `auth.authenticate` | 仅限令牌授权工作区内的 `ws.create`、`capture.frame`、`vseat.*`、`macro.exec` / `lua.exec_tx` |

连接到 `koma-agent.sock` 的第 1 帧必须是通过 `komactl token mint`（或 `koma-admin.sock` 上的 `auth.mint_token`）签发的 `CapabilityToken` 认证请求；未认证请求或在智能体套接字上调用管理 RPC 会被立即拒绝。两条通道均采用 4 字节小端序长度前缀 + UTF-8 JSON 负载（单帧上限 `16 MiB`），并支持附带 `SCM_RIGHTS` 文件描述符。

## 单调 `Epoch` 并发围栏

每个工作区均维护随租约变更、窗口创建/聚焦/几何变化及人类抢占而单调递增的 `Epoch` 计数。智能体在调用 `vseat.*` 注入输入前，必须先通过 `scene.inventory` 或 `capture.frame` 获取当前状态并传入 `expected_epoch`：

| 错误码 | 符号 | 含义与恢复方式 |
| :--- | :--- | :--- |
| **`4090`** | `ERR_STALE_EPOCH` | 观测与执行之间窗口状态发生变化；动作在派发前被安全中止（`koma-mcp` 会自动附带最新 `new_observed_epoch` 的截图 PNG） |
| **`4091`** | `ERR_HUMAN_PREEMPTED` | 人类按下 `Mod + G` 或触发物理键鼠输入；智能体必须暂停操作并交还控制权 |
| **`4032`** | `ERR_PROTECTED_SURFACE` | 目标命中带 `block_out_from` 的受保护表面；输入被拦截且对应区域在截图中涂黑为 `#000000` |

## 虚拟座席（`vseat`）与零拷贝 `SCM_RIGHTS` 抓屏

- **工作区隔离虚拟座席**：每个受租约控制的工作区拥有独立的虚拟指针、键盘与剪贴板状态，不会干扰人类物理 `seat0` 的焦点或剪贴板。
- **三级 `TextInjectStrategy`**：UTF-8 文本注入会自动在 `xkb_keymap`、`text_input_v3` 或 `clipboard`（`Ctrl+Shift+V`）之间选择合适路径，避免触发 Fcitx5/IBus 输入法候选框。
- **只读密封 `SCM_RIGHTS` `memfd` / SHM**：`capture.frame` 将 RGBA8 像素数据写入只读密封的 `memfd`（Linux/FreeBSD）或 POSIX 共享内存描述符（BSD 回退路径），并通过 `SCM_RIGHTS` 传递文件描述符，避免大体积图像经过 JSON 拷贝。

## `koma-mcp` 标准输入输出服务

`koma-mcp` 将 `koma-agent.sock` 封装为基于 stdio 的 JSON-RPC 2.0 MCP 服务，可直接接入 `Claude Code`、`Codex`、`Cursor`、`OpenCode` 或 [Jiku](/zh-CN/jiku/)：

```bash
# 离线查看内置 MCP 工具 Schema
koma-mcp --print-tools

# 使用显式签发的 CapabilityToken 启动
KOMA_CAPABILITY_TOKEN=koma_cap_... koma-mcp

# 本地开发便利模式（自动通过 koma-admin.sock 签发作用域令牌）
koma-mcp --auto-mint-admin
```

内置 `koma-mcp` 工具包括：`koma_scene_inventory`、`koma_ws_create`、`koma_capture_frame`、`koma_click`、`koma_drag`、`koma_key`、`koma_inject_text`、`koma_paste_mime`、`koma_win_activate` 与 `koma_exec_macro`，以及所有在 `~/.config/koma/init.lua` 中通过 `koma.macro.define(...)` 注册的 `macro__<id>` 宏工具。
