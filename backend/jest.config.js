export default {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!src/swagger/**'
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'json', 'html', 'lcov'],
  verbose: true,
  // Force la sortie de Jest pour éviter le hang post-tests
  // (handles externes : timers express-rate-limit, sockets supertest).
  // Réf. SYNTHESE_OFFICIELLE.md §14 #20.
  forceExit: true,

  // Timeout par test — empêche un test qui hang de bloquer toute la CI (bug #20 bis)
  testTimeout: 30000,

  // Exclusions : Playwright e2e a son propre runner, ne pas l'inclure ici
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/e2e\\.test\\.js$',
  ],
};
