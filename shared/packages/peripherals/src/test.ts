import { openStreamDeck } from '@elgato-stream-deck/node'
// import { AttentionLevel } from '@shared/api'
import sharp from 'sharp'
// import { PeripheralStreamDeck } from './peripherals/streamdeck'

// PeripheralStreamDeck.Watch((device) => {
// 	device.setKeyDisplay('1', {
// 		attentionLevel: AttentionLevel.NEUTRAL,
// 		header: {
// 			long: 'Hello',
// 		},
// 	})
// })
async function doIt() {
	const streamDeck = openStreamDeck()

	const keyIndex = 1

	const fontsize = 20
	const x = 5
	const y = fontsize
	const align = 'left'
	const text = 'TEST'

	const IS = streamDeck.ICON_SIZE

	const bgColor = 'black'
	const borderSize = 3
	const borderColor = 'white'

	const img = sharp({
		create: {
			width: IS,
			height: IS,
			channels: 3,
			background: {
				r: 100,
				g: 0,
				b: 0,
				alpha: 1 / 255,
			},
		},
	}).composite([
		{
			input: Buffer.from(
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${IS} ${IS}" version="1.1">

                <rect x="0" y="0" width="${IS}" height="${IS}"  style="fill: ${borderColor};"  />

                <rect x="${borderSize}" y="${borderSize}" width="${IS - borderSize * 2}" height="${
					IS - borderSize * 2
				}"  rx="10" style="fill: ${bgColor};"  />
                <text
                                    font-family="'sans-serif'"
                                    font-size="${fontsize}px"
                                    x="${x}"
                                    y="${y}"
                                    fill="#fff"
                                    text-anchor="${align}"
                                    >${text}</text>


                            </svg>`
			),
			top: 0,
			left: 0,
		},
	])
	// await img.toFile('test.png')

	const tmpImg = await img.raw().toBuffer()

	await streamDeck.fillKeyBuffer(keyIndex, tmpImg, { format: 'rgba' })

	console.log('WRITING!!!! DONE!!!!!!!!!')
}
doIt().catch(console.error)
