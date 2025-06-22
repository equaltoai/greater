/**
 * Instance-related types for Mastodon servers
 */

import type { MastodonAccount, CustomEmoji } from './auth';

/**
 * Instance information
 */
export interface Instance {
  uri: string;
  title: string;
  short_description: string;
  description: string;
  email: string;
  version: string;
  languages: string[];
  registrations: boolean;
  approval_required: boolean;
  invites_enabled: boolean;
  configuration?: InstanceConfiguration;
  urls: InstanceURLs;
  stats: InstanceStats;
  thumbnail: string | null;
  contact_account: MastodonAccount | null;
  rules: InstanceRule[];
}

/**
 * Extended instance information (v2)
 */
export interface InstanceV2 extends Omit<Instance, 'thumbnail'> {
  domain: string;
  source_url?: string;
  usage?: InstanceUsage;
  thumbnail?: InstanceThumbnail;
  configuration: InstanceConfigurationV2;
}

/**
 * Instance configuration
 */
export interface InstanceConfiguration {
  statuses: {
    max_characters: number;
    max_media_attachments: number;
    characters_reserved_per_url: number;
  };
  media_attachments: {
    supported_mime_types: string[];
    image_size_limit: number;
    image_matrix_limit: number;
    video_size_limit: number;
    video_frame_rate_limit: number;
    video_matrix_limit: number;
  };
  polls: {
    max_options: number;
    max_characters_per_option: number;
    min_expiration: number;
    max_expiration: number;
  };
  translation?: {
    enabled: boolean;
  };
}

/**
 * Extended instance configuration (v2)
 */
export interface InstanceConfigurationV2 extends InstanceConfiguration {
  accounts?: {
    max_featured_tags?: number;
    max_pinned_statuses?: number;
  };
  emojis?: {
    emoji_reactions_enabled?: boolean;
  };
}

/**
 * Instance URLs
 */
export interface InstanceURLs {
  streaming_api: string;
  status?: string;
}

/**
 * Instance statistics
 */
export interface InstanceStats {
  user_count: number;
  status_count: number;
  domain_count: number;
}

/**
 * Instance usage statistics
 */
export interface InstanceUsage {
  users: {
    active_month: number;
  };
}

/**
 * Instance thumbnail
 */
export interface InstanceThumbnail {
  url: string;
  blurhash?: string;
  versions?: {
    '@1x'?: string;
    '@2x'?: string;
  };
}

/**
 * Instance rule
 */
export interface InstanceRule {
  id: string;
  text: string;
}

/**
 * Instance activity
 */
export interface InstanceActivity {
  week: string;
  statuses: string;
  logins: string;
  registrations: string;
}

/**
 * Instance nodeinfo
 */
export interface NodeInfo {
  version: string;
  software: {
    name: string;
    version: string;
  };
  protocols: string[];
  services: {
    outbound: string[];
    inbound: string[];
  };
  usage: {
    users: {
      total: number;
      activeMonth: number;
      activeHalfyear: number;
    };
    localPosts: number;
  };
  openRegistrations: boolean;
  metadata?: Record<string, any>;
}

/**
 * Instance extended description
 */
export interface ExtendedDescription {
  updated_at: string;
  content: string;
}

/**
 * Instance domain block
 */
export interface DomainBlock {
  domain: string;
  digest: string;
  severity: 'silence' | 'suspend';
  comment?: string;
}

/**
 * Instance announcement
 */
export interface InstanceAnnouncement {
  id: string;
  text: string;
  published: boolean;
  all_day: boolean;
  published_at: string;
  updated_at: string;
  scheduled_at?: string;
  starts_at?: string;
  ends_at?: string;
  reactions: AnnouncementReaction[];
  mentions: AnnouncementMention[];
  statuses: AnnouncementStatus[];
  tags: AnnouncementTag[];
  emojis: CustomEmoji[];
  read?: boolean;
}

/**
 * Announcement reaction
 */
export interface AnnouncementReaction {
  name: string;
  count: number;
  me?: boolean;
  url?: string;
  static_url?: string;
}

/**
 * Announcement mention
 */
export interface AnnouncementMention {
  id: string;
  username: string;
  url: string;
  acct: string;
}

/**
 * Announcement status reference
 */
export interface AnnouncementStatus {
  id: string;
  url: string;
}

/**
 * Announcement tag
 */
export interface AnnouncementTag {
  name: string;
  url: string;
}

/**
 * Instance translation languages
 */
export interface TranslationLanguage {
  code: string;
  name: string;
}

/**
 * Instance directory
 */
export interface InstanceDirectory {
  accounts: MastodonAccount[];
  total: number;
}