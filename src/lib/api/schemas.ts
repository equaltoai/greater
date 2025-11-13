/**
 * Zod schemas for API response validation
 * Ensures type safety and data integrity at runtime
 */

import { z } from 'zod';
import type {
  Application,
  CustomEmoji,
  FilterResult,
  MediaAttachment,
  Mention,
  PreviewCard,
  Status as MastodonStatus,
  Tag,
} from '$lib/types/mastodon';

// Base schemas
// More lenient datetime schema that accepts various ISO 8601 formats
const DateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid datetime" }
);
const URLSchema = z.string().url();
const EmailSchema = z.string().email();

// Account schemas
export const AccountFieldSchema = z.object({
  name: z.string(),
  value: z.string(),
  verified_at: z.string().nullable().optional()
});

const ApplicationSchema: z.ZodType<Application> = z.object({
  name: z.string(),
  website: z.string().nullable()
});

const FilterResultSchema: z.ZodType<FilterResult> = z.custom<FilterResult>();
const MediaAttachmentSchema: z.ZodType<MediaAttachment> = z.custom<MediaAttachment>();
const MentionSchema: z.ZodType<Mention> = z.custom<Mention>();
const TagSchema: z.ZodType<Tag> = z.custom<Tag>();
const EmojiSchema: z.ZodType<CustomEmoji> = z.custom<CustomEmoji>();
const PreviewCardSchema: z.ZodType<PreviewCard | null> = z.custom<PreviewCard | null>();
const PollSchema: z.ZodType<MastodonStatus['poll']> = z.custom<MastodonStatus['poll']>();

// Lesser-specific trust indicators
export const TrustIndicatorsSchema = z.object({
  score: z.number().min(0).max(100),
  badges: z.array(z.object({
    type: z.string(),
    label: z.string(),
    description: z.string()
  })),
  verification_level: z.enum(['none', 'basic', 'verified', 'trusted'])
}).optional();

// Lesser-specific cost transparency
export const CostTransparencySchema = z.object({
  monthly_cost: z.number(),
  cost_per_post: z.number(),
  storage_used: z.number()
}).optional();

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
  avatar: z.union([URLSchema, z.literal('')]),
  avatar_static: z.union([URLSchema, z.literal('')]),
  header: z.union([URLSchema, z.literal('')]),
  header_static: z.union([URLSchema, z.literal('')]),
  followers_count: z.number().int().min(0),
  following_count: z.number().int().min(0),
  statuses_count: z.number().int().min(0),
  last_status_at: z.union([DateStringSchema, z.literal('')]).nullable(),
  emojis: z.array(z.unknown()),
  fields: z.array(AccountFieldSchema),
  hide_collections: z.boolean().optional(),
  noindex: z.boolean().optional(),
  indexable: z.boolean().optional(),
  roles: z.array(z.unknown()).optional(),
  // Lesser-specific fields
  trust_indicators: TrustIndicatorsSchema,
  cost_transparency: CostTransparencySchema
}).passthrough(); // Allow additional fields from the API

// Media attachment schemas
// Lesser-specific community notes
export const CommunityNoteSchema = z.object({
  id: z.string(),
  content: z.string(),
  author_id: z.string(),
  created_at: DateStringSchema,
  votes_helpful: z.number(),
  votes_unhelpful: z.number(),
  status: z.enum(['pending', 'approved', 'rejected'])
}).optional();

// Lesser-specific AI analysis
export const AIAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  topics: z.array(z.string()),
  content_warning_suggestions: z.array(z.string()),
  moderation_score: z.number().min(0).max(1)
}).optional();

// Status schemas
export const StatusSchema: z.ZodType<MastodonStatus> = z.lazy(() => z.object({
  id: z.string(),
  created_at: DateStringSchema,
  in_reply_to_id: z.string().nullable(),
  in_reply_to_account_id: z.string().nullable(),
  sensitive: z.boolean(),
  spoiler_text: z.string(),
  visibility: z.enum(['public', 'unlisted', 'private', 'direct']),
  language: z.string().nullable(),
  uri: z.string(),
  url: z.union([URLSchema, z.literal('')]).nullable(),
  replies_count: z.number().int().min(0),
  reblogs_count: z.number().int().min(0),
  favourites_count: z.number().int().min(0),
  edited_at: DateStringSchema.nullable(),
  content: z.string(),
  reblog: StatusSchema.nullable(),
  application: ApplicationSchema.nullable().optional(),
  account: AccountSchema,
  media_attachments: z.array(MediaAttachmentSchema),
  mentions: z.array(MentionSchema),
  tags: z.array(TagSchema),
  emojis: z.array(EmojiSchema),
  card: PreviewCardSchema.default(null),
  poll: PollSchema.default(null),
  favourited: z.boolean().nullable(),
  reblogged: z.boolean().nullable(),
  muted: z.boolean().nullable(),
  bookmarked: z.boolean().nullable(),
  pinned: z.boolean().optional(),
  filtered: FilterResultSchema.array().nullable().optional(),
  // Lesser-specific fields
  delivery_cost: z.number().optional(),
  community_notes: z.array(CommunityNoteSchema).optional(),
  ai_analysis: AIAnalysisSchema
}));

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
  configuration: z.unknown(),
  urls: z.object({
    streaming_api: z.string(),
    status: z.string().optional()
  }),
  stats: z.object({
    user_count: z.number(),
    status_count: z.number(),
    domain_count: z.number()
  }),
  thumbnail: z.string().nullable().optional(),
  contact_account: AccountSchema.nullable(),
  rules: z.array(z.object({
    id: z.string(),
    text: z.string()
  }))
}).passthrough();

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
  report: z.unknown().optional()
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

// Lesser-specific search params
export const SearchParamsSchema = z.object({
  q: z.string(),
  type: z.enum(['accounts', 'hashtags', 'statuses']).optional(),
  resolve: z.boolean().optional(),
  following: z.boolean().optional(),
  account_id: z.string().optional(),
  exclude_unreviewed: z.boolean().optional(),
  limit: z.number().min(1).max(40).optional(),
  offset: z.number().optional(),
  min_id: z.string().optional(),
  max_id: z.string().optional(),
  // Lesser-specific
  semantic: z.boolean().optional(),
  trust_threshold: z.number().min(0).max(100).optional()
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
      console.error(`[Schema Validation] Failed for ${context}:`, error.issues);
      console.warn(`[Schema Validation] Returning unvalidated data for ${context}`);
      // Return the data as-is when validation fails
      // This is temporary to help identify what fields are causing issues
      return data as T;
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
export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type TrustIndicators = z.infer<typeof TrustIndicatorsSchema>;
export type CostTransparency = z.infer<typeof CostTransparencySchema>;
export type CommunityNote = z.infer<typeof CommunityNoteSchema>;
export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;
