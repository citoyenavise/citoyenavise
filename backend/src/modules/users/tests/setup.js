/**
 * Test setup for users module
 */

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  jest.clearAllTimers();
});
