/**
 * Utility functions for common API operations
 */

import type { Status, Account, Notification, TimelineParams } from '@/types/mastodon';

/**
 * Timeline utilities
 */
export async function* paginatedTimeline(
  fetcher: (params: TimelineParams) => Promise<Status[]>,
  initialParams: TimelineParams = {}
): AsyncGenerator<Status[], void, unknown> {
  let params = { ...initialParams };
  
  while (true) {
    const statuses = await fetcher(params);
    if (statuses.length === 0) break;
    
    yield statuses;
    
    // Get the last status ID for pagination
    const lastId = statuses[statuses.length - 1].id;
    params = { ...params, max_id: lastId };
  }
}

/**
 * Fetch all pages of a timeline
 */
export async function fetchAllTimelinePages(
  fetcher: (params: TimelineParams) => Promise<Status[]>,
  maxPages = 10,
  params: TimelineParams = {}
): Promise<Status[]> {
  const allStatuses: Status[] = [];
  let page = 0;
  
  for await (const statuses of paginatedTimeline(fetcher, params)) {
    allStatuses.push(...statuses);
    page++;
    if (page >= maxPages) break;
  }
  
  return allStatuses;
}

/**
 * Status utilities
 */
export function isReblog(status: Status): boolean {
  return status.reblog !== null;
}

export function getOriginalStatus(status: Status): Status {
  return status.reblog || status;
}

export function hasMedia(status: Status): boolean {
  const original = getOriginalStatus(status);
  return original.media_attachments.length > 0;
}

export function getStatusUrl(status: Status): string {
  return status.url || status.uri;
}

export function isReply(status: Status): boolean {
  return status.in_reply_to_id !== null;
}

export function isMention(status: Status, accountId: string): boolean {
  return status.mentions.some(mention => mention.id === accountId);
}

/**
 * Account utilities
 */
export function getAccountHandle(account: Account): string {
  return account.acct.includes('@') ? account.acct : `${account.acct}@${new URL(account.url).hostname}`;
}

export function getAccountDisplayName(account: Account): string {
  return account.display_name || account.username;
}

export function isBot(account: Account): boolean {
  return account.bot;
}

export function isLocked(account: Account): boolean {
  return account.locked;
}

/**
 * Notification utilities
 */
export function getNotificationMessage(notification: Notification): string {
  const displayName = getAccountDisplayName(notification.account);
  
  switch (notification.type) {
    case 'follow':
      return `${displayName} followed you`;
    case 'follow_request':
      return `${displayName} requested to follow you`;
    case 'mention':
      return `${displayName} mentioned you`;
    case 'reblog':
      return `${displayName} boosted your post`;
    case 'favourite':
      return `${displayName} favorited your post`;
    case 'poll':
      return 'A poll you voted in has ended';
    case 'status':
      return `${displayName} posted`;
    case 'update':
      return `${displayName} edited a post`;
    case 'admin.sign_up':
      return `${displayName} signed up`;
    case 'admin.report':
      return `${displayName} sent a report`;
    default:
      return 'New notification';
  }
}

export function groupNotificationsByStatus(notifications: Notification[]): Map<string, Notification[]> {
  const grouped = new Map<string, Notification[]>();
  
  notifications.forEach(notification => {
    if (notification.status) {
      const statusId = notification.status.id;
      const existing = grouped.get(statusId) || [];
      existing.push(notification);
      grouped.set(statusId, existing);
    }
  });
  
  return grouped;
}

/**
 * Media utilities
 */
export function getMediaType(attachment: import('@/types/mastodon').MediaAttachment): 'image' | 'video' | 'audio' | 'unknown' {
  switch (attachment.type) {
    case 'image':
    case 'gifv':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    default:
      return 'unknown';
  }
}

export function getOptimizedImageUrl(
  attachment: import('@/types/mastodon').MediaAttachment,
  size: 'small' | 'original' = 'small'
): string {
  if (size === 'small' && attachment.preview_url) {
    return attachment.preview_url;
  }
  return attachment.url;
}

/**
 * Content utilities
 */
export function stripHtml(html: string): string {
  // Simple regex-based approach that works in both SSR and client
  return html.replace(/<[^>]*>/g, '');
}

export function getPlainTextContent(status: Status): string {
  const original = getOriginalStatus(status);
  return stripHtml(original.content);
}

export function truncateText(text: string, maxLength: number, ellipsis = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Visibility utilities
 */
export function isPublic(status: Status): boolean {
  return status.visibility === 'public';
}

export function isUnlisted(status: Status): boolean {
  return status.visibility === 'unlisted';
}

export function isPrivate(status: Status): boolean {
  return status.visibility === 'private';
}

export function isDirect(status: Status): boolean {
  return status.visibility === 'direct';
}

export function getVisibilityIcon(visibility: import('@/types/mastodon').StatusVisibility): string {
  switch (visibility) {
    case 'public':
      return '🌐';
    case 'unlisted':
      return '🔓';
    case 'private':
      return '🔒';
    case 'direct':
      return '✉️';
  }
}

/**
 * Date utilities
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 52) return `${weeks}w`;
  
  const years = Math.floor(weeks / 52);
  return `${years}y`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Emoji utilities
 */
export function replaceEmojis(text: string, emojis: import('@/types/mastodon').CustomEmoji[]): string {
  let result = text;
  
  emojis.forEach(emoji => {
    const regex = new RegExp(`:${emoji.shortcode}:`, 'g');
    result = result.replace(regex, `<img src="${emoji.url}" alt=":${emoji.shortcode}:" class="custom-emoji" />`);
  });
  
  return result;
}

/**
 * Poll utilities
 */
export function isPollExpired(poll: import('@/types/mastodon').Poll): boolean {
  if (!poll.expires_at) return false;
  return new Date(poll.expires_at) < new Date();
}

export function getPollTotalVotes(poll: import('@/types/mastodon').Poll): number {
  return poll.votes_count;
}

export function getPollPercentage(option: import('@/types/mastodon').PollOption, poll: import('@/types/mastodon').Poll): number {
  const total = getPollTotalVotes(poll);
  if (total === 0 || option.votes_count === null) return 0;
  return Math.round((option.votes_count / total) * 100);
}

/**
 * Search utilities
 */
export function parseSearchQuery(query: string): {
  text: string;
  hashtags: string[];
  mentions: string[];
  hasMedia: boolean;
  isLocal: boolean;
} {
  const hashtags: string[] = [];
  const mentions: string[] = [];
  let hasMedia = false;
  let isLocal = false;
  
  // Extract hashtags
  const hashtagRegex = /#(\w+)/g;
  let match;
  while ((match = hashtagRegex.exec(query)) !== null) {
    hashtags.push(match[1]);
  }
  
  // Extract mentions
  const mentionRegex = /@(\w+)(@[\w.]+)?/g;
  while ((match = mentionRegex.exec(query)) !== null) {
    mentions.push(match[0]);
  }
  
  // Check for media filter
  hasMedia = query.includes('has:media') || query.includes('has:image') || query.includes('has:video');
  
  // Check for local filter
  isLocal = query.includes('is:local') || query.includes('scope:local');
  
  // Clean text
  const text = query
    .replace(hashtagRegex, '')
    .replace(mentionRegex, '')
    .replace(/has:(media|image|video)/g, '')
    .replace(/is:local|scope:local/g, '')
    .trim();
  
  return { text, hashtags, mentions, hasMedia, isLocal };
}
