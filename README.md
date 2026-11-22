# Restreamer-UI

The user interface of the Restreamer for the connection to the [datarhei Core](https://github.com/datarhei/core) application.

- React
- Material-UI (MUI)

## Development

Please base pull requests on the project's development branch.

### For the Restreamer interface

```bash
git clone https://github.com/KingIronMan2011/restreamer-ui.git
cd restreamer-ui
pnpm install
pnpm dev
pnpm lint
pnpm types
pnpm test
pnpm build
```

Connect the UI with a [datarhei Core](https://github.com/datarhei/core):
<http://localhost:5173?address=http://core-ip:core-port>

### To add/fix translations

Locales are located in `src/languages`

```bash
pnpm run i18n:extract:clean
pnpm run i18n:compile
```

In order to contribute translations, please visit [Restreamer on poeditor.com](https://poeditor.com/join/project/ogATl3F48K)

## License

See the [LICENSE](./LICENSE) file for licensing information.
