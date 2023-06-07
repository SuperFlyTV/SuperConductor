# SuperConductor

A playout client for _Windows/Linux/macOS_ that will let you control _CasparCG&nbsp;Server_, BMD&nbsp;_ATEM_, BMD&nbsp;_HyperDeck_, _OBS&nbsp;Studio_, _vMix_, _OSC_-compatible devices, _HTTP&nbsp;(REST)_-compatible devices, and more!

![Screenshot](/doc/img/screenshot0.png)

## Installation

### Windows

- Download and open the [installer for SuperConductor](https://github.com/SuperFlyTV/SuperConductor/releases/download/v0.11.0/SuperConductor-0.11.0-Windows-Installer.exe).
- (Optional) Download and open the [installer for separate TSR-Bridge](https://github.com/SuperFlyTV/SuperConductor/releases/download/v0.11.0/TSR-Bridge-0.11.0-Windows-Installer.exe).

### Linux (Ubuntu)

- Download the [.appImage file for SuperConductor](https://github.com/SuperFlyTV/SuperConductor/releases/download/v0.11.0/SuperConductor-0.11.0-Linux-Executable.AppImage).<br/>
  Execute the following before running the file:<br/>
  `chmod +x Downloads/SuperConductor-0.11.0-Linux-Executable.AppImage`
- (Optional) Download the [.appImage file for TSR-Bridge](https://github.com/SuperFlyTV/SuperConductor/releases/download/v0.11.0/TSR-Bridge-0.11.0-Linux-Executable.AppImage).<br/>
  Execute the following before running the file:<br/>
  `chmod +x Downloads/TSR-Bridge-0.11.0-Linux-Executable.AppImage`

### macOS

- Download and open the [installer for SuperConductor](https://github.com/SuperFlyTV/SuperConductor/releases/download/v0.11.0/SuperConductor-0.11.0-macOS-Installer.dmg).
- (Optional) Download and open the [installer for separate TSR-Bridge](https://github.com/SuperFlyTV/SuperConductor/releases/download/v0.11.0/TSR-Bridge-0.11.0-macOS-Installer.dmg).

## Problems and Issues

Problems and Issues can be reported here: [Github Issues](https://github.com/SuperFlyTV/SuperConductor/issues)

# Features

## Edit Timeline

Drag objects onto the timeline, edit them and play them out instantly.

![Edit timeline](/doc/img/edit-timeline.gif)

## Playout

Under the hood, _SuperConductor_ is powered by the same playout backend as the [Sofie Automation system](https://www.sofieautomation.com/), with timeline-based control of multiple devices.

![Timeline playout](/doc/img/intro0.gif)

### Resources

Resources (such as media files) are kept in the rightmost pane and can be dragged into the rundown to be played out right away.

![Resource pane](/doc/img/resource-pane.gif)

### GDD support

Automatically displays input fields in GUI for CasparCG-templates that expose a GDD schema.

Read more about how to write GDD (Grahics Data Definition) templates here:
https://superflytv.github.io/GraphicsDataDefinition

![Play mode single](/doc/img/gdd-input.png)

### Playout modes

- **Single item**: Only _one_ item at a time is playing within the group. Used to create playlists, which can auto-next to next item, and loop.

  ![Play mode single](/doc/img/play-mode-single.gif)

- **Multi item**: Several items can play at the same time. Useful for graphics etc.

  ![Play mode multi](/doc/img/play-mode-multi.gif)

## Stream&nbsp;Deck and X-keys Support

Assign keys on Stream&nbsp;Deck or X-keys to playout actions.

![Stream Deck GUI](/doc/img/streamdeck-GUI.gif) ![Stream Deck](/doc/img/streamdeck.gif)

## HTTP API

SuperConductor currently has a limited, internal, and unstable HTTP API. We plan to add a public and stable HTTP API with proper documentation in the future, but for now this internal API is available by default at `http://localhost:5500/api/internal`. The port can be changed by passing `--internal-http-api-port XXXX` as an argument to SuperConductor. This API can be disabled by passing the `--disable-internal-http-api` argument.

Please be aware that, because this is an internal API, it may change at any time without notice.

### Supported Devices

_SuperConductor is powered by the [TSR library](https://github.com/nrkno/sofie-timeline-state-resolver) used in the [Sofie Automation system](https://www.sofieautomation.com/), so it can play anything that TSR can play._

- **[CasparCG&nbsp;Server](https://casparcg.com/)** Video and graphics playout software
- **[Blackmagic Design ATEM](https://www.blackmagicdesign.com/products)** Vision mixers
- **[Blackmagic Design HyperDeck](https://www.blackmagicdesign.com/products)** record/playback devices
- **[OBS Studio](https://obsproject.com/)** Live video production software
- **[vMix](https://www.vmix.com/)** software vision mixer
- Arbitrary [OSC](https://en.wikipedia.org/wiki/Open_Sound_Control) compatible devices
- Arbitrary HTTP ([REST](https://en.wikipedia.org/wiki/Representational_state_transfer#Semantics_of_HTTP_methods)) compatible devices
- (GUI not implemented yet) **Lawo** audio mixers
- (GUI not implemented yet) **Panasoniz PTZ** cameras
- (GUI not implemented yet) **Pharos** light control devices
- (GUI not implemented yet) **[Sisyfos](https://github.com/olzzon/sisyfos-audio-controller)** audio controller
- (GUI not implemented yet) **Quantel** video servers
- (GUI not implemented yet) **VizRT MediaSequencer** graphics system
- (GUI not implemented yet) Arbitrary TCP-socket compatible devices

## TSR Bridge

The TSR-bridge is the application which handles the actual playout and control of the connected devices. By default, an instance of TSR-bridge runs internally in SuperConductor, so devices can be controlled directly from the application.

In some instances, you might want to run the TSR-Bridge on another computer, for example if you don't have direct network access to the devices you want to control.

TSR-Bridge can either act as a client which connects to the SuperConductor ("incoming bridge"), or as a server which the SuperConductor can connect to ("outgoing bridge"). Pick the mode that works best for you, depending on your network setup, firewalls etc..

# For Developers

Contributions are very much appreciated!

Installation and usage instructions are documented here: [For developers](/doc/FOR_DEVELOPERS.md)

## Acknowledgements

SuperConductor uses many open source libraries, some of which include:

- [`caniuse-lite`](https://github.com/browserslist/caniuse-lite) with data sourced from [caniuse.com](https://caniuse.com)
- [`react-icons`](https://github.com/react-icons/react-icons)

## License

SuperConductor is licensed under the GNU Affero General Public License v3.0 or later and the license is available to read in the [LICENSE](LICENSE) and [COPYING](COPYING) files.
