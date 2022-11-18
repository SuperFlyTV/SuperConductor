// Adapted from https://stackoverflow.com/a/56842780
import util from 'util'
import { SPLAT } from 'triple-beam'

const transform = (entry: any): any => {
	const args = entry[SPLAT]
	if (args) {
		entry.message = util.format(entry.message, ...args)
	}
	return entry
}

export const utilFormatter = (): { transform: (entry: any) => any } => {
	return { transform }
}
