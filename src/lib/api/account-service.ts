/**
 * Account resolution and caching service
 * Handles different account identifier formats and resolves them to Mastodon account objects
 * Migrated to GraphQL
 */

import type {
  Account,
  AttachmentType,
  MediaAttachment,
  Status,
  StatusVisibility,
} from '@/types/mastodon';
import { getGraphQLAdapter } from './graphql-client';

type GraphQLCountValue = { totalCount?: number | null } | number | null;

export type GraphQLActor = {
  id: string;
  preferredUsername?: string | null;
  username?: string | null;
  domain?: string | null;
  acct?: string | null;
  webfinger?: string | null;
  name?: string | null;
  displayName?: string | null;
  manuallyApprovesFollowers?: boolean | null;
  type?: string | null;
  discoverable?: boolean | null;
  published?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  summary?: string | null;
  url?: string | null;
  avatar?: string | null;
  header?: string | null;
  icon?: { url?: string | null } | null;
  image?: { url?: string | null } | null;
  followers?: GraphQLCountValue | null;
  following?: GraphQLCountValue | null;
  outbox?: GraphQLCountValue | null;
  statusesCount?: number | null;
  locked?: boolean | null;
  bot?: boolean | null;
  trustScore?: number | null;
  attachment?: Array<{ type?: string | null; name: string; value: string }> | null;
  fields?: Array<{ name?: string | null; value?: string | null; verifiedAt?: string | null }> | null;
};

type GraphQLStatusAttachment = {
  id: string;
  type?: string | null;
  url: string;
  preview?: string | null;
  description?: string | null;
  blurhash?: string | null;
  remoteUrl?: string | null;
};

type GraphQLStatusNode = {
  id: string;
  object?: GraphQLStatusNode | null;
  published?: string | null;
  createdAt?: string | null;
  url?: string | null;
  attributedTo?: (GraphQLActor | { id: string }) | null;
  actor?: (GraphQLActor | { id: string }) | null;
  content?: string | null;
  visibility?: string | null;
  sensitive?: boolean | null;
  summary?: string | null;
  spoilerText?: string | null;
  attachments?: GraphQLStatusAttachment[] | null;
  shares?: GraphQLCountValue | null;
  sharesCount?: number | null;
  likes?: GraphQLCountValue | null;
  likesCount?: number | null;
  replies?: GraphQLCountValue | null;
  repliesCount?: number | null;
  userInteractions?: {
    shared?: boolean | null;
    liked?: boolean | null;
    bookmarked?: boolean | null;
  } | null;
  shareOf?: GraphQLStatusNode | null;
  inReplyTo?: { id?: string | null } | null;
  language?: string | null;
  updated?: string | null;
};

type GraphQLTimelineEdge = {
  node: GraphQLStatusNode | null;
};

type GraphQLTimelineResponse = {
  edges?: Array<GraphQLTimelineEdge | null> | null;
};

/**
 * Map GraphQL actor to Mastodon Account format
 */
export function mapGraphQLActorToAccount(actor: GraphQLActor): Account {
  const attachmentFields = (actor.attachment ?? []).filter(
    (attachment) => attachment.type === 'PropertyValue'
  );

  const normalizedFields =
    Array.isArray(actor.fields) && actor.fields.length > 0
      ? actor.fields.map((field) => ({
          name: field.name ?? '',
          value: field.value ?? '',
          verified_at: field.verifiedAt ?? null,
        }))
      : attachmentFields.map((attachment) => ({
          name: attachment.name ?? '',
          value: attachment.value ?? '',
          verified_at: null,
        }));

  const avatarUrl = actor.icon?.url ?? actor.avatar ?? '';
  const headerUrl = actor.image?.url ?? actor.header ?? '';

  const acctHandle =
    actor.webfinger ??
    actor.acct ??
    (actor.domain && actor.username ? `${actor.username}@${actor.domain}` : undefined) ??
    actor.preferredUsername ??
    actor.username ??
    actor.id;

  const statusesCount =
    typeof actor.statusesCount === 'number'
      ? actor.statusesCount
      : resolveCount(actor.outbox);

  return {
    id: actor.id,
    username: actor.preferredUsername ?? actor.username ?? actor.id,
    acct: acctHandle,
    display_name: actor.name ?? actor.displayName ?? actor.preferredUsername ?? actor.username ?? '',
    locked: actor.manuallyApprovesFollowers ?? actor.locked ?? false,
    bot: actor.type === 'Service' || actor.bot === true,
    discoverable: actor.discoverable ?? true,
    group: actor.type === 'Group',
    created_at: actor.published ?? actor.createdAt ?? new Date().toISOString(),
    note: actor.summary ?? '',
    url: actor.url ?? actor.id,
    avatar: avatarUrl,
    avatar_static: avatarUrl,
    header: headerUrl,
    header_static: headerUrl,
    followers_count: resolveCount(actor.followers),
    following_count: resolveCount(actor.following),
    statuses_count: statusesCount,
    last_status_at: null,
    emojis: [],
    fields: normalizedFields,
  };
}

