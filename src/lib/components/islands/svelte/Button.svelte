<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { GCButton } from '$lib/components';

  type LegacyVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'ghost'
    | 'danger'
    | 'success';

  type LegacySize = 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';

  interface Props extends HTMLButtonAttributes {
    variant?: LegacyVariant;
    size?: LegacySize;
    fullWidth?: boolean;
    loading?: boolean;
    prefix?: Snippet;
    suffix?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    prefix,
    suffix,
    children,
    class: className = '',
    style = '',
    type,
    ...restProps
  }: Props = $props();

  const variantMap: Record<LegacyVariant, 'solid' | 'outline' | 'ghost'> = {
    primary: 'solid',
    secondary: 'outline',
    tertiary: 'ghost',
    ghost: 'ghost',
    danger: 'solid',
    success: 'solid'
  };

  const sizeMap: Record<LegacySize, 'sm' | 'md' | 'lg'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    small: 'sm',
    medium: 'md',
    large: 'lg'
  };

  const variantStyleOverrides: Partial<Record<LegacyVariant, string>> = {
    danger: [
      '--gr-semantic-action-primary-default: var(--gr-semantic-action-error-default);',
      '--gr-semantic-action-primary-hover: var(--gr-semantic-action-error-hover);',
      '--gr-semantic-action-primary-active: var(--gr-semantic-action-error-active);'
    ].join(' '),
    success: [
      '--gr-semantic-action-primary-default: var(--gr-semantic-action-success-default);',
      '--gr-semantic-action-primary-hover: var(--gr-semantic-action-success-hover);',
      '--gr-semantic-action-primary-active: var(--gr-semantic-action-success-active);'
    ].join(' ')
  };

  const normalizedVariant = $derived(() => variantMap[variant] ?? 'solid');
  const normalizedSize = $derived(() => sizeMap[size] ?? 'md');
  const normalizedType = $derived(() => type ?? 'submit');
  const combinedStyle = $derived(() =>
    [variantStyleOverrides[variant], style].filter(Boolean).join(' ').trim()
  );
  const combinedClass = $derived(() =>
    [fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ').trim()
  );
</script>

<GCButton
  variant={normalizedVariant}
  size={normalizedSize}
  type={normalizedType}
  loading={loading}
  disabled={disabled || loading}
  class={combinedClass || undefined}
  style={combinedStyle || undefined}
  prefix={prefix}
  suffix={suffix}
  {...restProps}
>
  {@render children?.()}
</GCButton>
