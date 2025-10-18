/**
 * Component Shims for Greater Components Integration
 * 
 * This module re-exports primitives from @equaltoai/greater-components
 * while maintaining compatibility with Greater's existing prop/event signatures.
 * 
 * During migration, components will gradually move from Greater's local implementations
 * to these shimmed versions, allowing us to adopt Greater Components incrementally.
 */

// TODO: Re-export GraphQL adapters when needed
// These are available but not imported yet to avoid build issues:
// - LesserGraphQLAdapter from '@equaltoai/greater-components/adapters/graphql/LesserGraphQLAdapter.js'
// - createGraphQLClient from '@equaltoai/greater-components/adapters/graphql/client.js'
// - GraphQLCache from '@equaltoai/greater-components/adapters/graphql/cache.js'

// Re-export primitives directly where signatures match
export { default as GCButton } from '@equaltoai/greater-components/primitives/components/Button';
export { default as GCModal } from '@equaltoai/greater-components/primitives/components/Modal';
export { default as GCTextField } from '@equaltoai/greater-components/primitives/components/TextField';
export { default as GCAvatar } from '@equaltoai/greater-components/primitives/components/Avatar';
export { default as GCTooltip } from '@equaltoai/greater-components/primitives/components/Tooltip';
export { default as GCSkeleton } from '@equaltoai/greater-components/primitives/components/Skeleton';
export { default as GCMenu } from '@equaltoai/greater-components/primitives/components/Menu';
export { default as GCTabs } from '@equaltoai/greater-components/primitives/components/Tabs';
export { default as GCThemeProvider } from '@equaltoai/greater-components/primitives/components/ThemeProvider';
export { default as GCThemeSwitcher } from '@equaltoai/greater-components/primitives/components/ThemeSwitcher';

/**
 * TODO: Create adapter wrappers for components with signature mismatches
 * 
 * Example adapter pattern:
 * 
 * import GCButtonPrimitive from '@equaltoai/greater-components/primitives/components/Button.js';
 * 
 * export const Button = (props) => {
 *   // Adapt Greater props to Greater Components props
 *   const adapted = {
 *     variant: props.type === 'primary' ? 'primary' : 'secondary',
 *     ...props
 *   };
 *   return GCButtonPrimitive(adapted);
 * };
 */