export class AccountService {
  private accountCache = new Map<string, Account>();
  
  /**
   * Resolve any account identifier to a Mastodon account object
   * Supports: numeric IDs, usernames, webfinger addresses, and ActivityPub URLs
   */
  async resolveAccount(identifier: string): Promise<Account> {
    if (!identifier) {
      throw new Error('Account identifier is required');
    }

    // Check cache first
    const cachedAccount = this.accountCache.get(identifier);
    if (cachedAccount) {
      return cachedAccount;
    }

    let account: Account;
    
    // Handle different identifier formats
    if (/^\d+$/.test(identifier)) {
      // Already a numeric ID
      account = await this.getAccountById(identifier);
    } else if (identifier.includes('@')) {
      // Webfinger format: user@domain
      account = await this.lookupAccount(identifier);
    } else if (identifier.startsWith('http')) {
      // ActivityPub URL - extract username and try to resolve
      account = await this.resolveActivityPubUrl(identifier);
    } else {
      // Plain username (local account)
      account = await this.lookupAccount(identifier);
    }

    // Cache the result with multiple keys
    if (account) {
      this.cacheAccount(account, identifier);
    }

    return account;
  }

  /**
   * Get account by numeric ID
   * Migrated to GraphQL
   */
  private async getAccountById(id: string): Promise<Account> {
    const adapter = await getGraphQLAdapter();
    const actor = await adapter.getActorById(id);
    return mapGraphQLActorToAccount(toGraphQLActor(actor));
  }

  /**
   * Lookup account by username or webfinger address
   * Migrated to GraphQL
   */
  private async lookupAccount(acct: string): Promise<Account> {
    const adapter = await getGraphQLAdapter();
    const actor = await adapter.getActorByUsername(acct);
    return mapGraphQLActorToAccount(toGraphQLActor(actor));
  }

