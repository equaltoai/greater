import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTimelineIntegration, buildNotificationIntegration } from '$lib/integrations/realtime';
import * as gc from '$lib/gc';

// Mock the GC library
vi.mock('$lib/gc', () => ({
  createTimelineIntegration: vi.fn((config) => ({
    config,
    connect: vi.fn(),
    disconnect: vi.fn(),
    destroy: vi.fn(),
  })),
  createNotificationIntegration: vi.fn((config) => ({
    config,
    connect: vi.fn(),
    disconnect: vi.fn(),
    destroy: vi.fn(),
  })),
}));

describe('Realtime Integrations', () => {
  const instance = 'https://example.com';
  const accessToken = 'token-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildTimelineIntegration', () => {
    it('should configure home timeline correctly', () => {
      buildTimelineIntegration({
        instance,
        accessToken,
        view: 'home',
      });

      expect(gc.createTimelineIntegration).toHaveBeenCalledWith(expect.objectContaining({
        baseUrl: instance,
        accessToken,
        timeline: expect.objectContaining({
          type: 'home',
          enableRealtime: true,
        }),
      }));
    });

    it('should configure local timeline correctly', () => {
      buildTimelineIntegration({
        instance,
        accessToken,
        view: 'local',
      });

      expect(gc.createTimelineIntegration).toHaveBeenCalledWith(expect.objectContaining({
        timeline: expect.objectContaining({
          type: 'local',
        }),
      }));
    });

    it('should configure list timeline correctly', () => {
      const listId = 'list-123';
      buildTimelineIntegration({
        instance,
        accessToken,
        view: { type: 'list', listId },
      });

      expect(gc.createTimelineIntegration).toHaveBeenCalledWith(expect.objectContaining({
        timeline: expect.objectContaining({
          type: 'list',
          listId,
        }),
      }));
    });

    it('should configure profile timeline correctly', () => {
      const username = 'user123';
      buildTimelineIntegration({
        instance,
        accessToken,
        view: { type: 'profile', username },
      });

      expect(gc.createTimelineIntegration).toHaveBeenCalledWith(expect.objectContaining({
        timeline: expect.objectContaining({
          type: 'profile',
          username,
        }),
      }));
    });

    it('should apply default transport settings', () => {
      buildTimelineIntegration({
        instance,
        view: 'home',
      });

      expect(gc.createTimelineIntegration).toHaveBeenCalledWith(expect.objectContaining({
        transport: expect.objectContaining({
          baseUrl: instance,
          protocol: 'websocket',
        }),
      }));
    });
  });

  describe('buildNotificationIntegration', () => {
    it('should configure notifications correctly', () => {
      buildNotificationIntegration({
        instance,
        accessToken,
      });

      expect(gc.createNotificationIntegration).toHaveBeenCalledWith(expect.objectContaining({
        baseUrl: instance,
        accessToken,
        notification: expect.objectContaining({
          enableRealtime: true,
          groupSimilar: true,
        }),
      }));
    });
  });
});
