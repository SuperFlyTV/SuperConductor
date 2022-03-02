# SuperConductor

## Installation

For end users, SuperConductor consists of two applications: the SuperConductor UI and TSR-Bridge. These two applications can be run on different computers (each running a different operating system, if needed) and talk to each other over the network. It is recommended that TSR-Bridge be run on the same computer as CasparCG.

### Windows

1. Head to the [releases page](https://github.com/SuperFlyTV/SuperConductor/releases) and download both `SuperConductor-Setup-X.Y.Z.exe` and `TSR-Bridge-Setup-X.Y.Z.exe`.
2. Run `SuperConductor-Setup-X.Y.Z.exe` to install the main SuperConductor application, then launch SuperConductor from either the Desktop shortcut or the Start Menu.
3. Run `TSR-Bridge-Setup-X.Y.Z.exe` to install the TSR-Bridge application, then launch TSR-Bridge from either the Desktop shortcut or the Start Menu.

### macOS

1. Head to the [releases page](https://github.com/SuperFlyTV/SuperConductor/releases) and download either the `.dmg` or `-mac.zip` builds of SuperConductor and TSR-Bridge.
2. If you downloaded the `.dmg` builds, double click them to install the applications. Then, launch the applications from Finder.
3. If you downloaded the `.zip` builds, double-click them to extract them, then double click on the extracted applications to run them.

### Linux (Ubuntu)

1. Head to the [releases page](https://github.com/SuperFlyTV/SuperConductor/releases) and download both `SuperConductor-X.Y.Z.AppImage` and `TSR-Bridge-X.Y.Z.AppImage`.
2. Execute the following before double-clicking on the AppImages to run them:

   ```bash
   # Replace X.Y.Z with the actual version number.
   chmod +x Downloads/SuperConductor-X.Y.Z.AppImage
   chmod +x Downloads/TSR-Bridge-X.Y.Z.AppImage
   ```

## Usage

If you've installed the SuperConductor UI and `tsr-bridge` on two different computers, then you'll need to configure the SuperConductor UI with the IP/host of the computer where `tsr-bridge` is running:

1. Open the SuperConductor UI.
2. Navigate to `Edit > Preferences` (`SuperConductor > Preferences` on macOS).
3. Click on the "Bridges" tab.
4. Edit the `URL` field to point to the computer where `tsr-bridge` is running by replacing `localhost` with the IP address of that computer.

## For Developers

### Prerequisites

SuperConductor has some native dependencies which need to be (re)built from source. This requires a full Node.js native module compiler toolchain, including Python 3.

On Windows, modern versions of the Node.js installer come with all the necessary build tools, and no further action is required. If you have issues with Python, install [Python 3](https://www.python.org/downloads/).

On Linux, install the `build-essential` package and then install Python 3.

On macOS, install XCode and its optional tools `xcode-select --install` and then install Python 3.

### Quick start

- [Install Yarn](https://yarnpkg.com/getting-started/install)
- `cd >>path-to-this-folder<<`
- `yarn`
- `yarn setup`
- `yarn start:all` (Starts both the SuperConductor and TSR-Bridge)

### Architecture Overview

The project consists of 3 applications:

- React application (application UI)
- Electron backend (hosts frontend and implements logic)
- TSR Bridge (node app that exposes HTTP server and executes TSR)

Instructions for running each app are in their respective folder.

### Installing Dependencies

This project is a Lerna monorepo, which means that installing dependencies is handled a little differently. To properly bootstrap this project, install all dependencies, and cross-link the various packages, execute the following commands in the root of the project:

```bash
# Installs all dependencies, including Lerna.
yarn

# Installs all dependencies and symlinks projects together, using Lerna.
yarn setup
```

### Building the project

```bash
# Compile Typescript, run Webpack, etc:
yarn build

# Make binaries for the SuperConductor UI and tsr-bridge. Must have run "yarn build" first.
# The SuperConductor UI binary will be located at apps/app/dist.
# The tsr-bridge binary will be located at apps/tsr-bridge/dist.
# This command should work on all platforms (Windows, macOS, and Linux).
yarn build:binary
```

### Making a new release

1. Run `lerna version --force-publish` in the root of the repo to bump the appropriate version numbers in the various `package.json` files. Lerna will automatically commit and push the changes along with the appropriate tag.
2. Wait for the [`Create GitHub Release`](https://github.com/SuperFlyTV/SuperConductor/actions/workflows/create-release.yaml) action to finish.
3. Go to the [releases](https://github.com/SuperFlyTV/SuperConductor/releases) page and publish the draft release.
