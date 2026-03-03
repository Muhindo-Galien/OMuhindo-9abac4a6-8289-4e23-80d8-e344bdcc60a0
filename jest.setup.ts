// Jest setup file for global test configuration
import 'reflect-metadata';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  // Uncomment to silence logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}; 