/* Based on https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/ */

const { notarize } = require('electron-notarize')

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context
	if (electronPlatformName !== 'darwin') {
		return
	}

	if (!process.env.APPLEID || !process.env.APPLEIDPASS) {
		// eslint-disable-next-line no-console
		console.log('Skipping notarizing, due to missing APPLEID or APPLEIDPASS environment variables')
		return
	}

	const appName = context.packager.appInfo.productFilename

	return await notarize({
		appBundleId: 'tv.superfly.superconductor',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLEID,
		appleIdPassword: process.env.APPLEIDPASS,
	})
}
