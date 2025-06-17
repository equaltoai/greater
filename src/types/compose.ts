/**
 * Compose-related types for creating and editing posts
 */

import type { Status, StatusVisibility, MediaAttachment } from './mastodon';

/**
 * Compose state for creating/editing posts
 */
export interface ComposeState {
  text: string;
  spoilerText: string;
  visibility: StatusVisibility;
  sensitive: boolean;
  language?: string;
  mediaIds: string[];
  mediaAttachments: MediaAttachment[];
  poll?: ComposePoll;
  inReplyToId?: string;
  inReplyToStatus?: Status;
  editingStatusId?: string;
  scheduledAt?: string;
  idempotencyKey?: string;
}

/**
 * Poll creation data
 */
export interface ComposePoll {
  options: string[];
  expiresIn: number; // seconds
  multiple: boolean;
  hideTotals: boolean;
}

/**
 * Media upload state
 */
export interface MediaUploadState {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  attachment?: MediaAttachment;
  error?: string;
}

/**
 * Compose options
 */
export interface ComposeOptions {
  replyTo?: Status;
  editStatus?: Status;
  quote?: Status;
  visibility?: StatusVisibility;
  sensitive?: boolean;
  spoilerText?: string;
  language?: string;
  scheduledAt?: string;
}

/**
 * Compose validation result
 */
export interface ComposeValidation {
  isValid: boolean;
  errors: ComposeError[];
  warnings: ComposeWarning[];
}

/**
 * Compose error
 */
export interface ComposeError {
  field: ComposeField;
  message: string;
  code: ComposeErrorCode;
}

/**
 * Compose warning
 */
export interface ComposeWarning {
  field: ComposeField;
  message: string;
  code: ComposeWarningCode;
}

/**
 * Compose field names
 */
export type ComposeField = 
  | 'text'
  | 'spoilerText'
  | 'media'
  | 'poll'
  | 'visibility'
  | 'schedule';

/**
 * Compose error codes
 */
export type ComposeErrorCode = 
  | 'TEXT_TOO_LONG'
  | 'SPOILER_TOO_LONG'
  | 'TOO_MANY_MEDIA'
  | 'INVALID_MEDIA_TYPE'
  | 'POLL_TOO_MANY_OPTIONS'
  | 'POLL_OPTION_TOO_LONG'
  | 'POLL_INVALID_DURATION'
  | 'SCHEDULE_IN_PAST'
  | 'EMPTY_POST';

/**
 * Compose warning codes
 */
export type ComposeWarningCode = 
  | 'NO_ALT_TEXT'
  | 'HASHTAG_LIMIT'
  | 'MENTION_LIMIT'
  | 'URL_LIMIT';

/**
 * Emoji suggestion
 */
export interface EmojiSuggestion {
  shortcode: string;
  url: string;
  static_url: string;
  visible_in_picker: boolean;
  category?: string;
}

/**
 * Account suggestion for mentions
 */
export interface AccountSuggestion {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  avatar: string;
  avatar_static: string;
  bot: boolean;
}

/**
 * Hashtag suggestion
 */
export interface HashtagSuggestion {
  name: string;
  url: string;
  history?: Array<{
    day: string;
    uses: string;
    accounts: string;
  }>;
  following?: boolean;
}

/**
 * Suggestion types
 */
export type SuggestionType = 'emoji' | 'account' | 'hashtag';

/**
 * Autocomplete suggestion
 */
export interface AutocompleteSuggestion {
  type: SuggestionType;
  value: string;
  label: string;
  data: EmojiSuggestion | AccountSuggestion | HashtagSuggestion;
}

/**
 * Character counter state
 */
export interface CharacterCounter {
  count: number;
  max: number;
  remaining: number;
  isOverLimit: boolean;
}

/**
 * Compose draft
 */
export interface ComposeDraft {
  id: string;
  createdAt: number;
  updatedAt: number;
  state: ComposeState;
  context?: {
    replyToId?: string;
    editingStatusId?: string;
  };
}

/**
 * Media focal point
 */
export interface MediaFocalPoint {
  x: number; // -1.0 to 1.0
  y: number; // -1.0 to 1.0
}

/**
 * Media metadata for editing
 */
export interface MediaMetadata {
  id: string;
  description: string;
  focus?: MediaFocalPoint;
}

/**
 * Compose preferences
 */
export interface ComposePreferences {
  defaultVisibility: StatusVisibility;
  defaultSensitive: boolean;
  defaultLanguage?: string;
  autoSuggestEmoji: boolean;
  confirmBeforePublish: boolean;
  preserveCWs: boolean;
}