import React from 'react'
import sorensen, { Sorensen } from '@sofie-automation/sorensen'
import { ActiveTriggers } from '../../models/rundown/Trigger'
import { EventEmitter } from 'events'
/** Used to communicate with the backend */

export interface IHotkeyContext {
	triggers: TriggersEmitter
	sorensen: Sorensen
}
export class TriggersEmitter extends EventEmitter {
	emitTrigger(triggers: ActiveTriggers) {
		this.emit('trigger', triggers)
	}
}
export const HotkeyContext = React.createContext<IHotkeyContext>({
	sorensen,
	triggers: new TriggersEmitter(),
})
