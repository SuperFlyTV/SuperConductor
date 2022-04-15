import path from 'path'
import os from 'os'

export function baseFolder(): string {
	const homeDirPath = os.homedir()
	if (os.type() === 'Linux') {
		return path.join(homeDirPath, '.superconductor')
	}
	return path.join(homeDirPath, 'Documents', 'SuperConductor')
}
