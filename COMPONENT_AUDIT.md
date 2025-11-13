# Component Audit - Custom vs Greater Components

This document identifies which custom components can be replaced with @equaltoai/greater-components.

## 🔴 HIGH PRIORITY - Direct Replacements Available

| Custom Component | GC Replacement | Import Path | Status | Notes |
|-----------------|----------------|-------------|--------|-------|
| `Timeline.svelte` | `TimelineVirtualizedReactive` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Full virtualized timeline with real-time |
| `ComposeBox.svelte` | `ComposeBox` or `Compose.*` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Both deprecated and compound component available |
| `StatusCard.svelte` | `StatusCard` or `Status.*` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Both deprecated and compound component available |
| `NotificationList.svelte` | `NotificationsFeedReactive` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Reactive feed with real-time updates |
| `NotificationCard.svelte` | `NotificationItem` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Single notification card |
| `ProfileHeader.svelte` | `ProfileHeader` | `@equaltoai/greater-components/fediverse` | ✅ Replace | User profile header display |
| `UserProfile.svelte` | `Profile.Root` + children | `@equaltoai/greater-components/fediverse` | ✅ Replace | Full profile compound component |

## 🟡 MEDIUM PRIORITY - Module Replacements

| Custom Component | GC Replacement | Import Path | Status | Notes |
|-----------------|----------------|-------------|--------|-------|
| `LoginForm.svelte` | `Auth.LoginForm` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Part of Auth module |
| `LoginFormMinimal.svelte` | `Auth.LoginForm` (customized) | `@equaltoai/greater-components/fediverse` | ✅ Replace | Same component with minimal props |
| `LoginFormSafe.svelte` | `Auth.LoginForm` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Same component |
| `OAuthCallback.svelte` | Custom with GC Auth context | - | ⚠️ Keep | OAuth callback is app-specific, but use GC Auth context |
| `WebAuthnLoginForm.svelte` | `Auth.WebAuthnSetup` | `@equaltoai/greater-components/fediverse` | ⚠️ Check | Verify if GC supports full WebAuthn flow |
| `SearchBar.svelte` | `Search.Bar` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Part of Search module |
| `SearchResults.svelte` | `Search.Results` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Part of Search module |
| `ListManager.svelte` | `Lists.Manager` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Part of Lists module |
| `ListEditor.svelte` | `Lists.Editor` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Part of Lists module |
| `ListTimeline.svelte` | `Lists.Timeline` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Part of Lists module |
| `SettingsNav.svelte` | Custom | - | ✅ Keep | App-specific navigation |
| `PreferencesSettings.svelte` | `SettingsPanel` | `@equaltoai/greater-components/fediverse` | ⚠️ Check | Verify if GC SettingsPanel covers preferences |
| `ProfileSettings.svelte` | `Profile.Edit` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Part of Profile module |
| `NotificationSettings.svelte` | Part of `SettingsPanel`? | `@equaltoai/greater-components/fediverse` | ⚠️ Check | May need custom implementation |

## 🟢 LOW PRIORITY - Primitive Replacements

| Custom Component | GC Replacement | Import Path | Status | Notes |
|-----------------|----------------|-------------|--------|-------|
| `Button.svelte` | `Button` | `@equaltoai/greater-components/primitives` | ✅ Replace | Direct primitive replacement |
| `ThemeToggle.svelte` | `ThemeSwitcher` | `@equaltoai/greater-components/primitives` | ✅ Replace | Direct primitive replacement |
| `ThemeSettings.svelte` | Custom + `ThemeSwitcher` | - | ⚠️ Hybrid | Use ThemeSwitcher + custom settings layout |
| `MediaGallery.svelte` | Built into `StatusCard` | - | ✅ Remove | StatusCard handles media |
| `MediaUpload.svelte` | `MediaComposer` | `@equaltoai/greater-components/fediverse` | ✅ Replace | Pattern component |
| `OptimizedImage.svelte` | Custom | - | ✅ Keep | Performance optimization, app-specific |
| `VideoPlayer.svelte` | Built into `StatusCard`? | - | ⚠️ Check | May be part of Status.Media |

## 🔵 APP-SPECIFIC - Keep Custom

