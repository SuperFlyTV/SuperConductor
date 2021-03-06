const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
	mode: 'development',
	entry: './src/renderer.tsx',
	target: 'web',
	devtool: 'source-map',
	devServer: {
		static: path.join(__dirname, 'dist/renderer.js'),
		compress: true,
		port: 9125,
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts(x?)$/,
				include: /src/,
				use: [{ loader: 'ts-loader' }],
			},
			{
				test: /\.s[ac]ss$/i,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
	output: {
		path: __dirname + '/dist',
		filename: 'renderer.js',
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/index.html',
		}),
	],
}