  /**
   * Resolve ActivityPub URL to account
   */
  private async resolveActivityPubUrl(url: string): Promise<Account> {
    // First, try to extract username from URL patterns
    const patterns = [
      /https?:\/\/[^/]+\/@([^/?#]+)/,        // Mastodon style: https://server/@username
      /https?:\/\/[^/]+\/users\/([^/?#]+)/,  // ActivityPub style: https://server/users/username
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const username = match[1];
        const domain = new URL(url).hostname;
        
        // Try local first, then remote
        try {
          return await this.lookupAccount(username);
        } catch {
          try {
            return await this.lookupAccount(`${username}@${domain}`);
          } catch {
            // Continue to search fallback
          }
        }
      }
    }

    // If no pattern matches, try searching for the URL
    return this.searchAccount(url);
  }

  /**
   * Search for account by URL or query
   * Migrated to GraphQL
   */
  private async searchAccount(query: string): Promise<Account> {
    const adapter = await getGraphQLAdapter();
    const results = await adapter.search({
      query: query,
      type: 'ACCOUNT',
      first: 1
    });
    
    if (!results.accounts || results.accounts.length === 0) {
      throw new Error('Account not found');
    }
    
    return mapGraphQLActorToAccount(toGraphQLActor(results.accounts[0]));
  }

  /**
   * Cache account with multiple keys for efficient lookups
   */
  private cacheAccount(account: Account, originalIdentifier: string): void {
    // Cache by original identifier
    this.accountCache.set(originalIdentifier, account);
    
    // Cache by ID
    this.accountCache.set(account.id, account);
    
    // Cache by acct (username or user@domain)
    this.accountCache.set(account.acct, account);
    
    // Cache by username (for local lookups)
    if (!account.acct.includes('@')) {
      this.accountCache.set(account.username, account);
    }
    
    // Cache by URL if available
    if (account.url) {
      this.accountCache.set(account.url, account);
    }
  }

  /**
   * Clear the account cache
   */
  clearCache(): void {
    this.accountCache.clear();
  }

  /**
   * Get cached account count (for debugging)
   */
  getCacheSize(): number {
    return this.accountCache.size;
  }
}

// Singleton instance
let accountService: AccountService | null = null;

export function getAccountService(): AccountService {
  if (!accountService) {
    accountService = new AccountService();
  }
  return accountService;
}

function filterGraphQLActors(value: unknown): GraphQLActor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((actor) => typeof actor === 'object' && actor !== null && 'id' in actor)
    .map((actor) => toGraphQLActor(actor));
}

function resolveCount(value: GraphQLCountValue | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }
  return value?.totalCount ?? 0;
}

function toGraphQLActor(actor: unknown): GraphQLActor {
  if (typeof actor !== 'object' || actor === null || !('id' in actor)) {
    throw new Error('Invalid actor payload received from GraphQL adapter');
  }

  return actor as GraphQLActor;
}

/**
 * Helper function to resolve account and get statuses
 * Migrated to GraphQL
 */
export async function getAccountStatuses(
  identifier: string,
  params?: { limit?: number; after?: string }
): Promise<Status[]> {
  const service = getAccountService();
  const account = await service.resolveAccount(identifier);
  
  const adapter = await getGraphQLAdapter();
  
  try {
    // Use the new fetchActorTimeline method from greater-components 1.0.21+
    const response = (await adapter.fetchActorTimeline(account.id, {
      first: params?.limit ?? 20,
      after: params?.after,
    })) as GraphQLTimelineResponse;

    const statuses = (response.edges ?? []).flatMap((edge) =>
      edge?.node ? [mapGraphQLToStatus(edge.node)] : []
    );

    return statuses;
  } catch (error) {
    console.error('[getAccountStatuses] Failed to fetch timeline:', error);
    throw error;
  }
}

// Helper to map GraphQL object to Status
function mapGraphQLToStatus(node: GraphQLStatusNode): Status {
  const obj = node.object ?? node;
  const actor = resolveStatusActor(obj);
  const mediaAttachments = (obj.attachments ?? []).map(mapGraphQLAttachmentToMedia);

  return {
    id: obj.id,
    uri: obj.id,
    url: obj.url ?? obj.id,
    created_at: obj.published ?? obj.createdAt ?? new Date().toISOString(),
    account: mapGraphQLActorToAccount(actor),
    content: obj.content ?? '',
    visibility: normalizeStatusVisibility(obj.visibility),
    sensitive: obj.sensitive ?? false,
    spoiler_text: obj.summary ?? obj.spoilerText ?? '',
    media_attachments: mediaAttachments,
    mentions: [],
    tags: [],
    emojis: [],
    reblogs_count: resolveCount(obj.shares ?? obj.sharesCount ?? null),
    favourites_count: resolveCount(obj.likes ?? obj.likesCount ?? null),
    replies_count: resolveCount(obj.replies ?? obj.repliesCount ?? null),
    reblogged: obj.userInteractions?.shared ?? false,
    favourited: obj.userInteractions?.liked ?? false,
    bookmarked: obj.userInteractions?.bookmarked ?? false,
    pinned: false,
    reblog: obj.shareOf ? mapGraphQLToStatus(obj.shareOf) : null,
    in_reply_to_id: obj.inReplyTo?.id ?? null,
    in_reply_to_account_id: null,
    application: null,
    language: obj.language ?? null,
    muted: false,
    poll: null,
    card: null,
    edited_at: obj.updated ?? null,
  };
}

function resolveStatusActor(node: GraphQLStatusNode): GraphQLActor {
  const actorCandidate = node.attributedTo ?? node.actor;
  if (actorCandidate) {
    return toGraphQLActor(actorCandidate);
  }

  return { id: node.id };
}

function mapGraphQLAttachmentToMedia(attachment: GraphQLStatusAttachment): MediaAttachment {
  return {
    id: attachment.id,
    type: normalizeAttachmentType(attachment.type),
    url: attachment.url,
    preview_url: attachment.preview ?? attachment.url,
    remote_url: attachment.remoteUrl ?? null,
    description: attachment.description ?? null,
    blurhash: attachment.blurhash ?? null,
  };
}

function normalizeStatusVisibility(value?: string | null): StatusVisibility {
  const normalized = (value ?? 'public').toLowerCase();
  if (
    normalized === 'public' ||
    normalized === 'unlisted' ||
    normalized === 'private' ||
    normalized === 'direct'
  ) {
    return normalized;
  }
  return 'public';
}

function normalizeAttachmentType(value?: string | null): AttachmentType {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'image' || normalized === 'gifv' || normalized === 'video' || normalized === 'audio') {
    return normalized;
  }
  return 'unknown';
}

/**
 * Helper function to resolve account and get followers
 * Migrated to GraphQL
 */
export async function getAccountFollowers(identifier: string, params?: { limit?: number; after?: string }) {
  const service = getAccountService();
  const account = await service.resolveAccount(identifier);
  
  const adapter = await getGraphQLAdapter();
  
  // Use the adapter's followers query (returns ActorListPage)
  const response = await adapter.getFollowers(account.id, params?.limit || 40);
  
  // Map GraphQL actors to accounts
  const actors = filterGraphQLActors(response.actors);
  return actors.map(mapGraphQLActorToAccount);
}

/**
 * Helper function to resolve account and get following
 * Migrated to GraphQL
 */
export async function getAccountFollowing(identifier: string, params?: { limit?: number; after?: string }) {
  const service = getAccountService();
  const account = await service.resolveAccount(identifier);
  
  const adapter = await getGraphQLAdapter();
  
  // Use the adapter's following query (returns ActorListPage)
  const response = await adapter.getFollowing(account.id, params?.limit || 40);
  
  // Map GraphQL actors to accounts
  const actors = filterGraphQLActors(response.actors);
  return actors.map(mapGraphQLActorToAccount);
}
