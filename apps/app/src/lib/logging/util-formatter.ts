// Adapted from https://stackoverflow.com/a/56842780
import util from 'util'
import { SPLAT } from 'triple-beam'
import { deepClone, stringifyError } from '@shared/lib'

export function utilFormatter() {
	return {
		transform: (info: any) => {
			const args = info[SPLAT]
			if (args) {
				info.message = util.format(info.message, ...args)

				return info
			} else {
				// Handle special case, when the single argument is an error:
				if (info instanceof Error) {
					const formattedInfo: any = deepClone(info)
					formattedInfo.message = (formattedInfo.message ?? '') + stringifyError(info)

					return formattedInfo
				} else {
					return info
				}
			}
		},
	}
}
