const path = require('path')
const nexe = require('nexe')
const os = require('os')
// eslint-disable-next-line node/no-unpublished-require
const fs = require('fs-extra')
// eslint-disable-next-line node/no-unpublished-require
const replace = require('replace-in-file')

const basePath = path.resolve(__dirname, '..')
const outputDirectory = path.join(basePath, './dist/nexe')
const sharpReleaseDirSrc = path.resolve('./node_modules/sharp/build/Release')
const sharpVendorDirSrc = path.resolve('./node_modules/sharp/vendor')
const peripheralsPath = path.resolve(basePath, '../../shared/packages/peripherals')
const peripheralsSrc = path.join(peripheralsPath, './dist')
const peripheralsDest = path.join(basePath, './dist/peripherals')

;(async () => {
	/**
	 * All these steps relating to copying @shared/peripherals (and its node_modules)
	 * into tsr-bridge are to solve a purely aesthetic problem of build output
	 * folder structure.
	 *
	 * This process is how we end up with a single node_modules folder as a sibling
	 * of the tsr-bridge binary. Without this, the tsr-bridge binary has to be
	 * two folders deep (relative to node_modules) in order for the paths to resolve
	 * correctly.
	 *
	 * In other words, it lets us go from this:
	 *
	 * output/
	 * ├─ node_modules/
	 * │  ├─ sharp/
	 * ├─ any-name/
	 *    ├─ any-name/
	 *       ├─ tsr-bridge.exe
	 *
	 * ... to this:
	 *
	 * output/
	 * ├─ node_modules/
	 * │  ├─ sharp/
	 * tsr-bridge.exe
	 */

	console.log('Preparing for build...')
	// Copy the @shared/peripherals package into the tsr-bridge src folder
	{
		await fs.copy(peripheralsSrc, peripheralsDest)
	}

	// Edit tsr-bridge to load this local copy of the peripherals package
	{
		await replace({
			files: path.join(basePath, 'dist/index.js'),
			from: '@shared/peripherals',
			to: './peripherals',
		})
	}

	// Copy @shared/peripherals' node_modules into tsr-bridge's node_modules
	{
		const peripheralsNodeModules = path.join(peripheralsPath, 'node_modules')
		const tsrBridgeNodeModules = path.join(basePath, 'node_modules')
		await fs.copy(peripheralsNodeModules, tsrBridgeNodeModules)
	}
	console.log('Done preparing!')

	// Build the tsr-bridge binary
	{
		const nexeOutputFolder = path.join(outputDirectory /*, 'apps/tsr-bridge'*/)
		const nexeOutputFile = path.join(nexeOutputFolder, 'tsr-bridge')
		await fs.mkdirp(nexeOutputFolder)
		await nexe.compile({
			input: path.join(basePath, './dist/index.js'),
			output: nexeOutputFile,
			targets: getNexeTargets(),
			resources: ['../../node_modules/timeline-state-resolver/dist/*.js'],
		})
	}

	// Copy native modules to the build output dir
	console.log('Copying native dependencies to build folder...')
	{
		// Copy sharp's *.node module.
		// On Windows, this also copies all the necessary *.dll files that need to be placed alongside sharp.
		const sharpReleaseDirDest = path.join(outputDirectory, 'node_modules/sharp/build/Release')
		await fs.copy(sharpReleaseDirSrc, sharpReleaseDirDest)
	}
	if (os.type() !== 'Windows_NT') {
		// On non-Windows OSes, sharp keeps *.dylib and *.so files in the vendor folder, so we copy that too.
		const sharpVendorDirDest = path.join(outputDirectory, 'node_modules/sharp/vendor')
		await fs.copy(sharpVendorDirSrc, sharpVendorDirDest)
	}
	console.log('Done copying native dependencies!')

	console.log('Cleaning up...')
	// Delete the copied @shared/peripherals folder
	{
		fs.remove(peripheralsDest)
	}

	// Undo the edit to tsr-bridge
	{
		await replace({
			files: path.join(basePath, 'dist/index.js'),
			from: './peripherals',
			to: '@shared/peripherals',
		})
	}
	console.log('Done cleaning up!')
})().catch(console.error)

function getNexeTargets() {
	const nodeVersion = '14.15.3' // The newest version of Node.js 14 that nexe provides prebuilt binaries for
	switch (os.type()) {
		case 'Windows_NT':
			return [`windows-x64-${nodeVersion}`]
		case 'Darwin':
			return [`mac-x64-${nodeVersion}`]
		case 'Linux':
			return [`linux-x64-${nodeVersion}`]
		default:
			throw new Error(`Unknown OS type "${os.type()}"`)
	}
}
