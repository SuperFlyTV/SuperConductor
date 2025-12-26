
/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function exists(p) {
    try {
        return fs.existsSync(p)
    } catch (e) {
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

// Use npx so we run the local binary in CI/local
const cmd = 'npx'
const cmdArgs = ['electron-builder', ...args]
const res = spawnSync(cmd, cmdArgs, { stdio: 'inherit' })
if (res.error) {
    console.error('prep-build-binary: spawn error', res.error)
    throw res.error
}
if (res.status && res.status !== 0) {
    throw new Error('electron-builder exited with code ' + res.status)
}
