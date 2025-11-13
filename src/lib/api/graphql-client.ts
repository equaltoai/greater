/**
 * GraphQL Client for Lesser Integration
 * 
 * Central module that instantiates and exports the LesserGraphQLAdapter
 * for use across the application. Integrates with the secure auth client
 * for token management.
 */

import {
  createLesserGraphQLAdapter,
  type LesserGraphQLAdapter,
  type LesserGraphQLAdapterConfig,
  type UploadMediaInput,
  type UploadMediaPayload,
  type MediaCategory,
} from '@equaltoai/greater-components/adapters';
import { secureAuthClient } from '$lib/auth/secure-client';
import { authStore } from '$lib/stores/auth.svelte';
import { logDebug } from '$lib/utils/logger';
import { ensureGraphQLWebSocketCompatibility } from './graphql-ws-patch';

type GraphQLEndpoints = { http: string; ws: string };

declare global {
  interface Window {
    __GRAPHQL_ENDPOINTS__?: GraphQLEndpoints;
  }
}

// GraphQL endpoint configuration
// These can be overridden via environment variables in production
const DEFAULT_HTTP_ENDPOINT = 'https://dev.lesser.host/api/graphql';
const DEFAULT_WS_ENDPOINT = 'wss://graphql-ws.dev.lesser.host';

/**
 * Get GraphQL endpoints from environment or defaults
 */
function getGraphQLEndpoints(): GraphQLEndpoints {
  if (typeof window !== 'undefined' && window.__GRAPHQL_ENDPOINTS__) {
    return window.__GRAPHQL_ENDPOINTS__;
  }
  
  return {
    http: DEFAULT_HTTP_ENDPOINT,
    ws: DEFAULT_WS_ENDPOINT,
  };
}

/**
 * GraphQL client singleton
 */
let graphqlAdapter: LesserGraphQLAdapter | null = null;
let currentInstance: string | null = null;
let currentToken: string | null = null;

/**
 * Initialize or get the GraphQL adapter
 * 
 * This function creates a new adapter when the instance or token changes,
 * and reuses the existing one otherwise.
 */
export async function getGraphQLAdapter(instance?: string): Promise<LesserGraphQLAdapter> {
  ensureGraphQLWebSocketCompatibility();

  // Ensure authStore is initialized before accessing it
  if (typeof window !== 'undefined') {
    authStore.initialize();
  }

  // Get current auth state - use authStore instead of localStorage directly
  const authInstance = instance || (typeof window !== 'undefined' ? authStore.currentInstance : null);
  
  if (!authInstance) {
    logDebug('[GraphQL Client] No instance available:', {
      providedInstance: instance,
      authStoreInstance: typeof window !== 'undefined' ? authStore.currentInstance : null,
      isAuthenticated: typeof window !== 'undefined' ? authStore.isAuthenticated : false,
    });
    throw new Error('[GraphQL Client] Cannot create adapter without instance. Please ensure you are logged in.');
  }
  
  const token = await secureAuthClient.getToken(authInstance);
  const tokenString = token?.access_token || null;

  // CRITICAL: GraphQL adapter requires a token for WebSocket subscriptions
  // Don't create adapter if we don't have authentication
  if (!tokenString) {
    logDebug('[GraphQL Client] No token available:', {
      instance: authInstance,
      hasToken: Boolean(token),
      tokenKeys: token ? Object.keys(token) : [],
    });
    throw new Error('[GraphQL Client] Cannot create adapter without authentication token');
  }

  // Check if we need to create a new adapter
  const needsNewAdapter = 
    !graphqlAdapter ||
    currentInstance !== authInstance ||
    currentToken !== tokenString;

  if (needsNewAdapter) {
    // Close existing adapter if any
    if (graphqlAdapter) {
      await closeGraphQLAdapter();
    }

    // Get endpoints - these should be instance-specific in production
    const endpoints = getGraphQLEndpoints();
    
    // Build instance-specific endpoints if we have an instance
    // Note: authInstance already includes the protocol (https://)
    const httpEndpoint = authInstance 
      ? `${authInstance}/api/graphql`
      : endpoints.http;
    
    // WebSocket uses graphql-ws subdomain for Lesser instances
    const wsEndpoint = authInstance
      ? `wss://graphql-ws.${authInstance.replace('https://', '')}`
      : endpoints.ws;

    const config: LesserGraphQLAdapterConfig = {
      httpEndpoint,
      wsEndpoint,
      token: tokenString,
      debug: import.meta.env.DEV,
      enableRetry: true,
      maxRetries: 3,
      connectionTimeout: 10000,
    };

    logDebug('[GraphQL Client] Creating new adapter:', {
      instance: authInstance,
      httpEndpoint,
      wsEndpoint,
      hasToken: Boolean(tokenString),
    });

    graphqlAdapter = createLesserGraphQLAdapter(config);
    currentInstance = authInstance;
    currentToken = tokenString;
  }

  if (!graphqlAdapter) {
    throw new Error('GraphQL adapter failed to initialise');
  }

  return graphqlAdapter;
}

