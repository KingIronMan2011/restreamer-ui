# Restreamer UI

Restreamer UI is the web interface for [datarhei Core](https://github.com/datarhei/core). It lets you configure and manage video ingest channels, publication services, player pages, and Core settings from a browser.

The frontend is built with React, TypeScript, Vite, and Material UI. It connects to Core's HTTP API; it does not process or store video itself.

## Requirements

- Node.js 24 for local development and builds
- pnpm 12.21.0 (the repository pins this version in `package.json`)
- A running datarhei Core instance to use the UI

Enable Corepack to activate the pinned pnpm version:

```sh
corepack enable
```

## Run locally

```sh
git clone https://github.com/KingIronMan2011/restreamer-ui.git
cd restreamer-ui
pnpm install
pnpm dev
```

Open the Vite development server at <http://localhost:5173/>. Set the Core address with the `address` query parameter:

```text
http://localhost:5173/?address=http://localhost:8080
```

Use the base URL where Core is reachable from your browser. Do not append `/api`; the UI adds that path when it makes API requests. If Core is served from the same origin as the UI, the `address` parameter can be omitted.

## Project commands

| Command              | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `pnpm dev`           | Start the Vite development server on port 5173.               |
| `pnpm build`         | Create a production build in `dist/`.                         |
| `pnpm start`         | Preview the production build locally. Run `pnpm build` first. |
| `pnpm lint`          | Run Oxlint.                                                   |
| `pnpm types`         | Check TypeScript types.                                       |
| `pnpm test`          | Run the Vitest suite once.                                    |
| `pnpm test:watch`    | Run Vitest in watch mode.                                     |
| `pnpm test:coverage` | Run Vitest with coverage reporting.                           |
| `pnpm format`        | Format the repository with Oxfmt.                             |
| `pnpm format:check`  | Check formatting without changing files.                      |

## Build and run with Docker

Build the UI image from the repository:

```sh
docker build -t restreamer-ui .
docker run --rm -p 3000:3000 restreamer-ui
```

Open <http://localhost:3000/>. Add `?address=http://core-host:8080` if Core is at a different address.

Images are published to Docker Hub and GitHub Container Registry:

```sh
docker run --rm -p 3000:3000 kingjulian2011/reastreamer-ui:dev
docker run --rm -p 3000:3000 ghcr.io/kingironman2011/restreamer-ui:dev
```

The `dev` images are built from pushes to `main`. The release workflow publishes `latest` and the package version when manually dispatched.

## Translations

Translations are in `src/languages`. To update message catalogs and compile them:

```sh
pnpm run i18n:extract:clean
pnpm run i18n:compile
```

Community translations are coordinated through [POEditor](https://poeditor.com/join/project/ogATl3F48K).

## Contributing

Open pull requests against the project's development branch. Before submitting a change, run:

```sh
pnpm lint
pnpm types
pnpm test
pnpm build
pnpm format:check
```

## License

Restreamer UI is licensed under [Apache 2.0](LICENSE).
