/// <reference types="@sveltejs/kit" />
/// <reference types="vite/client" />

// Vite environment variables
interface ImportMetaEnv {
	readonly VITE_GRAPHQL_ENDPOINT?: string;
	readonly VITE_GRAPHQL_WS_ENDPOINT?: string;
	readonly VITE_DEFAULT_INSTANCE?: string;
	readonly VITE_OAUTH_REDIRECT_URI?: string;
	readonly VITE_API_BASE_URL?: string;
	readonly DEV?: boolean;
	readonly PROD?: boolean;
	readonly SSR?: boolean;
	readonly MODE: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Ambient module declarations
declare module '*.svg' {
	const content: string;
	export default content;
}

declare module '*.png' {
	const content: string;
	export default content;
}

declare module '*.jpg' {
	const content: string;
	export default content;
}

declare module '*.jpeg' {
	const content: string;
	export default content;
}

declare module '*.gif' {
	const content: string;
	export default content;
}

declare module '*.webp' {
	const content: string;
	export default content;
}
