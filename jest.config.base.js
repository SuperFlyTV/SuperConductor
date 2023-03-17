module.exports = {
	roots: ['<rootDir>/src'],
	projects: ['<rootDir>'],
	preset: 'ts-jest',
	moduleFileExtensions: ['js', 'ts'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.json',
			},
		],
	},
	testMatch: ['**/__tests__/**/*.test.(ts|js)'],
	testEnvironment: 'node',
	coverageThreshold: {
		global: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
	coverageDirectory: '<rootDir>/coverage/',
	collectCoverage: false,
	// verbose: true,
}
