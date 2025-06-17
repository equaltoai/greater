<!-- Example of Svelte 5 component with runes API -->
<script>
  // Svelte 5 runes API (new reactive system)
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  // Props with runes
  let { title = 'Default Title', onUpdate } = $props();
  
  // Effects with runes
  $effect(() => {
    console.log(`Count changed to: ${count}`);
    onUpdate?.(count);
  });
  
  function increment() {
    count++;
  }
  
  function decrement() {
    count--;
  }
</script>

<div class="counter">
  <h2>{title}</h2>
  <div class="controls">
    <button onclick={decrement}>-</button>
    <span>{count} (doubled: {doubled})</span>
    <button onclick={increment}>+</button>
  </div>
</div>

<style>
  .counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }
  
  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    background: white;
    cursor: pointer;
    font-size: 1.25rem;
  }
  
  button:hover {
    background: #f9fafb;
  }
</style>