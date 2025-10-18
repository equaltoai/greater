import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch for tests
global.fetch = vi.fn();

// Setup test environment variables
process.env.PUBLIC_APP_URL = 'http://localhost:4321';
process.env.PUBLIC_DEFAULT_INSTANCE = 'mastodon.social';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in tests:');
  console.error(reason);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  } else {
    console.error('Reason (stringified):', JSON.stringify(reason, null, 2));
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in tests:');
  console.error(error);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
});

// Provide minimal EventSource implementation for environments without it
if (typeof globalThis.EventSource === 'undefined') {
  class TestEventSource {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
    close() {
      // no-op
    }
  }
  (globalThis as any).EventSource = TestEventSource;
}
