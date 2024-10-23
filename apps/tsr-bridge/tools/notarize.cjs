/* Based on https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/ */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context
	if (electronPlatformName !== 'darwin') {
		return
	}

	if (!process.env.APPLEID || !process.env.APPLEIDPASS || !process.env.APPLEIDTEAM) {
		// eslint-disable-next-line no-console
		console.log('Skipping notarizing, due to missing APPLEID, APPLEIDTEAM or APPLEIDPASS environment variables')
		return
	}

	const appName = context.packager.appInfo.productFilename

	return notarize({
		appBundleId: 'tv.superfly.tsr-bridge',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLEID,
		appleIdPassword: process.env.APPLEIDPASS,
		teamId: process.env.APPLEIDTEAM,
	})
}
