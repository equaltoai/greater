<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  
  interface Props extends HTMLButtonAttributes {
    active?: boolean;
    activeColor?: 'green' | 'amber' | 'primary' | 'red';
    count?: number;
    label: string;
    icon: any; // Svelte component
  }
  
  let {
    active = false,
    activeColor = 'primary',
    count,
    label,
    icon,
    disabled = false,
    children,
    ...restProps
  }: Props = $props();
  
  const colorClasses = {
    green: 'text-green-500 hover:text-green-500 hover:bg-green-500/10',
    amber: 'text-amber-500 hover:text-amber-500 hover:bg-amber-500/10',
    primary: 'text-primary hover:text-primary hover:bg-primary/10',
    red: 'text-red-500 hover:text-red-500 hover:bg-red-500/10',
  };
</script>

<button
  class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors {active ? colorClasses[activeColor] : 'text-text-secondary hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}"
  title={label}
  aria-label={label}
  aria-pressed={active}
  {disabled}
  {...restProps}
>
  {@render icon()}
  {#if count !== undefined && count > 0}
    <span class="text-sm" aria-label="{count} {label}s">{count}</span>
  {/if}
</button>