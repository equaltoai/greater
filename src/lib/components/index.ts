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
// Note: The .svelte extension is added by the package exports mapping
export { default as GCButton } from '@equaltoai/greater-components/primitives/Button';
export { default as GCModal } from '@equaltoai/greater-components/primitives/Modal';
export { default as GCTextField } from '@equaltoai/greater-components/primitives/TextField';
export { default as GCTextArea } from '@equaltoai/greater-components/primitives/TextArea';
export { default as GCSelect } from '@equaltoai/greater-components/primitives/Select';
export { default as GCCheckbox } from '@equaltoai/greater-components/primitives/Checkbox';
export { default as GCSwitch } from '@equaltoai/greater-components/primitives/Switch';
export { default as GCFileUpload } from '@equaltoai/greater-components/primitives/FileUpload';
export { default as GCAvatar } from '@equaltoai/greater-components/primitives/Avatar';
export { default as GCTooltip } from '@equaltoai/greater-components/primitives/Tooltip';
export { default as GCSkeleton } from '@equaltoai/greater-components/primitives/Skeleton';
export { default as GCMenu } from '@equaltoai/greater-components/primitives/Menu';
export { default as GCTabs } from '@equaltoai/greater-components/primitives/Tabs';
export { default as GCThemeProvider } from '@equaltoai/greater-components/primitives/ThemeProvider';
export { default as GCThemeSwitcher } from '@equaltoai/greater-components/primitives/ThemeSwitcher';

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
