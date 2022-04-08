# SuperConductor

A playout client for _Windows/Linux/macOS_ that will let you control _CasparCG&nbsp;Server_, BMD&nbsp;_ATEM_, _OBS&nbsp;Studio_, and more!

![Screenshot](/doc/img/screenshot0.png)

## Installation

### Windows

Go to the [Latest Release](https://github.com/SuperFlyTV/SuperConductor/releases/latest), download and open the .exe file.

### Linux (Ubuntu)

1. Go to the [Latest Release](https://github.com/SuperFlyTV/SuperConductor/releases/latest), download the installer .AppImage file.
2. Execute the following before running the file:
   ```bash
   # Replace X.Y.Z with the actual version number.
   chmod +x Downloads/SuperConductor-X.Y.Z-Linux-Executable.AppImage
   ```

### macOS

Go to the [Latest Release](https://github.com/SuperFlyTV/SuperConductor/releases/latest), download and open the .dmg file.


## Features

### Playout

Under the hood, _SuperConductor_ is powered by the same playout backend as the [Sofie Automation system](https://www.sofieautomation.com/), with timeline-based control of multiple devices.

![Timeline playout](/doc/img/play.gif)

### Edit Timeline

Drag objects onto the timeline, edit them and play them out instantly.

![Edit timeline](/doc/img/edit-timeline.gif)

### Stream&nbsp;Deck and X-keys Support

Assign keys on Stream&nbsp;Deck or X-keys to playout actions.

![Stream&nbsp;Deck GUI](/doc/img/streamdeck-GUI.gif) ![Stream&nbsp;Deck](/doc/img/streamdeck.gif)

### Supported Devices

_SuperConductor is powered by the [TSR library](https://github.com/nrkno/sofie-timeline-state-resolver) used in the [Sofie Automation system](https://www.sofieautomation.com/), so it can play anything that TSR can play._

- **[CasparCG&nbsp;Server](https://casparcg.com/)** Video and graphics playout software
- **[Blackmagic Design ATEM](https://www.blackmagicdesign.com/products)** Vision mixers
- **[OBS Studio](https://obsproject.com/)** Live video production software
- **[vMix](https://www.vmix.com/)** software vision mixer
- Arbitrary [OSC](https://en.wikipedia.org/wiki/Open_Sound_Control) compatible devices
- (GUI not implemented yet) **Blackmagic Design HyperDeck** record/playback devices
- (GUI not implemented yet) **Lawo** audio mixers
- (GUI not implemented yet) **Panasoniz PTZ** cameras
- (GUI not implemented yet) **Pharos** light control devices
- (GUI not implemented yet) **[Sisyfos](https://github.com/olzzon/sisyfos-audio-controller)** audio controller
- (GUI not implemented yet) **Quantel** video servers
- (GUI not implemented yet) **VizRT MediaSequencer** graphics system
- (GUI not implemented yet) Arbitrary HTTP (REST) compatible devices
- (GUI not implemented yet) Arbitrary TCP-socket compatible devices

## Problems and Issues

Problems and Issues can be reported here: [Issues](https://github.com/SuperFlyTV/SuperConductor/issues)

## For Developers

Contributions are very much appreciated!

Installation and usage instructions are documented here: [For developers](/doc/FOR_DEVELOPERS.md)

## Acknowledgements

SuperConductor uses many open source libraries, some of which include:

- [`caniuse-lite`](https://github.com/browserslist/caniuse-lite) with data sourced from [caniuse.com](https://caniuse.com)
- [`react-icons`](https://github.com/react-icons/react-icons)

## License

SuperConductor is licensed under the GNU Affero General Public License v3.0 or later and the license is available to read in the [LICENSE](LICENSE) and [COPYING](COPYING) files.