/**
 * Update the GraphQL adapter's authentication token
 * 
 * This should be called when the user's token changes (e.g., after refresh)
 */
export async function updateGraphQLToken(instance: string): Promise<void> {
  const token = await secureAuthClient.getToken(instance);
  const tokenString = token?.access_token || null;

  if (graphqlAdapter && currentInstance === instance) {
    graphqlAdapter.updateToken(tokenString);
    currentToken = tokenString;
    logDebug('[GraphQL Client] Updated token for instance:', instance);
  } else {
    // Force recreation on next getGraphQLAdapter call
    currentToken = null;
  }
}

/**
 * Close the GraphQL adapter and cleanup resources
 * 
 * This should be called when logging out or switching instances
 */
export async function closeGraphQLAdapter(): Promise<void> {
  if (graphqlAdapter) {
    logDebug('[GraphQL Client] Closing adapter for instance:', currentInstance);
    await graphqlAdapter.close();
    graphqlAdapter = null;
    currentInstance = null;
    currentToken = null;
  }
}

/**
 * Get the current GraphQL adapter instance (if any)
 * 
 * Returns null if no adapter has been initialized yet
 */
export function getCurrentAdapter(): LesserGraphQLAdapter | null {
  return graphqlAdapter;
}

/**
 * Check if the GraphQL adapter is initialized
 */
export function isGraphQLAdapterInitialized(): boolean {
  return graphqlAdapter !== null;
}

export interface UploadMediaParams {
  file: Blob;
  filename?: string;
  description?: string;
  focus?: { x: number; y: number };
  sensitive?: boolean;
  spoilerText?: string | null;
  mediaType?: MediaCategory | null;
  instance?: string;
}

/**
 * Upload media via the Lesser GraphQL adapter.
 * Handles default filename derivation and spoiler text normalization.
 */
export async function uploadMediaAsset(params: UploadMediaParams): Promise<UploadMediaPayload> {
  const { instance, ...rest } = params;
  const adapter = await getGraphQLAdapter(instance);

  const spoiler =
    typeof rest.spoilerText === 'string' && rest.spoilerText.trim().length > 0
      ? rest.spoilerText
      : null;

  const normalizedInput: UploadMediaInput = {
    file: rest.file,
    filename:
      rest.filename ??
      (typeof File !== 'undefined' && rest.file instanceof File ? rest.file.name : undefined),
    description: rest.description ?? undefined,
    focus: rest.focus ?? undefined,
    sensitive: rest.sensitive ?? false,
    spoilerText: spoiler,
    mediaType: rest.mediaType ?? null,
  };

  // Use type assertion to handle readonly arrays and missing properties from GraphQL
  const result = await adapter.uploadMedia(normalizedInput);
  return result as UploadMediaPayload;
}

/**
 * Fetch hashtag timeline
 * Wrapper for Lesser's hashtagTimeline query
 */
export async function fetchHashtagTimeline(
  hashtag: string,
  options?: { first?: number; after?: string }
) {
  const adapter = await getGraphQLAdapter();
  return adapter.fetchHashtagTimeline(hashtag, {
    first: options?.first ?? 20,
    after: options?.after,
  });
}

/**
 * Fetch thread context (ancestors and descendants)
 * Wrapper for Lesser's threadContext query
 */
export async function fetchThreadContext(noteId: string) {
  const adapter = await getGraphQLAdapter();
  return adapter.getThreadContext(noteId);
}

// Export types for convenience
export type {
  LesserGraphQLAdapter,
  MediaCategory,
  UploadMediaPayload,
} from '@equaltoai/greater-components/adapters';
