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
		port: 9124,
	},
	resolve: {
		alias: {
			['@']: path.resolve(__dirname, 'src'),
		},
		extensions: ['.tsx', '.ts', '.js'],
		fallback: { url: require.resolve('url/') },
	},
	module: {
		rules: [
			{
				test: /\.(png|jpe?g|gif)$/i,
				use: [{ loader: 'file-loader' }],
			},
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
