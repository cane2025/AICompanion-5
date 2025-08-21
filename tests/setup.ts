import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock console methods to avoid noise during tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock DOM APIs
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3001',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Mock fetch for API calls
global.fetch = vi.fn();
