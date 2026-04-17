# Agent Instructions

This file provides context for AI assistants working on the AstroBox CLI project.

## Project Overview

AstroBox CLI is a Node.js command-line tool that bridges the terminal and the AstroBox desktop application. It communicates with AstroBox via:

- **Protocol URLs** (`astrobox://`) to launch the app
- **Local HTTP API** (`http://127.0.0.1:10721`) for status queries and resource installation

## Architecture

```
src/
├── cli.ts              # Entry point, Commander program setup
├── package-info.ts     # Package metadata helper
├── commands/
│   ├── open.ts         # Launch AstroBox via protocol URL
│   ├── status.ts       # Query /status endpoint, render device list
│   └── install.ts      # POST local file path to /resource/install
├── lib/
│   ├── api.ts          # fetch wrapper for AstroBox HTTP API
│   ├── constants.ts    # Protocol URL & API base URL
│   ├── errors.ts       # fail() helper for consistent error exit
│   └── open-astrobox.ts # cross-platform `open` via child_process
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

## Key Decisions

- The CLI does **not** bundle AstroBox itself; it assumes the app is already installed and running.
- The API client uses the global `fetch()` (available in Node.js 20+).
- `open-astrobox.ts` uses `spawn` with `detached` and `unref` to avoid blocking the terminal.
- The install command validates the file exists locally before sending the path to AstroBox.
