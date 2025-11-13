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
} from '@equaltoai/greater-components-primitives';

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

// Common icons - import as needed from @equaltoai/greater-components/icons/*
export { default as Globe } from '@equaltoai/greater-components/icons/globe';
export { default as Lock } from '@equaltoai/greater-components/icons/lock';
export { default as Mail } from '@equaltoai/greater-components/icons/mail';
export { default as Users } from '@equaltoai/greater-components/icons/users';
export { default as X } from '@equaltoai/greater-components/icons/x';
export { default as Heart } from '@equaltoai/greater-components/icons/heart';
export { default as Repeat } from '@equaltoai/greater-components/icons/repeat';
export { default as MessageCircle } from '@equaltoai/greater-components/icons/message-circle';
export { default as Share } from '@equaltoai/greater-components/icons/share';
export { default as Bookmark } from '@equaltoai/greater-components/icons/bookmark';
export { default as MoreHorizontal } from '@equaltoai/greater-components/icons/more-horizontal';
export { default as Image } from '@equaltoai/greater-components/icons/image';
export { default as Video } from '@equaltoai/greater-components/icons/video';
export { default as Send } from '@equaltoai/greater-components/icons/send';
export { default as Search } from '@equaltoai/greater-components/icons/search';
export { default as Home } from '@equaltoai/greater-components/icons/home';
export { default as Bell } from '@equaltoai/greater-components/icons/bell';
export { default as User } from '@equaltoai/greater-components/icons/user';
export { default as Settings } from '@equaltoai/greater-components/icons/settings';
export { default as LogOut } from '@equaltoai/greater-components/icons/log-out';
export { default as UserCircle } from '@equaltoai/greater-components/icons/user';
export { default as ArrowRight } from '@equaltoai/greater-components/icons/arrow-right';
export { default as ListIcon } from '@equaltoai/greater-components/icons/list';
export { default as LocalIcon } from '@equaltoai/greater-components/icons/building';

