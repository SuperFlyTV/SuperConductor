import { defineConfig } from 'vite'
import reactPlugin from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
	publicDir: 'public',
	base: './', // Ensure the html uses the correct urls for assets
	// This changes the out put dir from dist to build
	// comment this out if that isn't relevant for your project
	build: {
		outDir: 'build',
		chunkSizeWarningLimit: 1 * 1000 * 1000, // Disable warning about large chunks
	},
	server: {
		port: 9125,
		// proxy: {
		// 	'/int': `http://${upstreamUrl}`,
		// 	'/docs': `http://${upstreamUrl}`,
		// 	'/socket.io': {
		// 		target: `ws://${upstreamUrl}`,
		// 		ws: true,
		// 	},
		// },
	},
	plugins: [
		reactPlugin(),
		// envCompatible.default({
		// 	prefix: 'DEV',
		// }),
		// legacyPlugin({
		// 	targets: ['defaults', 'not IE 11', 'safari >= 12.1'],
		// }),
	],
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
				quietDeps: true,
			},
		},
	},
})
