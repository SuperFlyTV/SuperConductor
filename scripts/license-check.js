/* eslint-disable no-process-exit, node/no-unpublished-require, node/no-extraneous-require */
'use strict'
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')

function getDirectories(source) {
	return fs
		.readdirSync(source, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name)
}

const sharedPackages = getDirectories(path.resolve('./shared/packages'))
if (sharedPackages.length < 4) throw new Error('expected more shared/packages')

const CURRENT_VERSION = require('@shared/api/package.json').version

const allowPackages = [
	`buffers@0.1.1`,
	`caniuse-lite@1.0.30001465`,
	`cycle@1.0.3`,
	`truncate-utf8-bytes@1.0.2`,
	`utf8-byte-length@1.0.4`,
	...sharedPackages.map((pkg) => `@shared/${pkg}@${CURRENT_VERSION}`),
	`superconductor@${CURRENT_VERSION}`,
	`tsr-bridge@${CURRENT_VERSION}`,
]

const cmd = ['yarn', 'sofie-licensecheck', '--allowPackages', `"${allowPackages.join(';')}"`]

const res = shell.exec(cmd.join(' '))
process.exit(res.code)
