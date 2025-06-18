<script>
  let count = $state(0);
  
  function increment() {
    count++;
  }
</script>

<div>
  <h2>Svelte 5 Counter Test</h2>
  <p>Count: {count}</p>
  <button onclick={increment}>Increment</button>
</div>