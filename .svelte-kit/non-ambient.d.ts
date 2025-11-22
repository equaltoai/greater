
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/@" | "/@/[user]" | "/auth" | "/auth/callback" | "/auth/login" | "/federated" | "/home" | "/lists" | "/lists/[id]" | "/local" | "/settings";
		RouteParams(): {
			"/@/[user]": { user: string };
			"/lists/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { user?: string; id?: string };
			"/@": { user?: string };
			"/@/[user]": { user: string };
			"/auth": Record<string, never>;
			"/auth/callback": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/federated": Record<string, never>;
			"/home": Record<string, never>;
			"/lists": { id?: string };
			"/lists/[id]": { id: string };
			"/local": Record<string, never>;
			"/settings": Record<string, never>
		};
		Pathname(): "/" | "/@" | "/@/" | `/@/${string}` & {} | `/@/${string}/` & {} | "/auth" | "/auth/" | "/auth/callback" | "/auth/callback/" | "/auth/login" | "/auth/login/" | "/federated" | "/federated/" | "/home" | "/home/" | "/lists" | "/lists/" | `/lists/${string}` & {} | `/lists/${string}/` & {} | "/local" | "/local/" | "/settings" | "/settings/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/default-avatar.svg" | string & {};
	}
}