| Custom Component | Reason to Keep | Notes |
|-----------------|----------------|-------|
| `AuthGuard.svelte` | App-specific routing logic | Route protection wrapper |
| `OfflineIndicator.svelte` | App-specific PWA feature | Network status indicator |
| `Navigation.svelte` | App-specific nav structure | Main app navigation |
| `UserMenu.svelte` | App-specific menu items | User dropdown menu |
| `TimelineTabs.svelte` | App-specific tab layout | Timeline tab switcher |
| `TrendingSidebar.svelte` | App-specific layout | Sidebar component |
| `ThemeInitializer.svelte` | App-specific initialization | Theme setup on load |
| `EmptyState.svelte` | Generic utility | Could use GC if available |
| `ErrorState.svelte` | Generic utility | Could use GC if available |
| `StatusSkeleton.svelte` | App-specific loading | Use GC Skeleton primitive |
| `TimelineSkeleton.svelte` | App-specific loading | Use GC Skeleton primitive |

## 🟣 COMPOUND COMPONENTS - Check Usage

| Custom Component | Related GC Module | Action |
|-----------------|-------------------|--------|
| `StatusThread.svelte` | `ThreadView` pattern | Check if GC ThreadView covers use case |
| `InlineReplyBox.svelte` | `Compose` module | May be covered by Compose.Root with reply context |
| `QuotePreview.svelte` | Built into `StatusCard`? | Check if StatusCard handles quotes |
| `HashtagCard.svelte` | `Hashtags` module | Check GC Hashtags components |
| `HashtagTimeline.svelte` | `Timeline` with hashtag filter | Use TimelineVirtualizedReactive with filters |
| `UserCard.svelte` | `Profile` module | Check Profile components |
| `UserList.svelte` | `Profile` module | Check Profile.FollowersList/FollowingList |
| `UserTimeline.svelte` | `Profile.Timeline` | Part of Profile module |
| `ListCard.svelte` | `Lists` module | Part of Lists compound component |
| `InstanceInfo.svelte` | Custom | App-specific, keep for now |
| `ActionButton.svelte` | `ActionBar` or `Button` | Check if ActionBar covers or use Button primitive |
| `RegistrationForm.svelte` | `Auth.RegisterForm` | Part of Auth module |

## Migration Strategy

### Phase 1: Setup (Day 1)
1. Configure CSS imports for GC
2. Set up Vite optimizeDeps for GC packages
3. Create import aliases if needed
4. Test basic GC component imports

### Phase 2: Core Components (Days 2-3)
1. Replace `Timeline.svelte` → `TimelineVirtualizedReactive`
2. Replace `ComposeBox.svelte` → `ComposeBox`
3. Replace `StatusCard.svelte` → `StatusCard`
4. Replace `NotificationList.svelte` → `NotificationsFeedReactive`
5. Test each replacement thoroughly

### Phase 3: Primitives (Day 4)
1. Replace `Button.svelte` → GC `Button`
2. Replace `ThemeToggle.svelte` → GC `ThemeSwitcher`
3. Update all primitive usages across app

### Phase 4: Modules (Days 5-6)
1. Replace Auth components → GC `Auth.*`
2. Replace Search components → GC `Search.*`
3. Replace Lists components → GC `Lists.*`
4. Replace Profile components → GC `Profile.*`

### Phase 5: Cleanup (Day 7)
1. Delete replaced custom components
2. Update imports throughout codebase
3. Remove unused dependencies
4. Update tests

## Issues to Report to GC Maintainer

Track any issues, missing features, or bugs found during migration:

### 🐛 Bugs
- [ ] (To be filled as issues are discovered)

### ✨ Feature Requests
- [ ] (To be filled as needs are discovered)

### 📝 Documentation Improvements
- [ ] (To be filled as clarity issues are found)

### 🔧 API Improvements
- [ ] (To be filled as API issues are found)

## Testing Checklist

For each replaced component:
- [ ] Visual appearance matches or improves
- [ ] Functionality works identically
- [ ] Accessibility maintained/improved
- [ ] Performance maintained/improved
- [ ] TypeScript types work correctly
- [ ] Props/events compatible or better
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Theme compatibility

## Notes

- GC provides both deprecated simple components (ComposeBox, StatusCard) and new compound components (Compose.*, Status.*) - evaluate which to use
- Many custom components can be fully removed, not just replaced
- Some components like AuthGuard, Navigation, OfflineIndicator are app-specific and should remain custom
- Always prefer GC over custom when functionality matches
- Document any missing features in GC for upstream contribution

