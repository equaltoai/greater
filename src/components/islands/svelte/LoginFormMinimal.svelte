<script lang="ts">
  let instance = $state('');
  
  function handleSubmit(e: Event) {
    e.preventDefault();
    console.log('Form submitted with instance:', instance);
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <div>
    <label for="instance" class="block text-sm font-medium text-text mb-2">
      Your Mastodon Instance
    </label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span class="text-text-muted">https://</span>
      </div>
      <input
        id="instance"
        type="text"
        bind:value={instance}
        placeholder="mastodon.social"
        class="block w-full pl-20 pr-10 py-3 border border-border rounded-md bg-background text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
      />
    </div>
  </div>
  
  <button
    type="submit"
    class="w-full py-3 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
  >
    Continue with Mastodon
  </button>
</form>