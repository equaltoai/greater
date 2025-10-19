/**
 * Mastodon API type definitions
 * Based on Mastodon API v1/v2 specifications
 */

// Re-export auth types that are shared
export type { MastodonAccount as Account, CustomEmoji, AccountField } from './auth';

// Status (Toot)
export interface Status {
  id: string;
  created_at: string;
  in_reply_to_id: string | null;
  in_reply_to_account_id: string | null;
  sensitive: boolean;
  spoiler_text: string;
  visibility: StatusVisibility;
  language: string | null;
  uri: string;
  url: string | null;
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
  edited_at: string | null;
  favourited?: boolean | null;
  reblogged?: boolean | null;
  muted?: boolean | null;
  bookmarked?: boolean | null;
  pinned?: boolean | null;
  content: string;
  filtered?: FilterResult[];
  reblog: Status | null;
  application?: Application;
  account: Account;
  media_attachments: MediaAttachment[];
  mentions: Mention[];
  tags: Tag[];
  emojis: CustomEmoji[];
  card: PreviewCard | null;
  poll: Poll | null;
}

export type StatusVisibility = 'public' | 'unlisted' | 'private' | 'direct';

// Media Attachment
export interface MediaAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  preview_url: string;
  remote_url: string | null;
  text_url?: string;
  meta?: MediaMeta;
  description: string | null;
  blurhash: string | null;
  sensitive?: boolean;
  spoiler_text?: string | null;
}

export type AttachmentType = 'unknown' | 'image' | 'gifv' | 'video' | 'audio';

export interface MediaMeta {
  original?: MediaDimensions;
  small?: MediaDimensions;
  focus?: { x: number; y: number };
  media_category?: string;
  media_type?: string;
  mime_type?: string | null;
  warnings?: string[];
}

export interface MediaDimensions {
  width: number;
  height: number;
  size?: string;
  aspect?: number;
  frame_rate?: string;
  duration?: number;
  bitrate?: number;
}

// Poll
export interface Poll {
  id: string;
  expires_at: string | null;
  expired: boolean;
  multiple: boolean;
  votes_count: number;
  voters_count: number | null;
  options: PollOption[];
  emojis: CustomEmoji[];
  voted?: boolean;
  own_votes?: number[];
}

export interface PollOption {
  title: string;
  votes_count: number | null;
}

// Mention
export interface Mention {
  id: string;
  username: string;
  url: string;
  acct: string;
}

// Tag (Hashtag)
export interface Tag {
  name: string;
  url: string;
  history?: TagHistory[] | null;
  following?: boolean;
}

export interface TagHistory {
  day: string;
  uses: string;
  accounts: string;
}

// Application
export interface Application {
  name: string;
  website: string | null;
}

// Preview Card
export interface PreviewCard {
  url: string;
  title: string;
  description: string;
  type: CardType;
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  html?: string;
  width?: number;
  height?: number;
  image?: string;
  embed_url?: string;
  blurhash?: string;
}

export type CardType = 'link' | 'photo' | 'video' | 'rich';

// Filter
export interface Filter {
  id: string;
  title: string;
  context: FilterContext[];
  expires_at: string | null;
  filter_action: FilterAction;
  keywords: FilterKeyword[];
  statuses: FilterStatus[];
}

export type FilterContext = 'home' | 'notifications' | 'public' | 'thread' | 'account';
export type FilterAction = 'warn' | 'hide';

export interface FilterKeyword {
  id: string;
  keyword: string;
  whole_word: boolean;
}

export interface FilterStatus {
  id: string;
  status_id: string;
}

export interface FilterResult {
  filter: Filter;
  keyword_matches?: string[];
  status_matches?: string[];
}

// Notification
export interface Notification {
  id: string;
  type: NotificationType;
  created_at: string;
  account: Account;
  status?: Status;
  report?: Report;
}

export type NotificationType = 
  | 'mention'
  | 'status'
  | 'reblog'
  | 'follow'
  | 'follow_request'
  | 'favourite'
  | 'poll'
  | 'update'
  | 'admin.sign_up'
  | 'admin.report';

// Relationship
export interface Relationship {
  id: string;
  following: boolean;
  showing_reblogs: boolean;
  notifying: boolean;
  languages: string[] | null;
  followed_by: boolean;
  blocking: boolean;
  blocked_by: boolean;
  muting: boolean;
  muting_notifications: boolean;
  requested: boolean;
  domain_blocking: boolean;
  endorsed: boolean;
  note: string;
}

