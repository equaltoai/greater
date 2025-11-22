<script lang="ts">
  import BaseLayout from '../../layouts/BaseLayout.svelte';
  import LoginForm from '../../components/islands/svelte/LoginForm.svelte';
</script>

<BaseLayout title="Login - Greater">
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="app-title">Greater</h1>
        <p class="app-subtitle">A modern Mastodon client</p>
      </div>
      <div class="login-content">
        <LoginForm />
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(
      135deg,
      var(--color-primary, #6366f1) 0%,
      var(--color-accent1, #8b5cf6) 100%
    );
    padding: var(--spacing-4, 1rem);
  }

  .login-container {
    width: 100%;
    max-width: 450px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl, 1rem);
    padding: var(--spacing-8, 2rem);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .login-header {
    text-align: center;
    margin-bottom: var(--spacing-6, 1.5rem);
  }

  .app-title {
    font-size: var(--font-size-3xl, 1.875rem);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text);
    margin-bottom: var(--spacing-2, 0.5rem);
  }

  .app-subtitle {
    font-size: var(--font-size-base, 1rem);
    color: var(--color-text-muted);
  }

  .login-content {
    margin-top: var(--spacing-6, 1.5rem);
  }
</style>
