<script lang="ts">
	import { onMount } from 'svelte';
	import type { Status, Relationship } from '@/types/mastodon';
	import type { Status as LesserStatus } from '@/lib/api/schemas';
	import { sanitizeMastodonHtml } from '@/lib/utils/sanitize';
	import { timelineStore } from '@/lib/stores/timeline.svelte';
	import { authStore } from '@/lib/stores/auth.svelte';
	import { getClient } from '@/lib/api/client';
	import Button from './Button.svelte';
	import MediaGallery from './MediaGallery.svelte';
	
	interface Props {
		status: Status;
		showThread?: boolean;
	}
	
	let { status, showThread = false }: Props = $props();
	
	// Cast to Lesser Status to access enhanced fields if available
	const lesserStatus = status as unknown as LesserStatus;
	
	;
	;
	
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
	let showMenu = $state(false);
	let showBoostMenu = $state(false);
	let relationship: Relationship | null = null;
	let followLoading = false;
	
	const isOwnStatus = $derived(displayStatus.account.id === authStore.currentUser?.id);
	
	onMount(() => {
		// Close menu when clicking outside
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			
			if (showMenu && !target.closest('.menu-container')) {
				showMenu = false;
			}
			
			if (showBoostMenu && !target.closest('.boost-menu-container')) {
				showBoostMenu = false;
			}
		};
		
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
	
	// Load relationship on mount if not own status
	onMount(async () => {
		if (!isOwnStatus && authStore.currentUser) {
			try {
				const client = getClient();
				// Use username for Lesser compatibility
				const identifier = displayStatus.account.username || displayStatus.account.id;
				const relationships = await client.getRelationships([identifier]);
				relationship = relationships[0];
			} catch (err) {
				console.error('Failed to load relationship:', err);
			}
		}
	});
	
	async function handleFavorite() {
		if (isInteracting || !authStore.currentUser) return;
		isInteracting = true;
		
		console.log('[StatusCard] Before favorite:', { 
			id: displayStatus.id, 
			favourited: displayStatus.favourited, 
			content: displayStatus.content?.substring(0, 50) 
		});
		
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
	
	async function handleTraditionalBoost() {
		if (isInteracting || !authStore.currentUser) return;
		isInteracting = true;
		showBoostMenu = false;
		
		try {
			if (displayStatus.reblogged) {
				await timelineStore.unreblogStatus(displayStatus.id);
			} else {
				await timelineStore.reblogStatus(displayStatus.id);
			}
		} catch (error) {
			console.error('[StatusCard] Boost failed:', error);
		} finally {
			isInteracting = false;
		}
	}
	
	function handleQuoteBoost() {
		showBoostMenu = false;
		if (!authStore.currentUser) {
			console.log('[StatusCard] Cannot quote: not logged in');
			return;
		}
		
		// Store the status we're quoting
		const quoteContext = {
			statusId: displayStatus.id,
			quotedStatus: displayStatus
		};
		sessionStorage.setItem('compose_quote_context', JSON.stringify(quoteContext));
		
		// Navigate to compose page
		window.location.href = '/compose';
	}
	
	async function handleBookmark() {
		if (isInteracting || !authStore.currentUser) return;
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
		if (typeof window === 'undefined') return;
		
		// Store reply context in sessionStorage before navigating
		const replyContext = {
			replyToId: displayStatus.id,
			mention: `@${displayStatus.account.acct} `
		};
		sessionStorage.setItem('compose_reply_context', JSON.stringify(replyContext));
		
		// Navigate to compose page
		window.location.href = '/compose';
	}
	
	function handleShare() {
		if (typeof window === 'undefined') return;
		
		if (navigator.share) {
			navigator.share({
				title: `Post by ${displayStatus.account.display_name || displayStatus.account.username}`,
				text: displayStatus.content.replace(/<[^>]*>/g, ''),
				url: displayStatus.url || displayStatus.uri
			});
		} else if (navigator.clipboard) {
			navigator.clipboard.writeText(displayStatus.url || displayStatus.uri);
		}
	}
	
	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this post?')) return;
		
		isInteracting = true;
		try {
			await timelineStore.deleteStatus(displayStatus.id);
			// If we're on the status page, navigate back
			if (typeof window !== 'undefined' && window.location.pathname.startsWith('/status/')) {
				window.history.back();
			}
		} catch (error) {
			console.error('Failed to delete status:', error);
			alert('Failed to delete post');
		} finally {
			isInteracting = false;
		}
	}
	
	async function handleFollow() {
		if (!authStore.currentUser || followLoading) return;
		
		followLoading = true;
		try {
			const client = getClient();
			
			// Use username for Lesser compatibility
			const identifier = displayStatus.account.username || displayStatus.account.id;
			
			if (relationship?.following) {
				relationship = await client.unfollowAccount(identifier);
			} else {
				relationship = await client.followAccount(identifier);
			}
		} catch (err) {
			console.error('Follow/unfollow failed:', err);
		} finally {
			followLoading = false;
		}
	}
</script>

<article 
	class="card p-4 space-y-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
	onclick={(e) => {
		if (typeof window === 'undefined') return;
		
		// Don't navigate if clicking on interactive elements
		const target = e.target as HTMLElement;
		if (target.closest('button') || target.closest('a') || target.closest('video') || target.closest('audio')) {
			return;
		}
		window.location.href = `/status/${displayStatus.id}`;
	}}
	role="article"
	aria-label="Post by {displayStatus.account.display_name || displayStatus.account.username}"
	tabindex="0"
	onkeydown={(e) => {
		if (typeof window === 'undefined') return;
		
		if (e.key === 'Enter' && !e.target.closest('button') && !e.target.closest('a')) {
			window.location.href = `/status/${displayStatus.id}`;
		}
	}}
>
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
				{#if !isOwnStatus && authStore.currentUser && relationship}
					<Button
						onclick={(e) => {
							e.stopPropagation();
							handleFollow();
						}}
						loading={followLoading}
						variant={relationship.following ? 'secondary' : 'primary'}
						size="sm"
						class="ml-auto rounded-full"
					>
						{#if relationship.following}
							Following
						{:else}
							Follow
						{/if}
					</Button>
				{/if}
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
				<div class="mt-3">
					<MediaGallery 
						media={displayStatus.media_attachments} 
						sensitive={displayStatus.sensitive}
					/>
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
			
			{#if lesserStatus.community_notes && lesserStatus.community_notes.length > 0}
				<div class="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
					<div class="flex items-center gap-2 mb-2">
						<svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span class="font-medium text-blue-900 dark:text-blue-100">Community Note</span>
					</div>
					{#each lesserStatus.community_notes.slice(0, 1) as note}
						<p class="text-sm text-blue-800 dark:text-blue-200">{note.content}</p>
						<div class="mt-2 flex items-center gap-4 text-xs text-blue-600 dark:text-blue-400">
							<span>{note.votes_helpful} found helpful</span>
							{#if note.votes_unhelpful > 0}
								<span>{note.votes_unhelpful} found unhelpful</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
			
			{#if lesserStatus.delivery_cost && authStore.currentUser}
				<div class="mt-2 text-xs text-text-secondary">
					Delivery cost: ${(lesserStatus.delivery_cost / 1000000).toFixed(6)}
				</div>
			{/if}
			
			<div class="mt-3 flex items-center gap-1 -ml-2">
				<button
					onclick={handleReply}
					class="flex items-center gap-1 px-2 py-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
					title="Reply"
					aria-label="Reply to post{displayStatus.replies_count > 0 ? `, ${displayStatus.replies_count} replies` : ''}"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
					</svg>
					{#if displayStatus.replies_count > 0}
						<span class="text-sm" aria-hidden="true">{displayStatus.replies_count}</span>
					{/if}
				</button>
				
				<div class="relative boost-menu-container">
					<button
						onclick={(e) => {
							e.stopPropagation();
							if (displayStatus.reblogged) {
								// If already boosted, unboosting is direct action
								handleTraditionalBoost();
							} else {
								// Show menu for boost options
								showBoostMenu = !showBoostMenu;
							}
						}}
						class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors {displayStatus.reblogged ? 'text-green-500' : 'text-text-secondary'} hover:text-green-500 hover:bg-green-500/10"
						title="Boost"
						aria-label="{displayStatus.reblogged ? 'Unboost' : 'Boost'} post{displayStatus.reblogs_count > 0 ? `, ${displayStatus.reblogs_count} boosts` : ''}"
						aria-pressed={displayStatus.reblogged}
						disabled={displayStatus.visibility === 'private' || displayStatus.visibility === 'direct'}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					{#if displayStatus.reblogs_count > 0}
						<span class="text-sm" aria-hidden="true">{displayStatus.reblogs_count}</span>
					{/if}
				</button>
				
				{#if showBoostMenu}
					<div class="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[150px]">
						<button
							onclick={handleTraditionalBoost}
							class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Boost
						</button>
						<button
							onclick={handleQuoteBoost}
							class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h13m0 0l-4-4m4 4l-4 4m-9 4v-4a1 1 0 011-1h2m0-4V5a1 1 0 011-1h7" />
							</svg>
							Quote
						</button>
					</div>
				{/if}
				</div>
				
				<button
					onclick={handleFavorite}
					class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors {displayStatus.favourited ? 'text-amber-500' : 'text-text-secondary'} hover:text-amber-500 hover:bg-amber-500/10"
					title="Favorite"
					aria-label="{displayStatus.favourited ? 'Unfavorite' : 'Favorite'} post{displayStatus.favourites_count > 0 ? `, ${displayStatus.favourites_count} favorites` : ''}"
					aria-pressed={displayStatus.favourited}
				>
					<svg class="w-5 h-5" fill={displayStatus.favourited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
					</svg>
					{#if displayStatus.favourites_count > 0}
						<span class="text-sm" aria-hidden="true">{displayStatus.favourites_count}</span>
					{/if}
				</button>
				
				<button
					onclick={handleBookmark}
					class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors {displayStatus.bookmarked ? 'text-primary' : 'text-text-secondary'} hover:text-primary hover:bg-primary/10"
					title="Bookmark"
					aria-label="{displayStatus.bookmarked ? 'Remove bookmark' : 'Bookmark'} post"
					aria-pressed={displayStatus.bookmarked}
				>
					<svg class="w-5 h-5" fill={displayStatus.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
					</svg>
				</button>
				
				<button
					onclick={handleShare}
					class="flex items-center gap-1 px-2 py-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors ml-auto"
					title="Share"
					aria-label="Share post"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.658a3 3 0 01-5.266 0m5.266 0a3 3 0 00-5.266 0m5.266 0L18 18m-5.684-2.342a3 3 0 01-5.266 0M6.75 6l1.266 1.342M18 6l-1.266 1.342M12 12h.01" />
					</svg>
				</button>
				
				{#if isOwnStatus}
					<div class="relative">
						<button
							onclick={(e) => {
								e.stopPropagation();
								showMenu = !showMenu;
							}}
							class="flex items-center gap-1 px-2 py-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
							title="More options"
							aria-label="More options for this post"
							aria-expanded={showMenu}
							aria-haspopup="menu"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
							</svg>
						</button>
						
						{#if showMenu}
							<div class="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
								<button
									onclick={(e) => {
										e.stopPropagation();
										showMenu = false;
										handleDelete();
									}}
									class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
									Delete
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</article>