/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function exists(p) {
	try {
		return fs.existsSync(p)
	} catch {
		return false
	}
}

const cwd = process.cwd()
const distDir = path.join(cwd, 'dist')
const buildResources = path.join(cwd, 'resources')
const electronOutput = path.join(cwd, 'electron-output')

console.log('prep-build-binary: cwd=', cwd)
console.log('prep-build-binary: checking paths:')
console.log('  - dist exists:', exists(distDir), distDir)
console.log('  - resources exists:', exists(buildResources), buildResources)
console.log('  - electron-output exists:', exists(electronOutput), electronOutput)

if (!exists(distDir)) {
	console.warn('prep-build-binary: WARNING: dist/ directory missing. Run `yarn workspace tsr-bridge build` first.')
}

// Print a short listing to help CI debug
function list(dir) {
	if (!exists(dir)) return
	console.log('\nListing ' + dir)
	try {
		const items = fs.readdirSync(dir)
		for (const it of items.slice(0, 200)) {
			const p = path.join(dir, it)
			const st = fs.statSync(p)
			console.log(`${st.isDirectory() ? 'd' : '-'} ${st.size.toString().padStart(8)} ${it}`)
		}
	} catch (err) {
		console.error('Error listing', dir, err && err.stack ? err.stack : err)
	}
}

list(cwd)
list(distDir)
list(buildResources)

// Forward args to electron-builder
const args = process.argv.slice(2)
console.log('\nRunning electron-builder with args:', args.join(' '))

// Try running electron-builder via available runner: prefer npx, fall back to yarn
// Run electron-builder via a shell fallback chain so missing binaries don't
// cause spawnSync to throw ENOENT on Windows/CI. Try `npx`, then `yarn exec`, then
// the local `node_modules/.bin/electron-builder`.
const cmdParts = []
const quotedArgs = args.map((a) => {
	if (/\s/.test(a)) return '"' + a.replace(/"/g, '\\"') + '"'
	return a
})
const argString = quotedArgs.join(' ')
cmdParts.push(`npx electron-builder ${argString}`)
cmdParts.push(`yarn exec electron-builder ${argString}`)
cmdParts.push(`node ./node_modules/.bin/electron-builder ${argString}`)
const shellCmd = cmdParts.join(' || ')

const shellRes = spawnSync(shellCmd, { stdio: 'inherit', shell: true })
if (shellRes && shellRes.error) {
	console.error('prep-build-binary: spawn error', shellRes.error)
	// eslint-disable-next-line n/no-process-exit
	process.exit(1)
}
if (typeof shellRes.status === 'number' && shellRes.status !== 0) {
	console.error('prep-build-binary: electron-builder exited with code', shellRes.status)
	// eslint-disable-next-line n/no-process-exit
	process.exit(shellRes.status)
}
// eslint-disable-next-line n/no-process-exit
process.exit(0)
