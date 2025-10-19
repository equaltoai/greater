<script lang="ts">
  import { GCTextField } from '@/lib/components';
  import Button from './Button.svelte';
  
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
    <GCTextField
      id="instance"
      bind:value={instance}
      placeholder="mastodon.social"
      class="w-full"
    >
      {#snippet prefix()}
        <span class="text-text-muted">https://</span>
      {/snippet}
    </GCTextField>
  </div>
  
  <Button
    type="submit"
    variant="primary"
    fullWidth
  >
    Continue with Mastodon
  </Button>
</form>