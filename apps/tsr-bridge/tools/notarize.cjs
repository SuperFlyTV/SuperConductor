/* Based on https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/ */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { notarize } = require('@electron/notarize')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context
	if (electronPlatformName !== 'darwin') {
		return
	}

	// If Apple credentials are not provided, skip notarize (CI/PR builds)
	if (!process.env.APPLEID || !process.env.APPLEIDPASS || !process.env.APPLEIDTEAM) {
		// eslint-disable-next-line no-console
		console.log('Skipping notarizing, due to missing APPLEID, APPLEIDTEAM or APPLEIDPASS environment variables')
		return
	}

	const appName = context.packager && context.packager.appInfo && context.packager.appInfo.productFilename
	const appPath = `${appOutDir}/${appName}.app`

	// Defensive logging to help diagnose CI failures where appPath may be unexpected
	// eslint-disable-next-line no-console
	console.log('Notarize: electronPlatformName=', electronPlatformName)
	// eslint-disable-next-line no-console
	console.log('Notarize: appOutDir=', appOutDir)
	// eslint-disable-next-line no-console
	console.log('Notarize: appName=', appName)
	// eslint-disable-next-line no-console
	console.log('Notarize: computed appPath=', appPath)

	// Verify path exists before calling notarize
	try {
		if (!fs.existsSync(appPath)) {
			// eslint-disable-next-line no-console
			console.log(`Notarize: appPath does not exist, skipping notarize: ${appPath}`)
			return
		}

		return await notarize({
			appBundleId: 'tv.superfly.tsr-bridge',
			appPath,
			appleId: process.env.APPLEID,
			appleIdPassword: process.env.APPLEIDPASS,
			teamId: process.env.APPLEIDTEAM,
		})
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Notarize: error during notarize step', err && err.stack ? err.stack : err)
		// Do not throw — avoid failing the whole build on notarize errors
		return
	}
}
