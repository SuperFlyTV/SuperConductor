// eslint-disable-next-line n/no-unpublished-require
const base = require('../../jest.config.base')
const packageJson = require('./package')

module.exports = {
	...base,
	displayName: packageJson.name,
}
