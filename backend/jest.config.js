module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  clearMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/utils/**/*.js',
    '!src/config/**',
  ],
  coverageReporters: ['text', 'lcov'],
  verbose: true,
};
