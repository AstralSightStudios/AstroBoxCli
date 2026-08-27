# AstroBox CLI

A command-line interface for interacting with [AstroBox](https://astrobox.online) through AstroBox Local API v2, with automatic fallback to the legacy API — open the app, check devices, manage queues, browse providers, and install local resources.

## Installation

```bash
npm install -g astrobox-cli
```

Or run directly with `npx`:

```bash
npx astrobox-cli <command>
```

Requires Node.js >= 20.

## Authentication

On Local API v2, the first authenticated command creates an Ed25519 client identity in:

```text
~/.config/astrobox-cli/credentials.json
```

The CLI prints a pairing request and waits for you to approve it in AstroBox. After approval, it creates a short-lived Bearer session automatically. The private key and session token stay in the credentials file and are not printed.

To use another credentials path, set `ASTROBOX_CLI_CONFIG` before running the CLI. To choose the client name shown by AstroBox, set `ASTROBOX_CLI_CLIENT_NAME`.

## API compatibility

The CLI probes AstroBox once per process and selects the API automatically:

- Local API v2 uses Ed25519 pairing and Bearer sessions.
- Older AstroBox versions use the unauthenticated legacy endpoints such as `/status`, `/device/list`, `/queue/status`, and `/provider/list`.
- Device status/details/connect, queue operations, installation, and provider commands are supported on both APIs. Legacy responses are normalized to the current CLI output.
- Device data, watchface management, quick-app management, and device disconnect require Local API v2 and report a clear error on older AstroBox versions.

## Usage

```
astrobox-cli [options] [command]

Commands:
  open [options]     Launch AstroBox via astrobox:// protocol
  status             Query AstroBox connection status
  install <path>     Upload and install a local resource
  queue              Manage install queues
  device             Manage devices and installed resources
  provider           Manage AstroBox providers
```

### `astrobox-cli open`

Opens AstroBox using the `astrobox://` protocol URL. It is also the only command that does not contact the Local API.

```bash
astrobox-cli open
astrobox-cli open --url astrobox://workspace
```

### `astrobox-cli status`

Lists known and currently connected devices through `GET /v2/devices`.

```bash
astrobox-cli status
```

Example output:

```
AstroBox: connected
Devices: 2
- Xiaomi Smart Band 9 Pro C692 (3C:AF:B7:ED:C6:92) [connected]
- Another device (AA:BB:CC:DD:EE:FF) [disconnected]
```

### `astrobox-cli install <path>`

Uploads a local file and installs it on the selected device. This is a convenience alias for `astrobox-cli queue install`.

```bash
astrobox-cli install ./app.rpk
astrobox-cli install ./app.rpk --device 3C:AF:B7:ED:C6:92 --wait
```

Options:

| Flag | Required | Description |
|------|----------|-------------|
| `--device <deviceId>` | No | Target device ID; automatically selected when exactly one device is connected |
| `--resourceType <type>` | No | Resource type hint |
| `--watchfaceId <id>` | No | Watchface ID hint |
| `--wait` | No | Wait for the task to finish |

The file is sent to `POST /v2/uploads`, then queued with `POST /v2/queue/install` using the returned `uploadId`.

### `astrobox-cli queue`

Manage per-device install queues.

```bash
# Show all install queues
astrobox-cli queue status
# Show one device queue
astrobox-cli queue status --device 3C:AF:B7:ED:C6:92

# Upload and queue a file; omit the device when exactly one is connected
astrobox-cli queue install ./app.rpk
astrobox-cli queue install ./app.rpk --device 3C:AF:B7:ED:C6:92 --wait

# Start or stop a device queue; omit the device when exactly one is connected
astrobox-cli queue start
astrobox-cli queue stop --device 3C:AF:B7:ED:C6:92

# Query or cancel a task
astrobox-cli queue task <taskId>
astrobox-cli queue remove <taskId>
```

`queue remove` uses `DELETE /v2/queue/tasks/:taskId` on v2 and the legacy `POST /queue/remove` endpoint on older AstroBox versions. The legacy `--queue install|download` option remains available for old installations.

For commands that operate on one device, `--device` is optional. If exactly one device is connected, it is selected automatically. If none or multiple devices are connected, the CLI reports the problem; with multiple devices, use `--device <deviceId>`. The old positional device argument for `queue start` and `queue stop` remains supported.

### `astrobox-cli device`

Manage devices and resources installed on them. Commands that target a device can omit `--device` when exactly one device is connected.

```bash
astrobox-cli device list
astrobox-cli device show
astrobox-cli device show --device 3C:AF:B7:ED:C6:92
astrobox-cli device disconnect
astrobox-cli device data --type status

astrobox-cli device connect \
  --name "Xiaomi Smart Band 9 Pro C692" \
  --addr "3C:AF:B7:ED:C6:92" \
  --authkey "your-authkey"
```

Device data types are `info`, `status`, and `storage`; output is formatted JSON.

#### Watchfaces and Quick Apps

```bash
astrobox-cli device watchface list
astrobox-cli device watchface current <watchfaceId>
astrobox-cli device watchface remove <watchfaceId> --device 3C:AF:B7:ED:C6:92

astrobox-cli device app list
astrobox-cli device app open <packageName> --page home
astrobox-cli device app remove <packageName>
```

`device app` is also available as `device quick-app`.

Optional `connect` flags:

| Flag | Default | Description |
|------|---------|-------------|
| `--kind <kind>` | — | `xiaomi` or `vivo` |
| `--sarVersion <version>` | `2` | SAR version |
| `--txWinOverrunAllowance <allowance>` | — | TX window overrun allowance |
| `--connectType <type>` | `SPP` | `SPP` or `BLE` |

### `astrobox-cli provider`

Browse and interact with resource providers.

```bash
astrobox-cli provider list
astrobox-cli provider state OfficialV2
astrobox-cli provider categories OfficialV2
astrobox-cli provider refresh OfficialV2
astrobox-cli provider refresh OfficialV2 --cfg "..."
astrobox-cli provider total OfficialV2

astrobox-cli provider page OfficialV2 --page 1 --limit 10 --category watchface --sort time
astrobox-cli provider item OfficialV2 <id>
astrobox-cli provider download OfficialV2 \
  --id <id> \
  --device xmb9p \
  --downloadKey xmb9p
```

The CLI keeps `--page` 1-based while the v2 API uses a 0-based page index. Provider `--device` is sent as v2's `providerDeviceKey`.

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm cli <command>
```

## License

MIT
