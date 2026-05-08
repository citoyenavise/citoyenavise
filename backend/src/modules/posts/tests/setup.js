/**
 * Test setup for posts module
 */

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  jest.clearAllTimers();
});
