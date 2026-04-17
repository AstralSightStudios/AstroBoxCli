# AstroBox CLI

A command-line interface for interacting with [AstroBox](https://astrobox.online) — open the app, check status, and install local resources without leaving your terminal.

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
astrobox [options] [command]

Options:
  -v, --version   display the current version
  -h, --help      display help for command

Commands:
  open [options]  Launch AstroBox via astrobox:// protocol
  status          Query AstroBox connection status
  install <path>  Install a local resource file through AstroBox
  help [command]  display help for command
```

### `astrobox open`

Opens AstroBox using the `astrobox://` protocol URL.

```bash
astrobox open
# or with a custom URL
astrobox open --url astrobox://workspace
```

### `astrobox status`

Queries the local AstroBox API to check whether it's running and lists connected devices.

```bash
astrobox status
```

Example output:

```
AstroBox: connected
Devices: 2
- Pixel 8 (192.168.1.42)
- Galaxy S23 (192.168.1.55)
```

### `astrobox install <path>`

Sends a local file to AstroBox for installation. The path is resolved relative to the current working directory.

```bash
astrobox install ./app.apk
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
