# SuperConductor

## Installation

For end users, SuperConductor consists of two applications: the SuperConductor UI and a command-line program called `tsr-bridge`. These two applications can be run on different computers (each running a different operating system, if needed) and talk to each other over the network. It is recommended that `tsr-bridge` be run on the same computer as CasparCG.

### Windows

1. Head to the [releases page](https://github.com/SuperFlyTV/SuperConductor/releases) and download both `SuperConductor-Setup-X.Y.Z.exe` and `tsr-bridge-vX.Y.Z-windows.exe`.
2. Run `SuperConductor-Setup-X.Y.Z.exe` to install the main SuperConductor application, then launch SuperConductor from either the Desktop shortcut or the Start Menu.
3. Run `tsr-bridge-vX.Y.Z-windows.exe` to start up `tsr-bridge`. This is a standalone application with no installer.

### macOS

1. Head to the [releases page](https://github.com/SuperFlyTV/SuperConductor/releases) and download both `SuperConductor-X.Y.Z.dmg` and `tsr-bridge-macos`.
2. Run `SuperConductor-X.Y.Z.dmg` to install the main SuperConductor application, then launch SuperConductor from the Applications menu in Finder.
3. Open a terminal and execute the following:

   ```bash
   chmod +x Downloads/tsr-bridge-macos
   ```

4. Back in Finder, Ctrl+Click on `tsr-bridge-macos` and click "Open". You'll receive a warning about the identity of the developer being unable to be confirmed. Click the "Open" button in this popup.

### Linux (Ubuntu)

1. Head to the [releases page](https://github.com/SuperFlyTV/SuperConductor/releases) and download both `SuperConductor-X.Y.Z.AppImage` and `tsr-bridge-vX.Y.Z-linux`.
2. Execute the following before double-clicking on the AppImage it to run it:

   ```bash
   # Replace X.Y.Z with the actual version number.
   chmod +x Downloads/SuperConductor-X.Y.Z.AppImage
   ```

3. Run `tsr-bridge`:

   ```bash
   # Replace X.Y.Z with the actual version number.
   chmod +x Downloads/tsr-bridge-vX.Y.Z-linux
   ./Downloads/tsr-bridge-vX.Y.Z-linux
   ```

## Usage

If you've installed the SuperConductor UI and `tsr-bridge` on two different computers, then you'll need to configure the SuperConductor UI with the IP/host of the computer where `tsr-bridge` is running:

1. Open the SuperConductor UI.
2. Navigate to `Edit > Preferences` (`SuperConductor > Preferences` on macOS).
3. Click on the "Bridges" tab.
4. Edit the `URL` field to point to the computer where `tsr-bridge` is running by replacing `localhost` with the IP address of that computer.

## For Developers

### Quick start

- [Install Yarn](https://yarnpkg.com/getting-started/install)
- `cd >>path-to-this-folder<<`
- `yarn`
- `yarn setup`
- `yarn start:electron` (Starts both the Superconductor and TSR-bridge)

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
