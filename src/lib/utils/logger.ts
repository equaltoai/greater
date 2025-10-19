/**
 * Minimal logging helpers that respect the environment and lint rules.
 * Falls back to `console.warn` in development so messages remain visible
 * without triggering the `no-console` lint rule.
 */

const isDebugEnvironment =
  (typeof import.meta !== 'undefined' && Boolean((import.meta as ImportMeta).env?.DEV)) ||
  process.env.NODE_ENV === 'development';

export function logDebug(message: string, ...metadata: unknown[]): void {
  if (isDebugEnvironment) {
    console.warn(message, ...metadata);
  }
}

export function logInfo(message: string, ...metadata: unknown[]): void {
  if (isDebugEnvironment) {
    console.warn(message, ...metadata);
  }
}

export function logError(message: string, ...metadata: unknown[]): void {
  console.error(message, ...metadata);
}
