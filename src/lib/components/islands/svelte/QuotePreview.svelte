<script lang="ts">
  import { onMount } from 'svelte';
  import type { Status } from '$lib/types/mastodon';
  import type { Account } from '$lib/types/auth';
  import { authStore } from '$lib/stores/auth.svelte';
import { getGraphQLAdapter } from '$lib/api/graphql-client';
import { mapGraphQLActorToAccount } from '$lib/api/account-service';
import { mapGraphQLMediaToAttachment } from '$lib/mappers/media';
import { resolveBookmarkedFlag, resolveFavouritedFlag, resolveRebloggedFlag } from '$lib/utils/interactions';
import StatusSkeleton from './StatusSkeleton.svelte';

  interface Props {
    quoteId: string;
    quoteUrl?: string | null;
    author?: Account | null;
  }

const { quoteId, quoteUrl = null, author = null }: Props = $props();

class QuotePreviewCache {
  private static instance: QuotePreviewCache;
  private cache = new Map<string, Status>();

  static getInstance() {
    if (!QuotePreviewCache.instance) {
      QuotePreviewCache.instance = new QuotePreviewCache();
    }
    return QuotePreviewCache.instance;
  }

  get(id: string) {
    return this.cache.get(id);
  }

  set(id: string, status: Status) {
    this.cache.set(id, status);
  }
}

const quoteCache = QuotePreviewCache.getInstance();

let quoteStatus = $state<Status | null>(null);
let isLoading = $state(true);
let error = $state<string | null>(null);

  onMount(async () => {
    authStore.initialize();

    if (!quoteId) {
      error = 'Missing quote reference';
      isLoading = false;
      return;
    }

    const cached = quoteCache.get(quoteId);
    if (cached) {
      quoteStatus = cached;
      isLoading = false;
      return;
    }

    try {
      const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
      const graphObject = await adapter.getObject(quoteId);
      const status = mapGraphQLObjectToStatus(graphObject);
      quoteStatus = status;
      quoteCache.set(quoteId, status);
    } catch (err) {
      console.error('[QuotePreview] Failed to fetch quote:', err);
      error = err instanceof Error ? err.message : 'Unable to load quoted post';
    } finally {
      isLoading = false;
    }
  });

  function resolveLink() {
    if (quoteStatus?.url) return quoteStatus.url;
    if (quoteUrl) {
      return quoteUrl.startsWith('http') ? quoteUrl : `/status/${quoteUrl}`;
    }
    return `/status/${quoteId}`;
  }

  function formatAccount(acc: Account | null | undefined) {
    if (!acc) return 'Unknown';
    return acc.display_name || acc.username || acc.acct || 'Unknown';
  }

  function mapGraphQLObjectToStatus(obj: any): Status {
    const node = obj?.object ?? obj;
    const actor = node?.actor ?? node?.attributedTo;

    return {
      id: node?.id,
      uri: node?.id,
      url: node?.url ?? node?.id ?? null,
      created_at: node?.published ?? node?.createdAt ?? new Date().toISOString(),
      account: actor ? mapGraphQLActorToAccount(actor) : ({} as Account),
      content: node?.content ?? '',
      visibility: (node?.visibility?.toLowerCase() || 'public') as any,
      sensitive: node?.sensitive ?? false,
      spoiler_text: node?.summary ?? node?.spoilerText ?? '',
      media_attachments: (node?.attachments ?? []).map(mapGraphQLMediaToAttachment),
      mentions: [],
      tags: [],
      emojis: [],
      reblogs_count: node?.shares?.totalCount ?? node?.sharesCount ?? 0,
      favourites_count: node?.likes?.totalCount ?? node?.likesCount ?? 0,
      replies_count: node?.replies?.totalCount ?? node?.repliesCount ?? 0,
      reblogged: resolveRebloggedFlag(node),
      favourited: resolveFavouritedFlag(node),
      bookmarked: resolveBookmarkedFlag(node),
      pinned: false,
      reblog: null,
      in_reply_to_id: node?.inReplyTo?.id ?? null,
      in_reply_to_account_id: null,
      application: null,
      language: node?.language ?? null,
      muted: false,
      poll: null,
      card: null,
      edited_at: node?.updated ?? null,
      quote_id: node?.quoteUrl ?? null,
      quote_url: node?.quoteUrl ?? null,
      quote_context: null,
    };
  }
</script>

<div class="quote-preview">
  {#if isLoading}
    <div class="quote-loading">
      <StatusSkeleton count={1} />
    </div>
  {:else if error}
    <div class="quote-error">
      <p>{error}</p>
      <a href={resolveLink()} target="_blank" rel="noreferrer">Open original</a>
    </div>
  {:else if quoteStatus}
    <div class="quote-content" role="note" aria-label="Quoted post">
      <div class="quote-author">
        <span class="name">{quoteStatus.account.display_name || quoteStatus.account.username}</span>
        <span class="handle">@{quoteStatus.account.acct}</span>
      </div>
      <div class="quote-text" tabindex="0">
        {@html quoteStatus.content}
      </div>
      <a class="quote-link" href={resolveLink()}>View original</a>
    </div>
  {:else}
    <div class="quote-content" role="note" aria-label="Quoted post">
      <div class="quote-author">
        <span class="name">{formatAccount(author)}</span>
        <span class="handle">{quoteId}</span>
      </div>
      <a class="quote-link" href={resolveLink()}>View original</a>
    </div>
  {/if}
</div>

<style>
  .quote-preview {
    border: 1px solid var(--border, rgba(0,0,0,0.1));
    border-radius: 12px;
    padding: 0.75rem;
    background: var(--surface-muted, #f8f8f8);
  }

  :global(.dark) .quote-preview {
    border-color: rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
  }

  .quote-author {
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    gap: 0.4rem;
  }

  .quote-author .handle {
    color: var(--text-muted, #6b7280);
    font-weight: 400;
  }

  .quote-text {
    margin-top: 0.4rem;
    font-size: 0.9rem;
    color: var(--text, #111827);
  }

  :global(.dark) .quote-text {
    color: rgba(255,255,255,0.88);
  }

  .quote-link {
    margin-top: 0.5rem;
    display: inline-flex;
    font-size: 0.85rem;
    color: var(--accent, #6366f1);
  }

  .quote-error {
    font-size: 0.85rem;
    color: var(--text-muted, #6b7280);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
</style>
