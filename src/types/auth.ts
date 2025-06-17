/**
 * Authentication types for Mastodon OAuth and account management
 */

/**
 * Mastodon account information returned from the API
 */
export interface MastodonAccount {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  locked: boolean;
  bot: boolean;
  discoverable: boolean;
  group: boolean;
  created_at: string;
  note: string;
  url: string;
  avatar: string;
  avatar_static: string;
  header: string;
  header_static: string;
  followers_count: number;
  following_count: number;
  statuses_count: number;
  last_status_at: string | null;
  emojis: CustomEmoji[];
  fields: AccountField[];
  source?: AccountSource;
}

/**
 * Custom emoji definition
 */
export interface CustomEmoji {
  shortcode: string;
  url: string;
  static_url: string;
  visible_in_picker: boolean;
  category?: string;
}

/**
 * Account profile field
 */
export interface AccountField {
  name: string;
  value: string;
  verified_at?: string | null;
}

/**
 * Account source information (only visible to the account owner)
 */
export interface AccountSource {
  privacy: 'public' | 'unlisted' | 'private' | 'direct';
  sensitive: boolean;
  language: string;
  note: string;
  fields: AccountField[];
  follow_requests_count?: number;
}

/**
 * OAuth application registration response
 */
export interface OAuthApp {
  id: string;
  name: string;
  website: string | null;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
  vapid_key?: string;
}

/**
 * OAuth token response
 */
export interface OAuthToken {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
}

/**
 * Authenticated account with OAuth credentials
 */
export interface AuthenticatedAccount {
  id: string; // Format: "instance:userId"
  instance: string;
  user: MastodonAccount;
  token: OAuthToken;
  app: OAuthApp;
  lastUsed: number;
}

/**
 * Authentication state
 */
export interface AuthState {
  currentUser: MastodonAccount | null;
  currentInstance: string | null;
  accounts: AuthenticatedAccount[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * OAuth authorization parameters
 */
export interface AuthorizeParams {
  instance: string;
  scopes?: string[];
  force?: boolean;
}

/**
 * OAuth token exchange parameters
 */
export interface TokenExchangeParams {
  instance: string;
  code: string;
  codeVerifier: string;
}

/**
 * Authentication error with additional context
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public instance?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Authentication error codes
 */
export type AuthErrorCode = 
  | 'INVALID_INSTANCE'
  | 'INVALID_STATE'
  | 'INVALID_CODE'
  | 'TOKEN_EXCHANGE_FAILED'
  | 'VERIFY_FAILED'
  | 'SESSION_EXPIRED'
  | 'APP_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';