/**
 * Test setup for feed module
 */

beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  jest.clearAllTimers();
});
