# AstroBox CLI

A command-line interface for interacting with [AstroBox](https://astrobox.online) — open the app, check status, manage devices, browse providers, and install local resources without leaving your terminal.

## Installation

```bash
npm install -g astrobox-cli
```

Or run directly with `npx`:

```bash
npx astrobox-cli <command>
```

Requires Node.js >= 20.

## Usage

```
abcli [options] [command]

Options:
  -v, --version   display the current version
  -h, --help      display help for command

Commands:
  open [options]     Launch AstroBox via astrobox:// protocol
  status             Query AstroBox connection status
  install <path>     Install a local resource file through AstroBox
  device             Manage AstroBox devices
  provider           Manage AstroBox providers
  help [command]     display help for command
```

### `abcli open`

Opens AstroBox using the `astrobox://` protocol URL.

```bash
abcli open
# or with a custom URL
abcli open --url astrobox://workspace
```

### `abcli status`

Queries the local AstroBox API to check whether it's running and lists connected devices.

```bash
abcli status
```

Example output:

```
AstroBox: connected
Devices: 2
- Xiaomi Smart Band 9 Pro C692 (3C:AF:B7:ED:C6:92) [connected]
```

### `abcli install <path>`

Sends a local file to AstroBox for installation.

```bash
abcli install ./app.rpk
```

### `abcli device`

Manage saved devices.

```bash
# List all devices
abcli device list

# Show full details for a device (including authkey)
abcli device show <addr>

# Connect a new device
abcli device connect \
  --name "Xiaomi Smart Band 9 Pro C692" \
  --addr "3C:AF:B7:ED:C6:92" \
  --authkey "your-authkey"
```

Optional flags for `connect`:

| Flag | Default | Description |
|------|---------|-------------|
| `--sarVersion` | `2` | SAR version |
| `--txWinOverrunAllowance` | — | TX window overrun allowance |
| `--connectType` | `SPP` | `SPP` or `BLE` |

### `abcli provider`

Browse and interact with resource providers.

```bash
# List all providers
abcli provider list

# Get provider state (Ready / Updating / Failed...)
abcli provider state OfficialV2

# Get category list
abcli provider categories OfficialV2

# Refresh provider cache
abcli provider refresh OfficialV2
abcli provider refresh OfficialV2 --cfg "..."

# Get total item count
abcli provider total OfficialV2

# Paginated content
abcli provider page OfficialV2 --page 1 --limit 10 --category watchface --sort time

# Get item detail
abcli provider item OfficialV2 <id>

# Resolve download link
abcli provider download OfficialV2 \
  --id <id> \
  --device xmb9p \
  --downloadKey xmb9p
```

`page` options:

| Flag | Default | Description |
|------|---------|-------------|
| `--page` | `1` | Page number |
| `--limit` | `20` | Items per page |
| `--keyword` | — | Search keyword |
| `--category` | — | Comma-separated categories |
| `--sort` | `time` | `time` / `name` / `random` |

`download` options:

| Flag | Required | Description |
|------|----------|-------------|
| `--id` | Yes | Resource ID |
| `--downloadKey` | No | Download entry key |
| `--device` | No | Device key (required for some OfficialV2 items) |
| `--trial` | No | Trial download flag |

## Development

```bash
# Install dependencies
pnpm install

# Development watch mode
pnpm dev

# Type check
pnpm typecheck

# Build for production
pnpm build

# Run CLI locally
pnpm cli <command>
```

## License

MIT
