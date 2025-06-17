<script lang="ts">
  import Timeline from './Timeline.svelte';
  
  let { username, domain }: { username: string; domain?: string | null } = $props();
</script>

<Timeline type="user" />