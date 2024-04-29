import { ExtensionHost } from './ExtensionHost.js'
import { IPC } from './IPC.js'

const extensionHost = new ExtensionHost(new IPC())
extensionHost.listen()
