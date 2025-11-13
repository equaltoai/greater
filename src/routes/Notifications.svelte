<script lang="ts">
  import MainLayout from '../layouts/MainLayout.svelte';
  import NotificationList from '../components/islands/svelte/NotificationList.svelte';
</script>

<MainLayout title="Notifications">
  <div class="notifications-page">
    <h1 class="page-title">Notifications</h1>
    <NotificationList />
  </div>
</MainLayout>

<style>
  .notifications-page {
    max-width: 800px;
    margin: 0 auto;
  }

  .page-title {
    font-size: var(--font-size-2xl, 1.5rem);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text);
    margin-bottom: var(--spacing-4, 1rem);
  }
</style>
