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

1. Head to the [releases page](https://github.com/SuperFlyTV/SuperConductor/releases) and download both `super-conductor_X.Y.Z_amd64.deb` (or `SuperConductor-X.Y.Z.AppImage`) and `tsr-bridge-vX.Y.Z-linux`.
2. If you downloaded the `.deb` package, you can install it by double clicking on it or by running the following:

   ```bash
   # Replace X.Y.Z with the actual version number.
   sudo dpkg -i super-conductor_X.Y.Z._amd64.deb
   ```

3. If you downloaded the `.AppImage` package, execute the following before double-clicking on it to run it:

   ```bash
   # Replace X.Y.Z with the actual version number.
   chmod +x Downloads/SuperConductor-X.Y.Z.AppImage
   ```

4. Run `tsr-bridge`:

   ```bash
   # Replace X.Y.Z with the actual version number.
   chmod +x Downloads/tsr-bridge-vX.Y.Z-linux
   ./Downloads/tsr-bridge-vX.Y.Z-linux
   ```

## Usage

If you've installed the SuperConductor UI and `tsr-bridge` on two different computers, then you'll need to configure the SuperConductor UI with the IP/host of the computer where `tsr-bridge` is running:

1. Open the SuperConductor UI.
2. Navigate to `File > Settings`.
3. Click on the "Bridges" tab.
4. Edit the `URL` field to point to the computer where `tsr-bridge` is running by replacing `localhost` with the IP address of that computer.

## For Developers

### Architecture Overview

The project consists of 3 applications:

- React application (application UI)
- Electron backend (hosts frontend and implements logic)
- TSR Bridge (node app that exposes HTTP server and executes TSR)

Instructions for running each app are in their respective folder.

### Making a new release

1. Run `lerna version` in the root of the repo to bump the appropriate version numbers in the various `package.json` files. Lerna will automatically commit and push the changes along with the appropriate tag.
2. Wait for the [`Create GitHub Release`](https://github.com/SuperFlyTV/SuperConductor/actions/workflows/create-release.yaml) action to finish.
3. Go to the [releases](https://github.com/SuperFlyTV/SuperConductor/releases) page and publish the draft release.
