// This script is executed after the version is updated, before the new tag is set.
const fs = require('fs').promises
const { exec } = require('child_process')

function cmd(command) {
	return new Promise((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error)
			} else {
				resolve({ stderr, stdout })
			}
		})
	})
}

; (async () => {
	const lernaPackage = require('../lerna.json')
	const currentVersion = lernaPackage.version

	console.log(`Updating links in README to ${currentVersion}...`)

	const readmeTextOrg = await fs.readFile('README.md', 'utf8')
	let readmeText = readmeTextOrg

	// Replace version "x.y.z":
	readmeText = readmeText.replace(/\d{1,2}\.\d{1,3}\.\d{1,3}/g, currentVersion)

	if (readmeTextOrg !== readmeText) {
		console.log('Saving...')
		fs.writeFile('README.md', readmeText)
		// console.log('and committing...')
		cmd('git add README.md')
		// cmd(`git commit -m "Update README to ${currentVersion}"`)
	} else {
		console.log('no change')
	}
})().catch(console.error)
