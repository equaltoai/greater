<script>
  // Create store inside component
  class TestStore {
    count = $state(0);
    
    constructor() {
      // Test $effect in constructor
      $effect(() => {
        console.log('Count changed to:', this.count);
      });
    }
    
    increment() {
      this.count++;
    }
  }
  
  const testStore = new TestStore();
</script>

<div>
  <h2>Test Store Created in Component</h2>
  <p>Store count: {testStore.count}</p>
  <button onclick={() => testStore.increment()}>Increment Store</button>
</div>