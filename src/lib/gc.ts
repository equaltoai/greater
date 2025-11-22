/**
 * Greater Components Exports
 * 
 * Centralized imports for @equaltoai/greater-components
 * This module provides a clean interface to GC without repeating import paths
 */

// ============================================================================
// PRIMITIVES
// ============================================================================

export {
  Button,
  TextField,
  TextArea,
  Select,
  Checkbox,
  Switch,
  FileUpload,
  Modal,
  Menu,
  Tooltip,
  Tabs,
  Avatar,
  Skeleton,
  ThemeSwitcher,
  ThemeProvider,
  type ButtonProps,
  type TextFieldProps,
  type TextAreaProps,
  type SelectProps,
  type SelectOption,
  type CheckboxProps,
  type SwitchProps,
  type FileUploadProps,
  type ModalProps,
  type MenuProps,
  type TooltipProps,
  type TabsProps,
  type AvatarProps,
  type SkeletonProps,
  type ThemeSwitcherProps,
  type ThemeProviderProps,
} from '@equaltoai/greater-components/primitives';

// ============================================================================
// FEDIVERSE COMPONENTS
// ============================================================================

export {
  // Core Components
  ActionBar,
  ComposeBox, // Deprecated but still available
  ContentRenderer,
  ProfileHeader,
  StatusCard, // Deprecated but still available
  NotificationItem,
  NotificationsFeed,
  NotificationsFeedReactive,
  TimelineVirtualized,
  TimelineVirtualizedReactive,
  SettingsPanel,
  
  // Compound Components (new API)
  ComposeCompound,
  ComposeRoot,
  ComposeEditor,
  ComposeSubmit,
  ComposeCharacterCount,
  ComposeVisibilitySelect,
  
  // Types
  type ComposeContext,
  type ComposeConfig,
  type ComposeHandlers,
  type ComposeState,
  type PostVisibility,
  type ComposeAttachment,
  type StatusActionHandlers,
} from '@equaltoai/greater-components/fediverse';

// ============================================================================
// FEDIVERSE MODULES (Namespace imports)
// ============================================================================

// Module namespace exports
export type { Auth, Profile, Search, Lists, Messages, Filters, Admin, Status } from '@equaltoai/greater-components/fediverse';

// ============================================================================
// ADAPTERS
// ============================================================================

export {
  // GraphQL Clients
  createLesserClient,
  createGraphQLClient,
  LesserClient,
  GraphQLClient,
  
  // Platform Adapters
  MastodonAdapter,
  PleromaAdapter,
  LesserAdapter,
  createAdapter,
  autoDetectAdapter,
  
  // Types
  type GraphQLConfig,
  type LesserActor,
  type LesserNote,
  type LesserActivity,
  type TimelineResult,
  type ActorResult,
  type NoteResult,
  type CreateNoteResult,
  type Visibility,
  type UserPreferences,
} from '@equaltoai/greater-components/fediverse';

// ============================================================================
// PATTERNS
// ============================================================================

export {
  ThreadView,
  ContentWarningHandler,
  FederationIndicator,
  VisibilitySelector,
  ModerationTools,
  InstancePicker,
  CustomEmojiPicker,
  PollComposer,
  MediaComposer,
  BookmarkManager,
} from '@equaltoai/greater-components/fediverse';

// ============================================================================
// REALTIME INTEGRATIONS
// ============================================================================

export {
  createTimelineIntegration,
  createNotificationIntegration,
  createSharedTransport,
  withRealtime,
  realtimeErrorBoundary,
  type ConnectionConfig,
  type TimelineIntegrationConfig,
  type NotificationIntegrationConfig,
  type RealtimeIndicatorProps,
  type TransportConfig,
} from '@equaltoai/greater-components/fediverse';

// ============================================================================
// UTILS
// ============================================================================

// Utils exports
export { 
  relativeTime,
  sanitizeHtml,
  linkifyMentions,
} from '@equaltoai/greater-components/utils';

// ============================================================================
// GENERICS (ActivityPub)
// ============================================================================

export {
  type GenericStatus,
  type GenericTimelineItem,
  type GenericNotification,
  type GenericAdapter,
  type ActivityPubActor,
  type ActivityPubObject,
  type ActivityPubActivity,
  isFullActor,
  isFullObject,
  isNote,
  isLike,
  isAnnounce,
  isFollow,
  extractActor,
  extractObject,
  parseTimestamp,
  getVisibility,
} from '@equaltoai/greater-components/fediverse';

// ============================================================================
// ICONS (Svelte 5 compatible)
// ============================================================================

// Common icons - import as needed from @equaltoai/greater-components/icons
export {
  GlobeIcon as Globe,
  LockIcon as Lock,
  MailIcon as Mail,
  UsersIcon as Users,
  XIcon as X,
  HeartIcon as Heart,
  RepeatIcon as Repeat,
  MessageCircleIcon as MessageCircle,
  ShareIcon as Share,
  BookmarkIcon as Bookmark,
  MoreHorizontalIcon as MoreHorizontal,
  ImageIcon as Image,
  VideoIcon as Video,
  SendIcon as Send,
  SearchIcon as SearchIcon,
  HomeIcon as Home,
  BellIcon as Bell,
  UserIcon as User,
  SettingsIcon as Settings,
  LogOutIcon as LogOut,
  UserIcon as UserCircle,
  ArrowRightIcon as ArrowRight,
  ListIcon,
  BuildingIcon as LocalIcon,
} from '@equaltoai/greater-components/icons';
