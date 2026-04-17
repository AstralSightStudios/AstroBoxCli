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
astrobox-cli [options] [command]

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

### `astrobox-cli open`

Opens AstroBox using the `astrobox://` protocol URL.

```bash
astrobox-cli open
# or with a custom URL
astrobox-cli open --url astrobox://workspace
```

### `astrobox-cli status`

Queries the local AstroBox API to check whether it's running and lists connected devices.

```bash
astrobox-cli status
```

Example output:

```
AstroBox: connected
Devices: 2
- Xiaomi Smart Band 9 Pro C692 (3C:AF:B7:ED:C6:92) [connected]
```

### `astrobox-cli install <path>`

Sends a local file to AstroBox for installation.

```bash
astrobox-cli install ./app.rpk
```

### `astrobox-cli device`

Manage saved devices.

```bash
# List all devices
astrobox-cli device list

# Show full details for a device (including authkey)
astrobox-cli device show <addr>

# Connect a new device
astrobox-cli device connect \
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

### `astrobox-cli provider`

Browse and interact with resource providers.

```bash
# List all providers
astrobox-cli provider list

# Get provider state (Ready / Updating / Failed...)
astrobox-cli provider state OfficialV2

# Get category list
astrobox-cli provider categories OfficialV2

# Refresh provider cache
astrobox-cli provider refresh OfficialV2
astrobox-cli provider refresh OfficialV2 --cfg "..."

# Get total item count
astrobox-cli provider total OfficialV2

# Paginated content
astrobox-cli provider page OfficialV2 --page 1 --limit 10 --category watchface --sort time

# Get item detail
astrobox-cli provider item OfficialV2 <id>

# Resolve download link
astrobox-cli provider download OfficialV2 \
  --id <id> \
  --device xmb9p \
  --downloadKey xmb9p
```

`page` options:

| Flag | Default | Description |
|------|---------|-------------|
| `--page` | `1` | Page number (1-based) |
| `--limit` | `20` | Items per page |
| `--keyword` | — | Search keyword |
| `--category` | — | Comma-separated categories |
| `--sort` | `time` | `time` / `name` / `random` |

> Note: AstroBox local API uses 0-based `page`, but CLI `--page` is 1-based for easier use.

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
