/// <reference types="astro/client" />

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    options?: { expiration?: number; expirationTtl?: number }
  ): Promise<void>
  delete(key: string): Promise<void>
}

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        SESSIONS: KVNamespace
        AUTH_TOKENS?: KVNamespace
        OAUTH_APPS?: KVNamespace
        SESSION_SECRETS?: KVNamespace
        [key: string]: unknown
      }
    }
  }
}

