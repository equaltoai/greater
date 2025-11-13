# Migration Status - Greater to Greater Components

**Started:** 2025-11-11  
**GC Version:** v1.0.27

---

## 📊 Overview

Migrating from custom components to @equaltoai/greater-components to leverage the comprehensive fediverse UI toolkit.

**Strategy:** Incremental migration with bridge/adapter pattern for backward compatibility.

---

## ✅ Completed

### Phase 1: Setup & Configuration
- [x] Configure CSS imports (theme.css, primitives.css, fediverse.css)
- [x] Set up Vite optimizeDeps for GC packages
- [x] Add SSR noExternal configuration
- [x] Create centralized GC import helper (`src/lib/gc.ts`)
- [x] Audit all 50+ custom components and create replacement matrix

### Documentation
- [x] Create `COMPONENT_AUDIT.md` - comprehensive mapping of custom → GC components
- [x] Create `GREATER_COMPONENTS_MIGRATION.md` - full migration guide
- [x] Create `GC_ISSUES.md` - track issues/questions for GC maintainer

---

## 🔄 In Progress

### Phase 2: Core Components

#### TimelineGC Component (NEW)
- [x] Create bridge component `TimelineGC.svelte`
- [x] Connect custom timelineStore to GC TimelineVirtualizedReactive
- [ ] Test TimelineGC with different timeline types (home, local, federated)
- [ ] Verify Status type compatibility
- [ ] Implement action handlers (favorite, boost, reply, etc.)
- [ ] Add error handling
- [ ] Add loading states

**Blockers:**
- Need to verify Status type compatibility between Mastodon API and GC
- Need clarification on action handlers pattern from GC docs
- Real-time indicator integration unclear

---

## ⏸️ Blocked

### Timeline Migration
**Status:** Partially complete (bridge created, needs testing)  
**Blocker:** Awaiting feedback on:
1. Status type compatibility
2. Action handlers pattern
3. Real-time integration best practices

### ComposeBox Migration  
**Status:** Not started  
**Blocker:** Need clarification on auth token provision pattern

### StatusCard Migration
**Status:** Not started  
**Blocker:** Need complete prop documentation

---

## 📋 Pending

### Phase 2: Core Components (Continued)
- [ ] Replace `ComposeBox.svelte` → GC `ComposeBox`
- [ ] Replace `StatusCard.svelte` → GC `StatusCard`
- [ ] Replace `NotificationList.svelte` → GC `NotificationsFeedReactive`
- [ ] Replace `ProfileHeader.svelte` → GC `ProfileHeader`

### Phase 3: Primitives
- [x] `Button.svelte` - Already shimmed to GC
- [ ] Replace `ThemeToggle.svelte` → GC `ThemeSwitcher`
- [ ] Verify all primitive usages

### Phase 4: Modules
- [ ] Auth components → GC `Auth.*`
- [ ] Search components → GC `Search.*`
- [ ] Lists components → GC `Lists.*`
- [ ] Profile components → GC `Profile.*`

### Phase 5: Cleanup
- [ ] Delete replaced custom components
- [ ] Update all imports
- [ ] Remove unused dependencies
- [ ] Update tests

---

## 🐛 Issues Discovered

See `GC_ISSUES.md` for complete list. Key issues:

1. **Timeline Integration Documentation** (HIGH) - Need docs on TimelineIntegrationConfig
2. **Auth Token Provider Pattern** (MEDIUM) - How to provide auth tokens to components?
3. **StatusCard Props** (MEDIUM) - Need complete prop documentation

---

## 📊 Metrics

| Category | Total | Migrated | Remaining | % Complete |
|----------|-------|----------|-----------|------------|
| **Core Components** | 7 | 0 | 7 | 0% |
| **Primitives** | 10 | 1 | 9 | 10% |
| **Modules** | 20+ | 0 | 20+ | 0% |
| **Setup** | 5 | 5 | 0 | 100% |
| **Overall** | 42+ | 6 | 36+ | 14% |

---

## 🎯 Next Steps

### Immediate (This Session)
1. ✅ Create bridge component for Timeline
2. → Test TimelineGC in dev environment
3. → Update routes to use TimelineGC
4. → Document any type compatibility issues

### Short Term (Next Session)
1. Implement action handlers for StatusCard
2. Create ComposeBoxGC bridge component
3. Test end-to-end post creation
4. Gather feedback for GC maintainer

### Medium Term
1. Replace all core components with GC versions
2. Migrate auth to GC Auth module
3. Replace all primitives
4. Delete custom implementations

---

## 💬 Questions for GC Maintainer

See `GC_ISSUES.md` for full list. Priority questions:

1. **Store Integration:** What's the recommended pattern for integrating existing app stores with GC components?

2. **Auth Strategy:** Should we migrate to GC's Auth module completely, or can we integrate our existing auth?

3. **GraphQL Client:** How should we structure GraphQL client initialization for use across all GC components?

---

## 📝 Notes

### Design Decisions

**Bridge Pattern:**
- Created `TimelineGC.svelte` as an adapter between custom store and GC component
- Allows incremental migration without breaking existing functionality
- Can gradually replace bridge with direct GC integration

**Import Strategy:**
- Centralized GC imports in `src/lib/gc.ts`
- Easier to manage and update imports
- Single source of truth for GC components

**Testing Approach:**
- Test each component individually before replacing
- Keep old components until GC version is verified
- Use feature flags if needed for gradual rollout

### Lessons Learned

1. **Type Compatibility:** Need to verify type compatibility between Mastodon API and GC at each integration point
2. **Documentation Gaps:** GC is powerful but needs more migration/integration documentation
3. **Adapter Pattern Works:** Bridge components are effective for incremental migration
4. **Early Feedback:** Document questions/issues early for GC maintainer

---

## 🤝 Contributing Back

As we discover issues and create documentation, we'll contribute back to GC:

- [ ] Documentation improvements for migration guide
- [ ] Examples for store integration patterns
- [ ] Type adapters for common API formats
- [ ] Testing utilities for GC components

---

**Last Updated:** 2025-11-11  
**Next Review:** After testing TimelineGC component

