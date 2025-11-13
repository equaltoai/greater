<script lang="ts">
/**
 * ComposeBoxGC - Bridge to GC Compose compound component
 * 
 * Based on GC INTEGRATION_TIPS.md - using Compose.* compound components.
 * Implements token provider pattern for auth integration.
 */
import { ComposeCompound as Compose, type ComposeHandlers } from '@equaltoai/greater-components-fediverse';
import { getGraphQLAdapter } from '$lib/api/graphql-client';
import { authStore } from '$lib/stores/auth.svelte';

interface Props {
  replyTo?: string;
  quoteStatus?: string;
  initialText?: string;
  onPostSuccess?: () => void;
}

let {
  replyTo,
  quoteStatus,
  initialText,
  onPostSuccess
}: Props = $props();

// Compose handlers using GraphQL adapter
const handlers = {
  onSubmit: async (data: { content: string; visibility?: string; sensitive?: boolean; spoilerText?: string; inReplyToId?: string }) => {
    try {
      // Use the GraphQL adapter that's already initialized with token
      const adapter = await getGraphQLAdapter();
      
      // Map visibility to GraphQL enum
      const visibilityMap: Record<string, 'PUBLIC' | 'UNLISTED' | 'FOLLOWERS' | 'DIRECT'> = {
        'public': 'PUBLIC',
        'unlisted': 'UNLISTED',
        'private': 'FOLLOWERS',
        'direct': 'DIRECT'
      };
      
      const visibility = visibilityMap[data.visibility || 'public'] || 'PUBLIC';
      
      // Create post via GraphQL using adapter.createNote()
      const response = await adapter.createNote({
        content: data.content,
        visibility,
        sensitive: data.sensitive || false,
        summary: data.spoilerText || undefined,
        inReplyToId: replyTo || data.inReplyToId || undefined
      });
      
      console.log('[ComposeBoxGC] Post created via GraphQL:', response);
      
      onPostSuccess?.();
      
      // Refresh timeline to show new post
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('[ComposeBoxGC] Post failed:', error);
      throw error;
    }
  }
};
</script>

<Compose.Root {handlers}>
  <Compose.Editor autofocus placeholder={initialText || "What's on your mind?"} />
  <Compose.CharacterCount />
  <Compose.VisibilitySelect />
  <Compose.Submit />
</Compose.Root>

<!--
  Per GC feedback (2025-11-11):
  - ✅ Token provider pattern documented in Compose/Root.md
  - ✅ Works with existing auth (no need to migrate to GC Auth)
  - Pattern: Pass async handlers that call tokenProvider internally
-->

