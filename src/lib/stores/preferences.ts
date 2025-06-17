/**
 * UI preferences and settings using Nanostores
 * Persisted to localStorage
 */

import { persistentAtom, persistentMap } from '@nanostores/persistent';
import { computed } from 'nanostores';

// Theme preference
export type Theme = 'light' | 'dark' | 'auto' | 'high-contrast';
export const theme$ = persistentAtom<Theme>('theme', 'auto');

// Layout preference
export type Layout = 'single' | 'multi' | 'focus';
export const layout$ = persistentAtom<Layout>('layout', 'single');

// Timeline preferences
export const timelinePrefs$ = persistentAtom<{
  autoRefresh: boolean;
  showReplies: boolean;
  showBoosts: boolean;
  mediaPreview: 'show' | 'hide' | 'blur';
  fontSize: 'small' | 'medium' | 'large';
}>('timeline-prefs', {
  autoRefresh: true,
  showReplies: true,
  showBoosts: true,
  mediaPreview: 'show',
  fontSize: 'medium'
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// Compose preferences
export const composePrefs$ = persistentAtom<{
  defaultVisibility: 'public' | 'unlisted' | 'private' | 'direct';
  defaultSensitive: boolean;
  defaultLanguage: string | null;
  saveDrafts: boolean;
  showPreview: boolean;
}>('compose-prefs', {
  defaultVisibility: 'public',
  defaultSensitive: false,
  defaultLanguage: null,
  saveDrafts: true,
  showPreview: true
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// Notification preferences
export const notificationPrefs$ = persistentAtom<{
  desktop: boolean;
  sounds: boolean;
  filterFollows: boolean;
  filterBoosts: boolean;
  filterFavorites: boolean;
  filterMentions: boolean;
  filterPolls: boolean;
}>('notification-prefs', {
  desktop: false,
  sounds: false,
  filterFollows: false,
  filterBoosts: false,
  filterFavorites: false,
  filterMentions: false,
  filterPolls: false
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// Accessibility preferences
export const a11yPrefs$ = persistentAtom<{
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  showCaptions: boolean;
  keyboardShortcuts: boolean;
}>('a11y-prefs', {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  showCaptions: true,
  keyboardShortcuts: true
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// Computed values
export const effectiveTheme$ = computed([theme$], (theme) => {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
});

export const shouldReduceMotion$ = computed([a11yPrefs$], (prefs) => {
  return prefs.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

// Helper functions
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    root.dataset.theme = theme;
  }
}

export function applyLayout(layout: Layout): void {
  document.documentElement.dataset.layout = layout;
}

export function applyFontSize(size: 'small' | 'medium' | 'large'): void {
  const root = document.documentElement;
  switch (size) {
    case 'small':
      root.style.fontSize = '14px';
      break;
    case 'medium':
      root.style.fontSize = '16px';
      break;
    case 'large':
      root.style.fontSize = '18px';
      break;
  }
}

// Subscribe to changes and apply them
theme$.subscribe(applyTheme);
layout$.subscribe(applyLayout);
timelinePrefs$.subscribe((prefs) => {
  if (prefs.fontSize) {
    applyFontSize(prefs.fontSize);
  }
});

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme$.get() === 'auto') {
      applyTheme('auto');
    }
  });
  
  // Apply initial values
  applyTheme(theme$.get());
  applyLayout(layout$.get());
  applyFontSize(timelinePrefs$.get().fontSize);
}