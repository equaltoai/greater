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

// =============================================================================
// GraphQL Adapter Mocks (Phase 4)
// =============================================================================

/**
 * Mock GraphQL subscription that can be controlled in tests
 */
export const createMockSubscription = () => {
  const handlers: {
    next?: (value: any) => void;
    error?: (error: any) => void;
    complete?: () => void;
  } = {};

  return {
    subscribe: vi.fn((observer: any) => {
      handlers.next = observer.next;
      handlers.error = observer.error;
      handlers.complete = observer.complete;

      return {
        unsubscribe: vi.fn(),
      };
    }),
    // Helper methods for testing
    emit: (data: any) => handlers.next?.(data),
    emitError: (error: any) => handlers.error?.(error),
    emitComplete: () => handlers.complete?.(),
  };
};

/**
 * Mock GraphQL adapter with common methods
 */
export const createMockAdapter = () => {
  const timelineSubscription = createMockSubscription();
  const notificationSubscription = createMockSubscription();

  return {
    // Timeline methods
    fetchHomeTimeline: vi.fn(() =>
      Promise.resolve({
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      })
    ),
    fetchPublicTimeline: vi.fn(() =>
      Promise.resolve({
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      })
    ),
    fetchListTimeline: vi.fn(() =>
      Promise.resolve({
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      })
    ),

    // Notification methods
    fetchNotifications: vi.fn(() =>
      Promise.resolve({
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      })
    ),
    dismissNotification: vi.fn(() => Promise.resolve({ success: true })),
    clearNotifications: vi.fn(() => Promise.resolve({ success: true })),

    // Interaction methods
    likeObject: vi.fn((id: string) =>
      Promise.resolve({
        id,
        userInteractions: { liked: true },
        likes: { totalCount: 1 },
        likesCount: 1,
      })
    ),
    unlikeObject: vi.fn((id: string) =>
      Promise.resolve({
        id,
        userInteractions: { liked: false },
        likes: { totalCount: 0 },
        likesCount: 0,
      })
    ),
    shareObject: vi.fn((id: string) =>
      Promise.resolve({
        id,
        userInteractions: { shared: true },
        shares: { totalCount: 1 },
        sharesCount: 1,
      })
    ),
    unshareObject: vi.fn((id: string) =>
      Promise.resolve({
        id,
        userInteractions: { shared: false },
        shares: { totalCount: 0 },
        sharesCount: 0,
      })
    ),
    bookmarkObject: vi.fn((id: string) =>
      Promise.resolve({
        id,
        userInteractions: { bookmarked: true },
      })
    ),
    unbookmarkObject: vi.fn((id: string) =>
      Promise.resolve({
        id,
        userInteractions: { bookmarked: false },
      })
    ),
    deleteObject: vi.fn(() => Promise.resolve({ success: true })),

    // Compose methods
    createNote: vi.fn((variables: any) =>
      Promise.resolve({
        object: {
          id: 'test-status-id',
          content: variables.content,
          published: new Date().toISOString(),
          attributedTo: {
            id: 'test-user-id',
            preferredUsername: 'testuser',
            name: 'Test User',
          },
          visibility: variables.visibility,
          sensitive: variables.sensitive || false,
          summary: variables.summary || '',
          likes: { totalCount: 0 },
          shares: { totalCount: 0 },
          replies: { totalCount: 0 },
          userInteractions: {
            liked: false,
            shared: false,
            bookmarked: false,
          },
        },
      })
    ),

    // Media upload
    uploadMedia: vi.fn((input: any) =>
      Promise.resolve({
        uploadId: 'test-upload-id',
        media: {
          id: 'test-media-id',
          type: 'IMAGE',
          url: 'https://example.com/media/test.jpg',
          previewUrl: 'https://example.com/media/test-preview.jpg',
          description: input.description || '',
          sensitive: input.sensitive || false,
          spoilerText: input.spoilerText || null,
          mediaCategory: 'IMAGE',
          blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
          width: 1920,
          height: 1080,
          duration: null,
          size: 1024000,
          mimeType: 'image/jpeg',
          createdAt: new Date().toISOString(),
          uploadedBy: {
            id: 'test-user-id',
            username: 'testuser',
          },
        },
        warnings: [],
      })
    ),

    // Subscription methods
    subscribeToTimelineUpdates: vi.fn(() => timelineSubscription),
    subscribeToNotificationStream: vi.fn(() => notificationSubscription),

    // Lifecycle methods
    updateToken: vi.fn(),
    close: vi.fn(),

    // Expose subscriptions for testing
    _timelineSubscription: timelineSubscription,
    _notificationSubscription: notificationSubscription,
  };
};

/**
 * Global mock adapter instance
 * Tests can access and control this via `mockAdapter`
 */
export const mockAdapter = createMockAdapter();

/**
 * Mock the GraphQL client module
 */
vi.mock('@/lib/api/graphql-client', () => ({
  getGraphQLAdapter: vi.fn(() => Promise.resolve(mockAdapter)),
  updateGraphQLToken: vi.fn(() => Promise.resolve()),
  closeGraphQLAdapter: vi.fn(() => Promise.resolve()),
  isGraphQLAdapterInitialized: vi.fn(() => true),
  getCurrentAdapter: vi.fn(() => mockAdapter),
  getCurrentToken: vi.fn(() => Promise.resolve('mock-token')),
  withGraphQLRetry: vi.fn(async (_operationName, operation) => operation()),
  registerGraphQLCleanup: vi.fn(() => () => {}),
}));
