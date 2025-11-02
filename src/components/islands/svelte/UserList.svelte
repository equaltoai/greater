<script lang="ts">
  import { onMount } from 'svelte';
  import { getGraphQLAdapter } from '../../../lib/api/graphql-client';
  import {
    getAccountService,
    mapGraphQLActorToAccount,
    type GraphQLActor
  } from '../../../lib/api/account-service';
  import { authStore } from '../../../lib/stores/auth.svelte';
  import type { Account, Relationship } from '../../../types/mastodon';
  import UserCard from './UserCard.svelte';

  interface Props {
    username: string;
    domain?: string | null;
    listType: 'followers' | 'following';
  }

  const PAGE_SIZE = 40;

  let { username, domain, listType }: Props = $props();

  let users = $state<Account[]>([]);
  let relationships = $state<Map<string, Relationship>>(new Map());
  let loading = $state(true);
  let error = $state('');
  let hasMore = $state(true);
  let loadingMore = $state(false);
  let account: Account | null = null;
  let nextCursor: string | null = null;

  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    loading = true;
    error = '';

    try {
      const accountService = getAccountService();
      const identifier = domain ? `${username}@${domain}` : username;
      account = await accountService.resolveAccount(identifier);

      await loadPage();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load users';
      console.error('Failed to load users:', err);
    } finally {
      loading = false;
    }
  }

  async function loadPage(cursor?: string) {
    if (!account) {
      return;
    }

    const adapter = await getGraphQLAdapter();
    const handle = account.acct ?? account.username;

    const page =
      listType === 'followers'
        ? await adapter.getFollowers(handle, PAGE_SIZE, cursor)
        : await adapter.getFollowing(handle, PAGE_SIZE, cursor);

    const mappedUsers = page.actors.map(convertActorToAccount);

    if (cursor) {
      users = [...users, ...mappedUsers];
    } else {
      users = mappedUsers;
    }

    hasMore = Boolean(page.nextCursor);
    nextCursor = page.nextCursor ?? null;

    await hydrateRelationships(mappedUsers);
  }

  function convertActorToAccount(actor: any): Account {
    const graphActor: GraphQLActor = {
      id: actor.id,
      username: actor.username,
      preferredUsername: actor.username,
      domain: actor.domain ?? null,
      displayName: actor.displayName ?? actor.username,
      name: actor.displayName ?? actor.username,
      manuallyApprovesFollowers: actor.locked ?? null,
      locked: actor.locked ?? null,
      bot: actor.bot ?? null,
      type: actor.bot ? 'Service' : 'Person',
      discoverable: actor.discoverable ?? null,
      published: actor.createdAt ?? null,
      createdAt: actor.createdAt ?? null,
      updatedAt: actor.updatedAt ?? null,
      summary: actor.summary ?? '',
      url: actor.url ?? undefined,
      avatar: actor.avatar ?? null,
      header: actor.header ?? null,
      followers: actor.followers ?? null,
      following: actor.following ?? null,
      statusesCount: actor.statusesCount ?? null,
      attachment: Array.isArray(actor.fields)
        ? actor.fields.map((field: any) => ({
            type: 'PropertyValue',
            name: field.name ?? '',
            value: field.value ?? '',
          }))
        : undefined,
      fields: Array.isArray(actor.fields)
        ? actor.fields.map((field: any) => ({
            name: field.name ?? '',
            value: field.value ?? '',
            verifiedAt: field.verifiedAt ?? null,
          }))
        : undefined,
    };

    return mapGraphQLActorToAccount(graphActor);
  }

  async function hydrateRelationships(newUsers: Account[]) {
    if (!authStore.currentUser || newUsers.length === 0) {
      return;
    }

    const adapter = await getGraphQLAdapter();
    const rels = await adapter.getRelationships(newUsers.map((user) => user.id));

    rels.forEach((rel: any) => {
      relationships.set(rel.id, {
        id: rel.id,
        following: rel.following || false,
        followed_by: rel.followedBy || false,
        blocking: rel.blocking || false,
        blocked_by: rel.blockedBy || false,
        muting: rel.muting || false,
        muting_notifications: rel.mutingNotifications || false,
        requested: rel.requested || false,
        domain_blocking: false,
        showing_reblogs: true,
        endorsed: false,
        notifying: false,
        note: '',
      });
    });

    relationships = new Map(relationships);
  }

  async function loadMore() {
    if (!hasMore || loadingMore || !nextCursor || !account) {
      return;
    }

    loadingMore = true;

    try {
      await loadPage(nextCursor);
    } catch (err) {
      console.error('Failed to load more users:', err);
    } finally {
      loadingMore = false;
    }
  }

  async function handleRelationshipUpdate(userId: string, newRelationship: Relationship) {
    relationships.set(userId, newRelationship);
    relationships = new Map(relationships);
  }
</script>

<div class="divide-y divide-gray-200 dark:divide-gray-700">
  {#if loading}
    <div class="p-8 text-center">
      <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p>Loading {listType}...</p>
    </div>
  {:else if error}
    <div class="p-8 text-center text-red-600 dark:text-red-400">
      <p>{error}</p>
    </div>
  {:else if users.length === 0}
    <div class="p-8 text-center text-gray-500">
      {#if domain}
        <p class="mb-2">Unable to load {listType} for this remote user</p>
        <p class="text-sm">This information may not be available due to federation limitations</p>
      {:else}
        <p>No {listType} yet</p>
      {/if}
    </div>
  {:else}
    {#each users as user (user.id)}
      {@const userRelationship = relationships.get(user.id)}
      <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <UserCard 
          {user} 
          relationship={userRelationship}
          onRelationshipUpdate={(rel) => handleRelationshipUpdate(user.id, rel)}
        />
      </div>
    {/each}
    
    {#if hasMore}
      <div class="p-4 text-center">
        <button
          onclick={loadMore}
          disabled={loadingMore}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      </div>
    {/if}
  {/if}
</div>
