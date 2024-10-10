const { tsExtends, commonRules, tsRules, tsParser } = require('./tmp-eslint/fragments.cjs')

module.exports = {
	extends: './tmp-eslint/main.cjs',
	env: {
		node: true,
	},
	ignorePatterns: ['**/dist/**/*', '**/__tests__/**/*'],
	rules: {
		'no-console': 'warn',
		'n/no-unpublished-import': [
			'error',
			{
				allowModules: ['electron', 'typed-emitter', 'electron-devtools-installer'],
			},
		],
		'n/no-unpublished-require': [
			'error',
			{
				allowModules: ['html-webpack-plugin', 'electron-notarize'],
			},
		],
		'n/no-extraneous-import': [
			'error',
			{
				allowModules: [
					'atem-connection',
					'casparcg-connection',
					'hyperdeck-connection',
					'obs-websocket-js',
					'timeline-state-resolver-types',
					'triple-beam',
				],
			},
		],
		'@typescript-eslint/no-namespace': 'off',
		'@typescript-eslint/no-redundant-type-constituents': 'off',
		'@typescript-eslint/no-duplicate-type-constituents': 'off',
	},
	settings: {
		jest: {
			version: 'latest',
		},
		react: {
			version: 'detect',
		},
	},
	overrides: [
		// Note: these replace the values defined above, so make sure to extend them if they are needed
		{
			files: ['*.tsx'],
			extends: [...tsExtends, 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
			parserOptions: {
				...tsParser.parserOptions,
				ecmaFeatures: {
					jsx: true, // Allows for the parsing of JSX
				},
			},
			rules: {
				...commonRules,
				...tsRules,
				// "n/no-extraneous-import": "off", // because there are a lot of them as dev-dependencies
				'n/no-missing-import': 'off', // erroring on every single import
				'react/prop-types': 'off', // we don't use this
				// "@typescript-eslint/no-empty-interface": "off", // many prop/state types are {}
				'@typescript-eslint/promise-function-async': 'off', // event handlers can't be async
			},
		},
	],
}
