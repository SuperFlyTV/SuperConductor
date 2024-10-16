/* eslint-disable n/no-process-exit, n/no-extraneous-require,@typescript-eslint/no-require-imports */
// @ts-check

import fs from 'fs'
import path from 'path'
import checker from 'license-checker'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const DEBUG = false

function getDirectories(source) {
	return fs
		.readdirSync(source, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name)
}

const sharedPackages = getDirectories(path.resolve('./shared/packages'))
if (sharedPackages.length < 4) throw new Error('expected more shared/packages')

const ROOT_VERSION = require('../package.json').version
const CURRENT_VERSION = require('@shared/api/package.json').version

const allowPackages = [
	`caniuse-lite@1.0.30001465`,
	`truncate-utf8-bytes@1.0.2`,
	`utf8-byte-length@1.0.4`,
	...sharedPackages.map((pkg) => `@shared/${pkg}@${CURRENT_VERSION}`),
	`superconductor-monorepo@${ROOT_VERSION}`,
	`superconductor@${CURRENT_VERSION}`,
	`tsr-bridge@${CURRENT_VERSION}`,
]

checker.init(
	{
		start: path.resolve('.'),
		onlyAllow: 'MIT;BSD;ISC;Apache-2.0;CC0;CC-BY-3.0;CC-BY-4.0;Unlicense;Artistic-2.0;Python-2.0;BlueOak-1.0.0',
		excludePackages: allowPackages.join(';'),
		summary: !DEBUG,
	},
	(err, packages) => {
		if (err) {
			//Handle error
			console.error(err)
			process.exit(1)
		} else {
			if (DEBUG) {
				console.log(packages)
			}
			process.exit(0)
		}
	}
)
