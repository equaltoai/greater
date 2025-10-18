import type { Component } from 'svelte';

declare module '@equaltoai/greater-components/primitives/components/*' {
  const component: Component<any>;
  export default component;
}
