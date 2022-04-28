# For developers

## Prerequisites

SuperConductor has some native dependencies which need to be (re)built from source. This requires a full Node.js native module compiler toolchain, including Python 3.

On Windows, modern versions of the Node.js installer come with all the necessary build tools, and no further action is required. If you have issues with Python, install [Python 3](https://www.python.org/downloads/).

On Linux, install the `build-essential` package and then install Python 3.

On macOS, install XCode and its optional tools `xcode-select --install` and then install Python 3.

## Quick start

- [Install Yarn](https://yarnpkg.com/getting-started/install)
- `cd >>path-to-this-folder<<`
- `yarn`
- `yarn setup`
- `yarn start` (Builds the project and starts the SuperConductor)

## Architecture Overview

The project consists of 3 applications:

- React application (application UI)
- Electron backend (hosts frontend and implements logic)
- TSR Bridge (node app that exposes HTTP server and executes TSR)

Instructions for running each app are in their respective folder.

## Installing Dependencies

This project is a Lerna monorepo, which means that installing dependencies is handled a little differently. To properly bootstrap this project, install all dependencies, and cross-link the various packages, execute the following commands in the root of the project:

```bash
# Installs all dependencies, including Lerna.
yarn

# Installs all dependencies and symlinks projects together, using Lerna.
yarn setup
```

## Building the project

```bash
# Compile Typescript, run Webpack, etc:
yarn build

# Make binaries for the SuperConductor UI and tsr-bridge. Must have run "yarn build" first.
# The SuperConductor UI binary will be located at apps/app/dist.
# The tsr-bridge binary will be located at apps/tsr-bridge/dist.
# This command should work on all platforms (Windows, macOS, and Linux).
yarn build:binary
```

## Making a new release (Admins only)

1. Run `yarn release` in the root of the repo to bump the appropriate version numbers in the various `package.json` files. Lerna will automatically commit and push the changes along with the appropriate tag.
2. Wait for the [`Create GitHub Release`](https://github.com/SuperFlyTV/SuperConductor/actions/workflows/create-release.yaml) action to finish.
3. Go to the [releases](https://github.com/SuperFlyTV/SuperConductor/releases) page and publish the draft release.
