<script lang="ts">
  let { username, domain }: { username: string; domain?: string | null } = $props();
</script>

<div class="user-profile p-4 border-b border-border">
  <div class="flex items-center space-x-4">
    <div class="w-20 h-20 rounded-full bg-surface"></div>
    <div>
      <h1 class="text-2xl font-bold">@{username}{domain ? `@${domain}` : ''}</h1>
      <p class="text-text-muted">User profile coming soon...</p>
    </div>
  </div>
</div>