# astrobox-cli

AstroBox command line interface starter built with **pnpm + TypeScript + Rolldown**.

## Requirements

- Node.js 20+
- pnpm

## Setup

```bash
pnpm install
```

## Development

Watch and rebuild on changes:

```bash
pnpm dev
```

Run the built CLI:

```bash
node dist/cli.js --help
node dist/cli.js status
```

Link it globally for local testing:

```bash
pnpm link --global
astrobox --help
```

## Build

```bash
pnpm build
```

## Publish to npm

1. Update `name` in `package.json` if needed.
2. Make sure the package name is available.
3. Login to npm:

```bash
npm login
```

4. Publish:

```bash
npm publish
```

For a scoped package, use:

```bash
npm publish --access public
```

## Commands

### Open AstroBox app

Launch AstroBox via the `astrobox://` protocol:

```bash
astrobox open
```

You can also pass a custom protocol URL:

```bash
astrobox open --url "astrobox://some-action"
```

### Query connection status

Calls the local AstroBox API:

- Base URL: `http://127.0.0.1:10721`
- Endpoint: `GET /status`

```bash
astrobox status
```

Example output:

```txt
AstroBox: connected
Devices: 1
- Xiaomi Band 9 (AA:BB:CC:DD:EE:FF)
```

If AstroBox is running but no device is connected yet:

```txt
AstroBox: connected
Devices: 0
```

### Install a local resource

Calls the local AstroBox API:

- Base URL: `http://127.0.0.1:10721`
- Endpoint: `POST /resource/install`
- The CLI accepts any local file path and resolves it to an absolute path from the current working directory

```bash
astrobox install ./resources/watchface.bin
```

The request body sent by the CLI is:

```json
{
  "path": "/absolute/path/from/current/working/directory/resources/watchface.bin"
}
```

### Summary

```bash
astrobox --help
astrobox --version
astrobox open
astrobox status
astrobox install ./resources/watchface.bin
```

## Project structure

```text
.
├─ src/
│  └─ cli.ts
├─ dist/
├─ package.json
├─ rolldown.config.ts
├─ tsconfig.json
└─ README.md
```
