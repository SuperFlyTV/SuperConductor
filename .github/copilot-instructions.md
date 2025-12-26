# Copilot / AI agent instructions for SuperConductor

This file contains concise, actionable notes for AI coding agents to be immediately productive in this monorepo.

- **Monorepo layout:** Yarn workspaces + Lerna. Top-level packages live in `shared/packages/*` and apps in `apps/*`.
- **Primary apps:** `apps/app` (Electron + React client) and `apps/tsr-bridge` (TSR bridge). See [apps/app/README.md](apps/app/README.md) and [apps/tsr-bridge/README.md](apps/tsr-bridge/README.md).

- **Build / dev flow (quick):**
  - Install: run `yarn` at repository root (uses Yarn v4/corepack).
  - Full build: `yarn build` (runs `tsc -b tsconfig.build.json` then `lerna run build`).
  - Dev (Electron app): `yarn start` (builds TS then runs `dev:electron` via Lerna) or from `apps/app` run `yarn dev` to start Vite + nodemon concurrently.
  - Bridge dev: `yarn start:bridge` from root or run `lerna run dev --scope=tsr-bridge`.
  - Build binary: `yarn build:binary` (root delegates to package-specific `build:binary`, `apps/app` uses `electron-builder`).

- **TypeScript / compile notes:**
  - The repo uses project references and a top-level incremental build: `tsc -b tsconfig.build.json` (see root `package.json` -> `build:ts`).
  - After changing public types in `shared/packages/*`, run `yarn build:ts` before consuming changes in `apps/*`.

- **Testing & lint:**
  - Root: `yarn test` runs `lerna run test` across workspaces.
  - App-level tests: `apps/app` uses Jest. See `apps/app/package.json` -> `test`.
  - Lint: `yarn lint` (root) and `yarn lintfix` to auto-fix.

- **IPC & cross-process patterns:**
  - Renderer ↔ Main communication is typed and centralized. Key files: [apps/app/src/ipc/IPCAPI.ts](apps/app/src/ipc/IPCAPI.ts), [apps/app/src/preload.mts](apps/app/src/preload.mts) and main entry [apps/app/src/main.mts](apps/app/src/main.mts).
  - Electron-specific logic lives under `apps/app/src/electron/` (examples: `SuperConductor.ts`, `bridgeHandler.ts`, `sessionHandler.ts`). Use these as canonical patterns for adding new IPC endpoints.

- **Shared package usage & conventions:**
  - Shared code is published as workspace packages under `@shared/*` names (see `apps/app/package.json` dependencies). Edit source under `shared/packages/*/src` and run `yarn build:ts`.
  - Keep API changes backwards-compatible where possible; if you must change exported types, update all dependent consumers and run a full TS build.

- **Project-specific idioms:**
  - Scripts use the `run` helper (e.g. `run build:ts`) from top-level `package.json` — prefer using the workspace scripts as written.
  - Patches to third-party deps are included via Yarn patch protocol (see `apps/app/package.json` for `patch:` entries).

- **Where to look for examples:**
  - Real-time timeline & playout logic: `apps/app/src/electron/timeline.ts`, `lib/timeline.ts` under `apps/app/src/lib` and `shared/packages/lib/src`.
  - Networking & services: `apps/app/src/electron/EverythingService.ts`, `shared/packages/server-lib/src`.

- **AI editing rules (practical):**
  - Prefer small, focused edits and run `yarn build:ts` to validate TypeScript cross-workspace changes.
  - If changing an exported type in `shared/packages/*`, update consumers and run tests; mention the change in PR description.
  - Do not modify generated `dist/` outputs or artifacts under `electron-output/`.

If any section is unclear or you want deeper examples (e.g., specific IPC call patterns or where to run end-to-end flows), tell me which area and I'll add examples or expand this file.
