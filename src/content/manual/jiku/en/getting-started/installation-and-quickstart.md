# Installation & First Run

> [!NOTE]
> Installing Jiku is optional. [Koma](/docs/getting-started/installation/) works as a standalone Wayland tiling compositor without `jikud` or `jiku`.

![Running jiku CLI checks inside a Koma terminal](https://cdn.komawm.org/media/jiku-terminal.webp "Checking Jiku status and running CLI commands in a Koma terminal.")

## Installing `jikud` & `jiku`

Install prebuilt packages from [komawm/packaging](https://github.com/komawm/packaging) (signed APT `jiku` package, AUR `jiku-bin`, Linuxbrew `jiku.rb`, or `.deb`/`.rpm`/`.apk` archives), download the `v0.0.1` release tarballs (`jiku-0.0.1-x86_64-unknown-linux-gnu.tar.gz` or `jiku-0.0.1-aarch64-unknown-linux-gnu.tar.gz`) from [komawm/jiku](https://github.com/komawm/jiku), or build from source.

### Prebuilt Binary Channels (`x86_64` & `aarch64`)

```bash
# Arch Linux (AUR prebuilt package)
paru -S jiku-bin

# Debian / Ubuntu (signed APT repository)
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo bash && sudo apt install -y jiku

# Linuxbrew
curl -fsSLO https://cdn.komawm.org/install/jiku/jiku.rb && brew install --formula ./jiku.rb
```

### Build from Source

```bash
# Direct install from repository
cargo +1.100.0 install --git https://github.com/komawm/jiku.git jikud jiku --locked

# Or clone and build locally
git clone https://github.com/komawm/jiku.git
cd jiku
cargo +1.100.0 build --release --locked -p jikud -p jiku
./target/release/jikud --headless-check
```

## API Keys & Environment Variables

`jikud` reads credentials only from the environment variables configured via `api_key_env` in `config.toml`. Never store raw API keys inside `config.toml`.

| Env Variable | Default Provider | Role |
| :--- | :--- | :--- |
| `OPENCODE_GO_API_KEY` | `opencode_go` (`deepseek-v4.1-flash`) | Primary `[roles.planner]` model and automatic JSON fallback for decisions |
| `GEMINI_API_KEY` | `gemini` (`gemini-decision-1`) | Optional dedicated decision prompt model and optional live voice session |
| `KOMA_CAPABILITY_TOKEN` | Koma IPC (`koma-agent.sock`) | Scoped lease token minted with `komactl token mint jiku` |

> [!TIP]
> **No dedicated decision model key?** If `GEMINI_API_KEY` is unset (or you assign an OpenAI, Anthropic, vLLM, or Ollama provider to `[roles.decision_router]`), Jiku falls back to `[roles.planner]` using structured JSON output without error.

## First Run Checklist

1. **Validate config and Lua policy offline**:
   ```bash
   jiku validate-config
   ```
2. **Mint a scoped Koma capability token** (while `koma` is running):
   ```bash
   export KOMA_CAPABILITY_TOKEN="$(komactl token mint jiku | jq -r '.token')"
   ```
3. **Start `jikud` and verify status**:
   ```bash
   jikud --daemon &
   jiku status --json
   ```
4. **Test with a dry-run task and local diagnostics**:
   ```bash
   jiku run --dry-run "Open a terminal and check uname -a"
   jiku a11y snapshot --json
   jiku context inspect --max-tokens 4096
   jiku tts say "Jiku is ready"
   jiku avatar serve --bind 127.0.0.1:4190
   jiku bench run --offline
   ```

## Using Jiku from External Coding Agents (`Claude Code`, `Codex`, `OpenCode`, `pi`, `Cursor`)

Both `jiku mcp` (12 orchestration tools) and `koma-mcp` (17 compositor tools) auto-detect `Content-Length` and `NDJSON` stdio framing per message. Register them in `Claude Code`, `Codex`, `Cursor`, `pi`, or OpenCode (`~/.config/opencode/opencode.json`):

```json
{
  "mcp": {
    "koma": {
      "type": "local",
      "command": ["koma-mcp", "--auto-mint-admin"],
      "enabled": true
    },
    "jiku": {
      "type": "local",
      "command": ["jiku", "mcp"],
      "enabled": true
    }
  }
}
```

You can also point coding agents at `jiku/skills/SKILL.md` so they invoke `jiku run`, `jiku decide`, `jiku a11y`, `jiku context inspect`, `jiku box classify`, and `jiku memory search` under Koma's Epoch-fenced IPC.
