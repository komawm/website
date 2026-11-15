# フックの法則バネ物理・ベジェ曲線・外観カスタマイズ

Koma は `init.lua` 上で、決定論的な **減衰フックの法則・半陰的オイラー法（Semi-Implicit Euler）バネソルバー**、カスタム **3次ベジェ曲線**、チャネル別アニメーションスタイル、Dual Kawase ブラー、回転グラデーションボーダー、ウィンドウ単位の Rice ルールを統合しています。

## 減衰フックの法則・半陰的オイラー法ソルバー

既定（`solver = "spring"`）では、ウィンドウの位置・サイズ・不透明度・フォーカス補間・ワークスペース移動を以下の 2 階減衰バネ常微分方程式で駆動します。

$$m\ddot{x} + c\dot{x} + k(x - x_{\text{target}}) = 0$$

質量 $m \ge 0.01$、減衰係数 $c \ge 0.0$、ばね定数 $k \ge 1.0$、収束閾値 $\epsilon \ge 10^{-6}$ が与えられると、各サブステップで先に速度、次に位置を更新します（シンプレクティック／半陰的オイラー積分）。

$$v_{t+\Delta t} = v_t + \frac{-k(x_t - x_{\text{target}}) - c v_t}{m}\Delta t$$

$$x_{t+\Delta t} = x_t + v_{t+\Delta t}\Delta t$$

物理減衰 $c$ の代わりに無次元減衰比 $\zeta$ を指定した場合、Koma は $c = 2\zeta\sqrt{mk}$ として自動換算します。

### サブステップ分割と動的ターゲットの運動量保持

高リフレッシュレート環境やフレームドロップ時にも数値安定性を保ち、1 トラックあたり $O(1)$ 時間・$O(1)$ 空間で計算するため、以下の設計を採用しています。

- フレーム経過時間は $0.0 \le \Delta t \le 0.1\,\text{s}$ にクランプされ、$N = \lceil \Delta t / (1/240) \rceil \in [1, 24]$ 個の等間隔サブステップへ分割されます。
- ドラッグ操作、ホバーによるフォーカス移動、タイリング再配置、連続ワークスペース切替などでターゲットが途中変更された場合でも、`retarget` は位置 $x$ と速度 $v$ を維持したまま $x_{\text{target}}$ のみを更新し、物理的運動量を保ちます。
- $|x - x_{\text{target}}| \le 50\epsilon$ かつ $|v| \le 250\epsilon$ に達した時点で静止状態へスナップします。

解析解ベースのバネを望む場合は、全体または曲線単位で `solver = "analytical_spring"` を指定できます。

## カスタム 3次ベジェ曲線（`koma.bezier`）

`koma.bezier(name, x1, y1, x2, y2, duration_ms)` またはテーブル形式で名前付きベジェ曲線を登録できます。

- 制御点 $x_1, x_2$ は $[0.0, 1.0]$ に制限され、$y_1, y_2$ は $[-2.0, 3.0]$ を許容するため `[0.05, 0.9, 0.1, 1.1]` のようなオーバーシュート表現が可能です。
- 再生時間は $1 \le d \le 5000\,\text{ms}$ にクランプされます。
- $X(u) = \tau$ の求解には 8 回の Newton-Raphson 反復と 12 回の二分法フォールバックを用い（$O(1)$ 時間・空間）、連鎖律に基づく実時間速度 $\dot{x}(t)$ を算出してバネ運動への滑らかな引き継ぎを実現します。

## 組み込みプリセットとチャネル別設定

名前で直接参照できる組み込みカーブ一覧：

| プリセット名 | 定義 | 特性 |
| --- | --- | --- |
| `linear` | `[0.0, 0.0, 1.0, 1.0]` | 等速リニア |
| `ease_out` / `default` | `[0.22, 1.0, 0.36, 1.0]` | キレのある標準イーズアウト |
| `md3_decel` | `[0.05, 0.7, 0.1, 1.0]` | Material Design 3 減速 |
| `overshot` | `[0.05, 0.9, 0.1, 1.1]` | 軽快なオーバーシュート |
| `fluent` | `[0.1, 0.9, 0.2, 1.0]` | 滑らかな Fluent カーブ |
| `snappy_spring` | `m = 1.0, c = 36.0, k = 420.0` | 俊敏で引き締まったバネ |
| `bouncy_spring` | `m = 1.0, c = 20.0, k = 320.0` | 反発感のあるバウンスバネ |
| `gentle_spring` | `m = 1.2, c = 28.0, k = 180.0` | 落ち着いた減衰バネ |

カスタム曲線を登録したうえで、`windows_open`（エイリアス `windows_in`）、`windows_close`（エイリアス `windows_out`）、`windows_move`、`fade`、`border`、`workspaces` の各チャネルに割り当てます。

```lua
koma.bezier("rice_pop", 0.05, 0.9, 0.1, 1.1, 260)
koma.spring("glide", { mass = 1.0, damping_ratio = 0.82, stiffness = 360.0 })

koma.appearance({
  animations = {
    enabled = true,
    solver = "spring",
    windows_open = { enabled = true, curve = "rice_pop", style = "popin 85%" },
    windows_close = { enabled = true, curve = "glide", style = "slide" },
    windows_move = { enabled = true, curve = "glide" },
    fade = { enabled = true, curve = "md3_decel", duration_ms = 180 },
    border = { enabled = true, curve = "snappy_spring" },
    workspaces = { enabled = true, curve = "overshot", style = "slidevert" },
  },
})
```

ウィンドウ開閉スタイルは `popin`（`popin 85%` 等）、`slide`（最近接エッジ、または `slide top|bottom|left|right`）、`gnomed`、`fade` をサポートします。ワークスペース遷移は `slide`、`slidevert`、`fade`、`none` に対応し、ヘッドレス記録や画面共有時は自動的に遷移をスキップします。

## グラデーションボーダー・Dual Kawase ブラー・ウィンドウルール

GLES2 互換の回転グラデーションボーダーと Dual Kawase ブラーをウィンドウ単位ルールと組み合わせます。

```lua
koma.appearance({
  border = {
    width = 2,
    radius = 12,
    active_color = "#7aa2f7ff",
    active_color_end = "#bb9af7ff",
    inactive_color = "#292e42cc",
    inactive_color_end = "#1f2335cc",
    gradient_angle = 45.0,
    gradient_rotate_rpm = 6.0,
  },
  blur = {
    enabled = true,
    passes = 3,
    size = 6,
  },
})

koma.rule.window({
  name = "terminal-rice",
  matches = { { app_id = "^foot$" } },
  opacity = 0.96,
  inactive_opacity = 0.84,
  animation = "popin 88%",
  border_color = "#7dcfffff",
})

koma.rule.window({
  name = "video-player-clean",
  matches = { { app_id = "^mpv$" } },
  no_blur = true,
  no_shadow = true,
  inactive_opacity = 1.0,
})
```

フォーカス切替時には `WindowAnimationTable` が `border` カーブに沿って `focus_factor` $\in [0, 1]$ を補間し、アクティブ・非アクティブ間のボーダー色を滑らかに遷移させます。
