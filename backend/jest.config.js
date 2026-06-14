/** Unit test config (specs colocated under src). */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts', '!main.ts', '!**/*.module.ts'],
  coverageDirectory: '../coverage',
  // Gate the pure, unit-tested logic. e2e (test/) exercises the rest end-to-end.
  coverageThreshold: {
    'src/modules/referrers/matching.service.ts': { lines: 90, functions: 100 },
    'src/common/utils/pagination.ts': { lines: 100 },
    'src/contracts/common.schema.ts': { lines: 70 },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@contracts/(.*)$': '<rootDir>/contracts/$1',
  },
};
