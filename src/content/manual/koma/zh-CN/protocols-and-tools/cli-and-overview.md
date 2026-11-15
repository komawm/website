# komactl 与工作区概览

`komactl` 是 Koma 的管理命令行工具（连接 `koma-admin.sock`）与离线 Lua 配置校验器；`koma-overview` 则是基于 `wlr-layer-shell` 的全局工作区空间概览程序。

## `komactl` 子命令一览

`komactl` 会自动探测 `$XDG_RUNTIME_DIR/koma/<signature>/koma-admin.sock`（也可通过 `KOMA_INSTANCE_SIGNATURE` 指定实例）。

| 子命令 | 运行模式 | 功能说明 |
| :--- | :--- | :--- |
| `komactl validate [path/to/init.lua]` | 离线 | 在隔离 Lua 沙箱中求值 `init.lua`，校验规则正则与手势并输出统计 |
| `komactl reload [path/to/init.lua]` | IPC（`admin.sock`） | 调用 `config.reload` 原子热重载合成器配置 |
| `komactl config-status` | IPC（`admin.sock`） | 查看当前配置文件路径、重载代数与最近报错（`config.status`） |
| `komactl gen-types` | 离线 | 确定性输出供 `koma-types`（`types/koma.lua`）使用的 `LuaCATS` 存根 |
| `komactl inventory` | IPC（`admin.sock`） | 导出显示器、工作区、`Epoch` 计数、Deck 活跃窗与 Stash 列表（`scene.inventory`） |
| `komactl token mint [label]` | IPC（`admin.sock`） | 签发受限 `CapabilityToken`（默认 `ttl_secs = 28800`、`can_create_headless = true`、`max_owned_workspaces = 4`） |
| `komactl capture [ws_id] [out.rgba]` | IPC（`admin.sock`） | 通过 `SCM_RIGHTS` 零拷贝密封 `memfd` 抓取带 `grid_225` 叠加层的画面（默认 `ws_01`） |
| `komactl sandbox <subcmd>` | 容器 + IPC | 使用 `bwrap` 或无根 `podman` 在隔离 `Headless` 工作区中运行受限 GUI 容器 |
| `komactl -V` / `--version` | 离线 | 输出 `komactl <version>` |

## `komactl sandbox` 容器级 Wayland 隔离

`komactl sandbox` 仅在私有 `0700` `tmpfs` 运行目录中暴露受限的 `jail-<ws_id>.sock`（绝不挂载宿主机 `$XDG_RUNTIME_DIR`、`koma-admin.sock`、D-Bus、PipeWire 或 SSH Agent）：

```bash
# 在独立 1920x1080 无头工作区通过 bwrap 运行默认断网的隔离浏览器
komactl sandbox run --name browser-jail -- firefox

# 使用无根 podman 运行 OCI 容器并开启网络（先 dry-run 预览完整命令）
komactl sandbox run --runtime podman --image fedora:latest --share-net --dry-run -- glxgears

# 按需授予单工作区代理通道权限（仅挂载 koma-agent.sock + 作用域令牌）
komactl sandbox run --with-agent-sock --ro-bind ~/repo:/workspace -- code-oss
```

| 选项 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `--runtime <bwrap\|podman>` | `bwrap` | 指定容器引擎（传入 `--image` 时自动切换 `podman`） |
| `--ws <ws_id\|auto>` | `auto` | 复用既有 `ws_id` 或自动新建 `Headless` 工作区 |
| `--name <name>` | `sandbox` | 新建无头工作区名称 |
| `--geometry <WxH[@scale]>` | `1920x1080` | 无头视口分辨率与缩放（如 `2560x1600@1.6`） |
| `--bind <host:guest>` / `--ro-bind` | 无 | 显式声明读写或只读挂载目录 |
| `--share-net` | 关闭 | 启用宿主机网络（`bwrap`）或 `pasta`（`podman`）；默认断网隔离 |
| `--no-gpu` | 关闭 | 不挂载 `/dev/dri`，强制走 Mesa/Lavapipe 软件渲染 |
| `--nvidia` | 关闭 | 为 Podman 附加 `--device=nvidia.com/gpu=all` CDI 设备参数 |
| `--with-agent-sock` | 关闭 | 挂载 `koma-agent.sock` 并注入单工作区 `KOMA_CAPABILITY_TOKEN`（永不挂载 `koma-admin.sock`） |
| `--keep-jail` | 关闭 | 容器退出后保留 `jail-<ws_id>.sock`（可用 `create-jail` / `revoke-jail` 手动管理） |
| `--dry-run` | 关闭 | 仅打印生成的容器命令而不实际拉起进程 |

## 全局空间概览（`koma-overview`）

![koma-overview 空间工作区概览界面](https://cdn.komawm.org/media/koma-overview.webp)

通过 `Mod + Tab`（或自定义绑定 `koma.act.overview.toggle()`）呼出 `koma-overview`：

- 通过 `zwlr_layer_shell_v1` 挂载在当前活跃显示器上，并从 `koma-admin.sock` 读取 `scene.inventory`。
- 将有头桌面工作区与 `agent:work` 无头工作区（含 Deck 焦点窗与 Stash 数量）同屏平铺展示，空闲时不触发多余 GPU 重绘。
