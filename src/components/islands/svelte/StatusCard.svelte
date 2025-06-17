<script lang="ts">
	import type { Status } from '@/types/mastodon';
	import { sanitizeMastodonHtml } from '@/lib/utils/sanitize';
	import { useTimelineStore } from '@/lib/stores/timeline';
	import { useAuthStore } from '@/lib/stores/auth';
	
	interface Props {
		status: Status;
		showThread?: boolean;
	}
	
	let { status, showThread = false }: Props = $props();
	
	const timelineStore = useTimelineStore();
	const authStore = useAuthStore();
	
	const displayStatus = $derived(status.reblog || status);
	const isReblog = $derived(!!status.reblog);
	
	const relativeTime = $derived.by(() => {
		const date = new Date(displayStatus.created_at);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
		
		if (seconds < 60) return `${seconds}s`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
		if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
		
		return date.toLocaleDateString();
	});
	
	const visibilityIcon = $derived.by(() => {
		switch (displayStatus.visibility) {
			case 'public': return '🌐';
			case 'unlisted': return '🔓';
			case 'private': return '🔒';
			case 'direct': return '✉️';
			default: return '';
		}
	});
	
	let isInteracting = $state(false);
	
	async function handleFavorite() {
		if (isInteracting || !authStore.currentAccount) return;
		isInteracting = true;
		
		try {
			if (displayStatus.favourited) {
				await timelineStore.unfavoriteStatus(displayStatus.id);
			} else {
				await timelineStore.favoriteStatus(displayStatus.id);
			}
		} finally {
			isInteracting = false;
		}
	}
	
	async function handleReblog() {
		if (isInteracting || !authStore.currentAccount) return;
		isInteracting = true;
		
		try {
			if (displayStatus.reblogged) {
				await timelineStore.unreblogStatus(displayStatus.id);
			} else {
				await timelineStore.reblogStatus(displayStatus.id);
			}
		} finally {
			isInteracting = false;
		}
	}
	
	async function handleBookmark() {
		if (isInteracting || !authStore.currentAccount) return;
		isInteracting = true;
		
		try {
			if (displayStatus.bookmarked) {
				await timelineStore.unbookmarkStatus(displayStatus.id);
			} else {
				await timelineStore.bookmarkStatus(displayStatus.id);
			}
		} finally {
			isInteracting = false;
		}
	}
	
	function handleReply() {
		// TODO: Open compose modal with reply context
		console.log('Reply to:', displayStatus.id);
	}
	
	function handleShare() {
		if (navigator.share) {
			navigator.share({
				title: `Post by ${displayStatus.account.display_name || displayStatus.account.username}`,
				text: displayStatus.content.replace(/<[^>]*>/g, ''),
				url: displayStatus.url || displayStatus.uri
			});
		} else {
			navigator.clipboard.writeText(displayStatus.url || displayStatus.uri);
		}
	}
</script>

