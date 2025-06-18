import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';
import type { ThemeColors, HarmonyType } from '../theme/color-harmonics';
import { ColorHarmonics } from '../theme/color-harmonics';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'default' | 'high-contrast' | 'custom';
export type { HarmonyType } from '../theme/color-harmonics';

export interface CustomTheme {
  id: string;
  name: string;
  seedColor: string;
  harmonyType: HarmonyType;
  isDark: boolean;
  colors: ThemeColors;
  createdAt: number;
}

export interface ThemeState {
  mode: ThemeMode;
  preset: ThemePreset;
  customThemes: CustomTheme[];
  activeCustomThemeId?: string;
}

// Default themes
const LIGHT_THEME: ThemeColors = {
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark: '#1d4ed8',
  accent1: '#8b5cf6',
  accent2: '#ec4899',
  background: '#ffffff',
  backgroundAlt: '#fafafa',
  surface: '#f3f4f6',
  surfaceHover: '#e5e7eb',
  border: '#d1d5db',
  borderHover: '#9ca3af',
  text: '#111827',
  textMuted: '#6b7280',
  textInverse: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  boost: '#8b5cf6',
  favorite: '#ec4899'
};

const DARK_THEME: ThemeColors = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  accent1: '#a78bfa',
  accent2: '#f472b6',
  background: '#0f0f0f',
  backgroundAlt: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceHover: '#262626',
  border: '#333333',
  borderHover: '#4d4d4d',
  text: '#f3f4f6',
  textMuted: '#9ca3af',
  textInverse: '#111827',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  boost: '#a78bfa',
  favorite: '#f472b6'
};

const HIGH_CONTRAST_LIGHT: ThemeColors = {
  primary: '#0000ff',
  primaryLight: '#3333ff',
  primaryDark: '#000099',
  accent1: '#ff00ff',
  accent2: '#ff0000',
  background: '#ffffff',
  backgroundAlt: '#f0f0f0',
  surface: '#e0e0e0',
  surfaceHover: '#d0d0d0',
  border: '#000000',
  borderHover: '#333333',
  text: '#000000',
  textMuted: '#333333',
  textInverse: '#ffffff',
  success: '#008000',
  warning: '#ff8c00',
  error: '#ff0000',
  info: '#0000ff',
  boost: '#ff00ff',
  favorite: '#ff0000'
};

const HIGH_CONTRAST_DARK: ThemeColors = {
  primary: '#00ffff',
  primaryLight: '#66ffff',
  primaryDark: '#00cccc',
  accent1: '#ffff00',
  accent2: '#ff00ff',
  background: '#000000',
  backgroundAlt: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceHover: '#2a2a2a',
  border: '#ffffff',
  borderHover: '#cccccc',
  text: '#ffffff',
  textMuted: '#cccccc',
  textInverse: '#000000',
  success: '#00ff00',
  warning: '#ffaa00',
  error: '#ff3333',
  info: '#00ccff',
  boost: '#ffff00',
  favorite: '#ff00ff'
};

// Theme state atom
export const themeState = persistentAtom<ThemeState>('theme-state', {
  mode: 'system',
  preset: 'default',
  customThemes: [],
  activeCustomThemeId: undefined
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// System theme detection
const systemTheme = atom<'light' | 'dark'>('light');

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemTheme.set(mediaQuery.matches ? 'dark' : 'light');
  
  mediaQuery.addEventListener('change', (e) => {
    systemTheme.set(e.matches ? 'dark' : 'light');
  });
}

// Computed theme colors
export const currentTheme = computed([themeState, systemTheme], (state, system) => {
  const isDark = state.mode === 'dark' || (state.mode === 'system' && system === 'dark');
  
  // If custom theme is active
  if (state.preset === 'custom' && state.activeCustomThemeId) {
    const customTheme = state.customThemes.find(t => t.id === state.activeCustomThemeId);
    if (customTheme) {
      return customTheme.colors;
    }
  }
  
  // High contrast themes
  if (state.preset === 'high-contrast') {
    return isDark ? HIGH_CONTRAST_DARK : HIGH_CONTRAST_LIGHT;
  }
  
  // Default themes
  return isDark ? DARK_THEME : LIGHT_THEME;
});

// Theme actions
export function setThemeMode(mode: ThemeMode) {
  themeState.set({ ...themeState.get(), mode });
}

export function setThemePreset(preset: ThemePreset) {
  themeState.set({ ...themeState.get(), preset });
}

export function createCustomTheme(
  name: string,
  seedColor: string,
  harmonyType: HarmonyType,
  isDark?: boolean
): CustomTheme {
  const state = themeState.get();
  const actualIsDark = isDark ?? (state.mode === 'dark' || (state.mode === 'system' && systemTheme.get() === 'dark'));
  
  const theme: CustomTheme = {
    id: Date.now().toString(),
    name,
    seedColor,
    harmonyType,
    isDark: actualIsDark,
    colors: ColorHarmonics.generateTheme(seedColor, harmonyType, actualIsDark),
    createdAt: Date.now()
  };
  
  themeState.set({
    ...state,
    customThemes: [...state.customThemes, theme],
    activeCustomThemeId: theme.id,
    preset: 'custom'
  });
  
  return theme;
}

export function deleteCustomTheme(id: string) {
  const state = themeState.get();
  themeState.set({
    ...state,
    customThemes: state.customThemes.filter(t => t.id !== id),
    activeCustomThemeId: state.activeCustomThemeId === id ? undefined : state.activeCustomThemeId,
    preset: state.activeCustomThemeId === id ? 'default' : state.preset
  });
}

export function setActiveCustomTheme(id: string) {
  themeState.set({
    ...themeState.get(),
    activeCustomThemeId: id,
    preset: 'custom'
  });
}

export function applyTheme(colors: ThemeColors) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Set CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--color-${key}`, value);
    }
  });
  
  // Additional derived colors
  root.style.setProperty('--color-shadow', colors.text + '20');
  root.style.setProperty('--color-overlay', colors.background + 'cc');
}

// Auto-apply theme on changes
if (typeof window !== 'undefined') {
  currentTheme.subscribe(colors => {
    applyTheme(colors);
  });
}