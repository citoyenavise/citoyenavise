/**
 * Test setup for auth module
 */

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.BCRYPT_ROUNDS = '10'; // Faster for tests
});

afterAll(() => {
  jest.clearAllTimers();
});
