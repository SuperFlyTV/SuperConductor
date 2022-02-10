import { openStreamDeck } from '@elgato-stream-deck/node'
import { AttentionLevel, KeyDisplay } from '@shared/api'
import fs from 'fs'
import { drawKeyDisplay } from './peripherals/streamdeck'

async function doIt() {
	const streamDeck = openStreamDeck()

	const keyDisplay: KeyDisplay = {
		attentionLevel: AttentionLevel.ALERT,
		// header: {
		// 	long: 'Hello, My name is Johan',
		// 	// short: "Hi, I'm Johan",
		// },
		// info: {
		// 	// long: 'abcdefghifklmnopqrstuvxyzåäö',
		// 	long: '00:00:00',
		// 	short: '00:00:00',
		// 	// long: 'I am a software engineer',
		// 	// short: 'I work here',
		// },
		// thumbnail: fs.readFileSync('./src/img.txt', 'utf-8'),
	}
	// const keyDisplay: KeyDisplay = {
	// 	attentionLevel: AttentionLevel.NEUTRAL,
	// }

	await drawKeyDisplay(streamDeck, 0, { ...keyDisplay })
	// await drawKeyDisplay(streamDeck, 0, { ...keyDisplay, attentionLevel: AttentionLevel.IGNORE })
	// await drawKeyDisplay(streamDeck, 1, { ...keyDisplay, attentionLevel: AttentionLevel.NEUTRAL })
	// await drawKeyDisplay(streamDeck, 2, { ...keyDisplay, attentionLevel: AttentionLevel.INFO })
	// await drawKeyDisplay(streamDeck, 3, { ...keyDisplay, attentionLevel: AttentionLevel.NOTIFY })
	// await drawKeyDisplay(streamDeck, 4, { ...keyDisplay, attentionLevel: AttentionLevel.ALERT })

	// await drawKeyDisplay(streamDeck, 5, { ...keyDisplay, thumbnail: '', attentionLevel: AttentionLevel.IGNORE })
	// await drawKeyDisplay(streamDeck, 6, { ...keyDisplay, thumbnail: '', attentionLevel: AttentionLevel.NEUTRAL })
	// await drawKeyDisplay(streamDeck, 7, { ...keyDisplay, thumbnail: '', attentionLevel: AttentionLevel.INFO })
	// await drawKeyDisplay(streamDeck, 8, { ...keyDisplay, thumbnail: '', attentionLevel: AttentionLevel.NOTIFY })
	// await drawKeyDisplay(streamDeck, 9, { ...keyDisplay, thumbnail: '', attentionLevel: AttentionLevel.ALERT })

	// await drawKeyDisplay(streamDeck, 10, { ...keyDisplay, attentionLevel: AttentionLevel.IGNORE }, true)
	// await drawKeyDisplay(streamDeck, 11, { ...keyDisplay, attentionLevel: AttentionLevel.NEUTRAL }, true)
	// await drawKeyDisplay(streamDeck, 12, { ...keyDisplay, attentionLevel: AttentionLevel.INFO }, true)
	// await drawKeyDisplay(streamDeck, 13, { ...keyDisplay, attentionLevel: AttentionLevel.NOTIFY }, true)
	// await drawKeyDisplay(streamDeck, 14, { ...keyDisplay, attentionLevel: AttentionLevel.ALERT }, true)
}
doIt().catch(console.error)
