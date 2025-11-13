import { logDebug } from '$lib/utils/logger';

// Minimal store for testing
class TestStore {
  count = $state(0);
  
  constructor() {
    // Test $effect in constructor
    $effect(() => {
      logDebug('Count changed to:', this.count);
    });
  }
  
  increment() {
    this.count++;
  }
}

export const testStore = new TestStore();
