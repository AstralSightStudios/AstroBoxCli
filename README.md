# AstroBox CLI

A command-line interface for interacting with [AstroBox](https://astrobox.online) — open the app, check status, and install local resources without leaving your terminal.

## Installation

```bash
npm install -g astrobox-cli
```

Or run directly with `npx`:

```bash
npx abcli <command>
```

Requires Node.js >= 20.

## Usage

```
abcli [options] [command]

Options:
  -v, --version   display the current version
  -h, --help      display help for command

Commands:
  open [options]  Launch AstroBox via astrobox:// protocol
  status          Query AstroBox connection status
  install <path>  Install a local resource file through AstroBox
  help [command]  display help for command
```

### `abcli open`

Opens AstroBox using the `astrobox://` protocol URL.

```bash
abcli open
```

### `abcli status`

Queries the local AstroBox API to check whether it's running and lists connected devices.

```bash
abcli status
```

Example output:

```
AstroBox: connected
Devices: 1
- Xiaomi Smart Band 9 Pro C692 (3C:AF:B7:ED:C6:92)
```

### `abcli install <path>`

Sends a local file to AstroBox for installation.

```bash
abcli install ./app.rpk
```

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
