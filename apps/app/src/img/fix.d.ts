// This is here just to fix png importing with Webpack

declare module '*.png' {
	const value: any
	export default value
}
