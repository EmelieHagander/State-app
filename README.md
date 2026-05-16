# Project Tracker

A personal desktop app for tracking `STATE.md` files across multiple project
repos. Tauri 2 + React + TypeScript.

- **Read-only viewer** of each project's `STATE.md` — the app never writes to it.
- **Project registry** (name + absolute path to STATE.md + optional color),
  persisted via `tauri-plugin-store` in the OS app-data dir.
- **Per-project notes** — private, machine-local markdown, stored in the
  app-data dir. Never synced. Cross-machine setup is manual, by design.

## Develop

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build                  # full OS bundle
npm run tauri build -- --no-bundle   # just the binary
```

Linux build prerequisites: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`,
`librsvg2-dev`, `libayatana-appindicator3-dev`, `build-essential`,
`libssl-dev`.

## Fallback

`state-viewer.html` is a standalone, build-free viewer that implements the
same strict `STATE.md` parsing rules as the app.
