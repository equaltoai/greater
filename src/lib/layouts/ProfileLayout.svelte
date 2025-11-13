<script lang="ts">
  import type { Snippet } from 'svelte';
  import MainLayout from './MainLayout.svelte';
  
  interface Props {
    title?: string;
    children: Snippet;
  }
  
  let { title = 'Profile', children }: Props = $props();
</script>

<MainLayout {title}>
  <div class="profile-layout">
    {@render children()}
  </div>
</MainLayout>

<style>
  .profile-layout {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
</style>
