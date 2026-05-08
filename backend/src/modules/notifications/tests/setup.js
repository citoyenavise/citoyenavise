/**
 * Test setup for notifications module
 */

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  jest.clearAllTimers();
});
