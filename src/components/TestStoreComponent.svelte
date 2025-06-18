<script>
  import { testStore } from '@/lib/stores/test-store.svelte';
</script>

<div>
  <h2>Test Store Component</h2>
  <p>Store count: {testStore.count}</p>
  <button onclick={() => testStore.increment()}>Increment Store</button>
</div>