<article class="card p-4 space-y-3">
	{#if isReblog}
		<div class="flex items-center gap-2 text-sm text-text-secondary">
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
			</svg>
			<span>{status.account.display_name || status.account.username} boosted</span>
		</div>
	{/if}
	
	{#if showThread && displayStatus.in_reply_to_id}
		<div class="flex items-center gap-2 text-sm text-text-secondary">
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
			</svg>
			<span>Replying to thread</span>
		</div>
	{/if}
	
	<div class="flex items-start gap-3">
		<a href={`/@${displayStatus.account.acct}`} class="flex-shrink-0">
			<img
				src={displayStatus.account.avatar}
				alt={displayStatus.account.display_name || displayStatus.account.username}
				class="w-12 h-12 rounded-full object-cover"
				loading="lazy"
			/>
		</a>
		
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 flex-wrap">
				<a href={`/@${displayStatus.account.acct}`} class="font-semibold text-text hover:underline">
					{displayStatus.account.display_name || displayStatus.account.username}
				</a>
				<span class="text-text-secondary">@{displayStatus.account.acct}</span>
				<span class="text-text-secondary">·</span>
				<time class="text-text-secondary" datetime={displayStatus.created_at}>
					{relativeTime}
				</time>
				{#if visibilityIcon}
					<span class="text-text-secondary" title={displayStatus.visibility}>
						{visibilityIcon}
					</span>
				{/if}
			</div>
			
			{#if displayStatus.spoiler_text}
				<details class="mt-2">
					<summary class="cursor-pointer text-text-secondary hover:text-text">
						CW: {displayStatus.spoiler_text}
					</summary>
					<div class="mt-2 prose prose-sm max-w-none text-text">
						{@html sanitizeMastodonHtml(displayStatus.content)}
					</div>
				</details>
			{:else}
				<div class="mt-2 prose prose-sm max-w-none text-text">
					{@html sanitizeMastodonHtml(displayStatus.content)}
				</div>
			{/if}
			
			{#if displayStatus.media_attachments.length > 0}
				<div class="mt-3 grid gap-2 {displayStatus.media_attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} max-w-md">
					{#each displayStatus.media_attachments as media}
						{#if media.type === 'image'}
							<button
								class="relative overflow-hidden rounded-lg bg-surface-variant"
								onclick={() => window.open(media.url, '_blank')}
							>
								<img
									src={media.preview_url}
									alt={media.description || 'Image attachment'}
									class="w-full h-full object-cover"
									loading="lazy"
								/>
								{#if media.description}
									<span class="sr-only">{media.description}</span>
								{/if}
							</button>
						{:else if media.type === 'video'}
							<video
								src={media.url}
								poster={media.preview_url}
								controls
								class="w-full rounded-lg"
								preload="none"
							>
								<track kind="captions" />
							</video>
						{:else if media.type === 'gifv'}
							<video
								src={media.url}
								poster={media.preview_url}
								autoplay
								loop
								muted
								playsinline
								class="w-full rounded-lg"
							/>
						{:else if media.type === 'audio'}
							<audio
								src={media.url}
								controls
								class="w-full"
								preload="none"
							/>
						{/if}
					{/each}
				</div>
			{/if}
			
			{#if displayStatus.poll}
				<div class="mt-3 space-y-2 p-3 rounded-lg bg-surface-variant">
					{#each displayStatus.poll.options as option}
						<div class="flex items-center gap-2">
							{#if displayStatus.poll.expired || displayStatus.poll.voted}
								<div class="flex-1">
									<div class="flex justify-between items-center">
										<span class="text-sm">{option.title}</span>
										<span class="text-sm text-text-secondary">
											{Math.round((option.votes_count / displayStatus.poll.votes_count) * 100)}%
										</span>
									</div>
									<div class="mt-1 h-2 bg-surface rounded-full overflow-hidden">
										<div
											class="h-full bg-primary transition-all duration-300"
											style="width: {(option.votes_count / displayStatus.poll.votes_count) * 100}%"
										/>
									</div>
								</div>
							{:else}
								<button class="flex-1 text-left p-2 rounded-lg border border-border hover:bg-surface-variant transition-colors">
									{option.title}
								</button>
							{/if}
						</div>
					{/each}
					<div class="text-sm text-text-secondary mt-2">
						{displayStatus.poll.votes_count} votes
						{#if displayStatus.poll.expires_at}
							· {displayStatus.poll.expired ? 'Ended' : 'Ends'} {new Date(displayStatus.poll.expires_at).toLocaleDateString()}
						{/if}
					</div>
				</div>
			{/if}
			
			{#if displayStatus.card && !displayStatus.media_attachments.length}
				<a
					href={displayStatus.card.url}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-3 flex gap-3 p-3 rounded-lg border border-border hover:bg-surface-variant transition-colors"
				>
					{#if displayStatus.card.image}
						<img
							src={displayStatus.card.image}
							alt=""
							class="w-20 h-20 object-cover rounded"
							loading="lazy"
						/>
					{/if}
					<div class="flex-1 min-w-0">
						<div class="font-medium text-sm truncate">{displayStatus.card.title}</div>
						{#if displayStatus.card.description}
							<div class="text-sm text-text-secondary line-clamp-2">{displayStatus.card.description}</div>
						{/if}
						<div class="text-xs text-text-secondary truncate">{new URL(displayStatus.card.url).hostname}</div>
					</div>
				</a>
			{/if}
			
			<div class="mt-3 flex items-center gap-1 -ml-2">
				<button
					onclick={handleReply}
					class="flex items-center gap-1 px-2 py-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
					title="Reply"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
					</svg>
					{#if displayStatus.replies_count > 0}
						<span class="text-sm">{displayStatus.replies_count}</span>
					{/if}
				</button>
				
				<button
					onclick={handleReblog}
					class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors {displayStatus.reblogged ? 'text-green-500' : 'text-text-secondary'} hover:text-green-500 hover:bg-green-500/10"
					title="Boost"
					disabled={displayStatus.visibility === 'private' || displayStatus.visibility === 'direct'}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					{#if displayStatus.reblogs_count > 0}
						<span class="text-sm">{displayStatus.reblogs_count}</span>
					{/if}
				</button>
				
				<button
					onclick={handleFavorite}
					class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors {displayStatus.favourited ? 'text-amber-500' : 'text-text-secondary'} hover:text-amber-500 hover:bg-amber-500/10"
					title="Favorite"
				>
					<svg class="w-5 h-5" fill={displayStatus.favourited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
					</svg>
					{#if displayStatus.favourites_count > 0}
						<span class="text-sm">{displayStatus.favourites_count}</span>
					{/if}
				</button>
				
				<button
					onclick={handleBookmark}
					class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors {displayStatus.bookmarked ? 'text-primary' : 'text-text-secondary'} hover:text-primary hover:bg-primary/10"
					title="Bookmark"
				>
					<svg class="w-5 h-5" fill={displayStatus.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
					</svg>
				</button>
				
				<button
					onclick={handleShare}
					class="flex items-center gap-1 px-2 py-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors ml-auto"
					title="Share"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.658a3 3 0 01-5.266 0m5.266 0a3 3 0 00-5.266 0m5.266 0L18 18m-5.684-2.342a3 3 0 01-5.266 0M6.75 6l1.266 1.342M18 6l-1.266 1.342M12 12h.01" />
					</svg>
				</button>
			</div>
		</div>
	</div>
</article>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.prose :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
	}
	
	.prose :global(a:hover) {
		text-decoration: none;
	}
	
	.prose :global(p) {
		margin: 0;
	}
	
	.prose :global(p + p) {
		margin-top: 1em;
	}
</style>