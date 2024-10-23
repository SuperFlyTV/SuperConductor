/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	roots: ['<rootDir>/src'],
	projects: ['<rootDir>'],
	preset: 'ts-jest',
	moduleFileExtensions: ['js', 'ts'],
	extensionsToTreatAsEsm: ['.ts'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				useESM: true,
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
