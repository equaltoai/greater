/**
 * Zod schemas for API response validation
 * Ensures type safety and data integrity at runtime
 */

import { z } from 'zod';

// Base schemas
const DateStringSchema = z.string().datetime();
const URLSchema = z.string().url();
const EmailSchema = z.string().email();

// Account schemas
export const AccountFieldSchema = z.object({
  name: z.string(),
  value: z.string(),
  verified_at: DateStringSchema.nullable().optional()
});

export const AccountSchema = z.object({
  id: z.string(),
  username: z.string().min(1).max(30),
  acct: z.string(),
  display_name: z.string().max(30),
  locked: z.boolean(),
  bot: z.boolean(),
  discoverable: z.boolean().nullable(),
  group: z.boolean(),
  created_at: DateStringSchema,
  note: z.string(),
  url: URLSchema,
  avatar: URLSchema,
  avatar_static: URLSchema,
  header: URLSchema,
  header_static: URLSchema,
  followers_count: z.number().int().min(0),
  following_count: z.number().int().min(0),
  statuses_count: z.number().int().min(0),
  last_status_at: DateStringSchema.nullable(),
  emojis: z.array(z.any()),
  fields: z.array(AccountFieldSchema)
});

// Media attachment schemas
export const MediaAttachmentSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video', 'gifv', 'audio', 'unknown']),
  url: URLSchema,
  preview_url: URLSchema.nullable(),
  remote_url: URLSchema.nullable(),
  text_url: URLSchema.nullable(),
  meta: z.any().nullable(),
  description: z.string().nullable(),
  blurhash: z.string().nullable()
});

// Status schemas
export const StatusSchema = z.object({
  id: z.string(),
  created_at: DateStringSchema,
  in_reply_to_id: z.string().nullable(),
  in_reply_to_account_id: z.string().nullable(),
  sensitive: z.boolean(),
  spoiler_text: z.string(),
  visibility: z.enum(['public', 'unlisted', 'private', 'direct']),
  language: z.string().nullable(),
  uri: z.string(),
  url: URLSchema.nullable(),
  replies_count: z.number().int().min(0),
  reblogs_count: z.number().int().min(0),
  favourites_count: z.number().int().min(0),
  edited_at: DateStringSchema.nullable(),
  content: z.string(),
  reblog: z.lazy(() => StatusSchema).nullable(),
  application: z.any().nullable(),
  account: AccountSchema,
  media_attachments: z.array(MediaAttachmentSchema),
  mentions: z.array(z.any()),
  tags: z.array(z.any()),
  emojis: z.array(z.any()),
  card: z.any().nullable(),
  poll: z.any().nullable(),
  favourited: z.boolean().nullable(),
  reblogged: z.boolean().nullable(),
  muted: z.boolean().nullable(),
  bookmarked: z.boolean().nullable(),
  pinned: z.boolean().nullable(),
  filtered: z.array(z.any()).nullable()
});

// Timeline response
export const TimelineResponseSchema = z.array(StatusSchema);

// OAuth schemas
export const OAuthAppSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  website: z.string().nullable().optional(),
  scopes: z.string().optional(),
  redirect_uri: z.string().optional(),
  client_id: z.string(),
  client_secret: z.string(),
  vapid_key: z.string().optional()
});

export const OAuthTokenSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  scope: z.string(),
  created_at: z.number()
});

// Instance schemas
export const InstanceSchema = z.object({
  uri: z.string(),
  title: z.string(),
  short_description: z.string(),
  description: z.string(),
  email: EmailSchema,
  version: z.string(),
  languages: z.array(z.string()),
  registrations: z.boolean(),
  approval_required: z.boolean(),
  invites_enabled: z.boolean(),
  configuration: z.any(),
  contact_account: AccountSchema.nullable(),
  rules: z.array(z.object({
    id: z.string(),
    text: z.string()
  }))
});

// Notification schemas
export const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum([
    'follow',
    'follow_request',
    'mention',
    'reblog',
    'favourite',
    'poll',
    'status',
    'update',
    'admin.sign_up',
    'admin.report'
  ]),
  created_at: DateStringSchema,
  account: AccountSchema,
  status: StatusSchema.optional(),
  report: z.any().optional()
});

// Search schemas
export const SearchResultsSchema = z.object({
  accounts: z.array(AccountSchema),
  statuses: z.array(StatusSchema),
  hashtags: z.array(z.object({
    name: z.string(),
    url: URLSchema,
    history: z.array(z.object({
      day: z.string(),
      uses: z.string(),
      accounts: z.string()
    })).nullable()
  }))
});

// Relationship schema
export const RelationshipSchema = z.object({
  id: z.string(),
  following: z.boolean(),
  showing_reblogs: z.boolean(),
  notifying: z.boolean(),
  followed_by: z.boolean(),
  blocking: z.boolean(),
  blocked_by: z.boolean(),
  muting: z.boolean(),
  muting_notifications: z.boolean(),
  requested: z.boolean(),
  domain_blocking: z.boolean(),
  endorsed: z.boolean(),
  note: z.string()
});

// List schema
export const ListSchema = z.object({
  id: z.string(),
  title: z.string(),
  replies_policy: z.enum(['followed', 'list', 'none'])
});

// Context schema
export const ContextSchema = z.object({
  ancestors: z.array(StatusSchema),
  descendants: z.array(StatusSchema)
});

// Preferences schema
export const PreferencesSchema = z.object({
  'posting:default:visibility': z.enum(['public', 'unlisted', 'private', 'direct']),
  'posting:default:sensitive': z.boolean(),
  'posting:default:language': z.string().nullable(),
  'reading:expand:media': z.enum(['default', 'show_all', 'hide_all']),
  'reading:expand:spoilers': z.boolean()
});

// Create status params validation
export const CreateStatusParamsSchema = z.object({
  status: z.string().min(1).max(500),
  in_reply_to_id: z.string().optional(),
  media_ids: z.array(z.string()).optional(),
  poll: z.object({
    options: z.array(z.string()).min(2).max(4),
    expires_in: z.number().min(300),
    multiple: z.boolean().optional(),
    hide_totals: z.boolean().optional()
  }).optional(),
  sensitive: z.boolean().optional(),
  spoiler_text: z.string().optional(),
  visibility: z.enum(['public', 'unlisted', 'private', 'direct']).optional(),
  language: z.string().optional(),
  scheduled_at: DateStringSchema.optional()
});

// Helper function to validate API responses
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new Error(
        `Invalid API response${context ? ` for ${context}` : ''}: ${issues}`
      );
    }
    throw error;
  }
}

// Type exports
export type Account = z.infer<typeof AccountSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type OAuthApp = z.infer<typeof OAuthAppSchema>;
export type OAuthToken = z.infer<typeof OAuthTokenSchema>;
export type Instance = z.infer<typeof InstanceSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type SearchResults = z.infer<typeof SearchResultsSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type List = z.infer<typeof ListSchema>;
export type Context = z.infer<typeof ContextSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type CreateStatusParams = z.infer<typeof CreateStatusParamsSchema>;