// Context
export interface Context {
  ancestors: Status[];
  descendants: Status[];
}

// Instance
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
  configuration: InstanceConfiguration;
  urls: InstanceURLs;
  stats: InstanceStats;
  thumbnail: string | null;
  contact_account: Account | null;
  rules: Rule[];
}

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
  translation: {
    enabled: boolean;
  };
}

export interface InstanceURLs {
  streaming_api: string;
}

export interface InstanceStats {
  user_count: number;
  status_count: number;
  domain_count: number;
}

export interface Rule {
  id: string;
  text: string;
}

// Search
export interface SearchResults {
  accounts: Account[];
  statuses: Status[];
  hashtags: Tag[];
}

// List
export interface List {
  id: string;
  title: string;
  replies_policy?: RepliesPolicy;
}

export type RepliesPolicy = 'followed' | 'list' | 'none';

// Marker
export interface Marker {
  last_read_id: string;
  version: number;
  updated_at: string;
}

export interface Markers {
  home?: Marker;
  notifications?: Marker;
}

// Report
export interface Report {
  id: string;
  action_taken: boolean;
  action_taken_at: string | null;
  category: ReportCategory;
  comment: string;
  forwarded: boolean;
  created_at: string;
  status_ids: string[] | null;
  rule_ids: string[] | null;
  target_account: Account;
}

export type ReportCategory = 'spam' | 'violation' | 'other';

// Announcement
export interface Announcement {
  id: string;
  content: string;
  starts_at: string | null;
  ends_at: string | null;
  published: boolean;
  all_day: boolean;
  published_at: string;
  updated_at: string;
  read?: boolean;
  mentions: AnnouncementAccount[];
  statuses: AnnouncementStatus[];
  tags: Tag[];
  emojis: CustomEmoji[];
  reactions: AnnouncementReaction[];
}

export interface AnnouncementAccount {
  id: string;
  username: string;
  url: string;
  acct: string;
}

export interface AnnouncementStatus {
  id: string;
  url: string;
}

export interface AnnouncementReaction {
  name: string;
  count: number;
  me?: boolean;
  url?: string;
  static_url?: string;
}

// Preferences
export interface Preferences {
  'posting:default:visibility': StatusVisibility;
  'posting:default:sensitive': boolean;
  'posting:default:language': string | null;
  'reading:expand:media': 'default' | 'show_all' | 'hide_all';
  'reading:expand:spoilers': boolean;
}

// Featured Tag
export interface FeaturedTag {
  id: string;
  name: string;
  url: string;
  statuses_count: number;
  last_status_at: string;
}

// Identity Proof
export interface IdentityProof {
  provider: string;
  provider_username: string;
  updated_at: string;
  proof_url: string;
  profile_url: string;
}

// Activity
export interface Activity {
  week: string;
  statuses: string;
  logins: string;
  registrations: string;
}

// Request Parameters
export interface PaginationParams {
  max_id?: string;
  since_id?: string;
  min_id?: string;
  limit?: number;
}

export interface TimelineParams extends PaginationParams {
  local?: boolean;
  remote?: boolean;
  only_media?: boolean;
}

export interface AccountStatusesParams extends PaginationParams {
  only_media?: boolean;
  pinned?: boolean;
  exclude_replies?: boolean;
  exclude_reblogs?: boolean;
  tagged?: string;
}

export interface SearchParams {
  q: string;
  type?: SearchType;
  resolve?: boolean;
  following?: boolean;
  account_id?: string;
  exclude_unreviewed?: boolean;
  max_id?: string;
  min_id?: string;
  limit?: number;
  offset?: number;
}

export type SearchType = 'accounts' | 'hashtags' | 'statuses';

export interface CreateStatusParams {
  status?: string;
  media_ids?: string[];
  poll?: CreatePollParams;
  in_reply_to_id?: string;
  sensitive?: boolean;
  spoiler_text?: string;
  visibility?: StatusVisibility;
  language?: string;
  scheduled_at?: string;
}

export interface CreatePollParams {
  options: string[];
  expires_in: number;
  multiple?: boolean;
  hide_totals?: boolean;
}

export interface UpdateCredentialsParams {
  display_name?: string;
  note?: string;
  avatar?: File;
  header?: File;
  locked?: boolean;
  bot?: boolean;
  discoverable?: boolean;
  fields_attributes?: Array<{
    name: string;
    value: string;
  }>;
}

// API Error
export interface APIError {
  error: string;
  error_description?: string;
}
