/* eslint-disable @typescript-eslint/no-require-imports */
const base = require('../../jest.config.base.cjs')
const packageJson = require('./package')

module.exports = {
	...base,
	displayName: packageJson.name,
}
