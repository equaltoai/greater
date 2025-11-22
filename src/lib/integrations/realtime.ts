import {
  createTimelineIntegration,
  createNotificationIntegration,
  type TimelineIntegrationConfig,
  type NotificationIntegrationConfig,
  type TransportConfig,
} from '$lib/gc';

export type TimelineView =
  | 'home'
  | 'local'
  | 'federated'
  | { type: 'list'; listId: string }
  | { type: 'profile'; username: string };

const TIMELINE_TYPE_MAP: Record<
  'home' | 'local' | 'federated',
  NonNullable<TimelineIntegrationConfig['timeline']>['type']
> = {
  home: 'home',
  local: 'local',
  federated: 'public',
};

export type TimelineIntegrationInstance = ReturnType<typeof createTimelineIntegration>;
export type NotificationIntegrationInstance = ReturnType<typeof createNotificationIntegration>;

export const notificationIntegrationContextKey = Symbol('notificationIntegration');

export interface TimelineIntegrationOptions {
  instance: string;
  accessToken?: string | null;
  view: TimelineView;
  autoConnect?: boolean;
  transport?: TransportConfig;
  timeline?: Partial<TimelineIntegrationConfig['timeline']>;
}

export interface NotificationIntegrationOptions {
  instance: string;
  accessToken?: string | null;
  autoConnect?: boolean;
  transport?: TransportConfig;
  notification?: Partial<NotificationIntegrationConfig['notification']>;
}

export function buildTimelineIntegration(opts: TimelineIntegrationOptions): TimelineIntegrationInstance {
  const transport =
    opts.transport ??
    {
      baseUrl: opts.instance,
      protocol: 'websocket',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
    };

  let timelineConfig: any;

  if (typeof opts.view === 'string') {
    timelineConfig = {
      type: TIMELINE_TYPE_MAP[opts.view],
      maxItems: 500,
      preloadCount: 20,
      enableRealtime: true,
      ...opts.timeline,
    };
  } else if (opts.view.type === 'list') {
    // Cast to any because listId is missing in the library type definition but required at runtime
    timelineConfig = {
      type: 'list',
      listId: opts.view.listId,
      maxItems: 500,
      preloadCount: 20,
      enableRealtime: true,
      ...opts.timeline,
    };
  } else {
     // Cast to any because username is missing in the library type definition but required at runtime
     timelineConfig = {
          type: 'profile',
          username: opts.view.username,
          maxItems: 500,
          preloadCount: 20,
          enableRealtime: true,
          ...opts.timeline,
        };
  }

  return createTimelineIntegration({
    baseUrl: opts.instance,
    accessToken: opts.accessToken ?? undefined,
    autoConnect: opts.autoConnect ?? false,
    transport,
    timeline: timelineConfig,
  });
}

export function buildNotificationIntegration(
  opts: NotificationIntegrationOptions
): NotificationIntegrationInstance {
  const transport =
    opts.transport ??
    {
      baseUrl: opts.instance,
      protocol: 'websocket',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
    };

  return createNotificationIntegration({
    baseUrl: opts.instance,
    accessToken: opts.accessToken ?? undefined,
    autoConnect: opts.autoConnect ?? false,
    transport,
    notification: {
      maxItems: 500,
      preloadCount: 20,
      enableRealtime: true,
      groupSimilar: true,
      ...opts.notification,
    },
  });
}
