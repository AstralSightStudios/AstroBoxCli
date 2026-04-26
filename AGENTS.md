# Agent Instructions

This file provides context for AI assistants working on the AstroBox CLI project.

## Project Overview

AstroBox CLI is a Node.js command-line tool that bridges the terminal and the AstroBox desktop application. It communicates with AstroBox via:

- **Protocol URLs** (`astrobox://`) to launch the app
- **Local HTTP API** (`http://127.0.0.1:10721`) for status queries, device management, resource browsing, and install queue operations

## Architecture

```
src/
├── cli.ts              # Entry point, Commander program setup
├── package-info.ts     # Package metadata helper
├── commands/
│   ├── open.ts         # Launch AstroBox via protocol URL
│   ├── status.ts       # Query /status endpoint, render device list
│   ├── install.ts      # Thin wrapper around lib/install.ts (top-level alias)
│   ├── queue.ts        # Queue subcommand group: status / start / stop / remove / install
│   ├── device.ts       # Device subcommand group: list / show / connect
│   └── provider.ts     # Provider subcommand group: list / state / categories / refresh / total / page / item / download
├── lib/
│   ├── api.ts          # fetch wrapper for AstroBox HTTP API
│   ├── constants.ts    # Protocol URL & API base URL
│   ├── errors.ts       # fail() helper for consistent error exit
│   ├── open-astrobox.ts # cross-platform `open` via child_process
│   ├── table.ts        # renderQueueTable() for CLI table rendering
│   └── install.ts      # installFile() — shared install logic (file validation, POST, --wait polling)
└── types/
    └── astrobox.ts     # API response type definitions
```

## Tech Stack

- **Runtime:** Node.js >= 20 (ES modules)
- **Bundler:** Rolldown
- **CLI Framework:** Commander.js
- **Package Manager:** pnpm
- **Language:** TypeScript 5.8+

## Coding Conventions

- All source files use **ES modules** (`"type": "module"`)
- Prefer `node:` prefix for built-in imports (e.g., `node:fs`, `node:path`)
- Errors should use the `fail()` helper from `lib/errors.ts` for consistent formatting and exit codes
- API requests go through `requestAstroBox<T>()` in `lib/api.ts`
- Types live under `src/types/`
- Commands are factory functions returning `Command` instances
- Subcommand groups nest child commands via `.addCommand()` (see `device.ts` and `queue.ts`)
- Shared logic that needs to be reused across commands goes under `src/lib/`

## Key Decisions

- The CLI does **not** bundle AstroBox itself; it assumes the app is already installed and running.
- The API client uses the global `fetch()` (available in Node.js 20+).
- `open-astrobox.ts` uses `spawn` with `detached` and `unref` to avoid blocking the terminal.
- The `install` command validates the file exists locally before sending the path to AstroBox.
- `install.ts` is a thin wrapper that delegates to `lib/install.ts`; `queue install` also shares the same implementation.
- Queue status polling with `--wait` uses ANSI escape codes to overwrite previous output lines for clean progress display.
- The project avoids CLI spinner/progress-bar dependencies; all progress rendering is done with simple `console.log` / `process.stdout.write`.
