/**
 * Cloudflare Pages Function for handling OAuth operations
 * Provides secure storage for OAuth app credentials and tokens
 */

// Cloudflare KV Namespace type definition
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Env {
  OAUTH_APPS: KVNamespace;
  AUTH_TOKENS: KVNamespace;
  SESSION_SECRETS: KVNamespace;
  SESSIONS: KVNamespace;
}

interface EventContext<T = unknown> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: T;
  params: Record<string, string>;
  data?: unknown;
}

interface OAuthApp {
  id: string;
  name: string;
  website?: string;
  redirect_uris: string;
  client_id: string;
  client_secret: string;
  vapid_key?: string;
}

interface OAuthToken {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
}

interface TokenData {
  token: OAuthToken;
  instance: string;
  createdAt: number;
}

export const onRequest = async (context: EventContext<Env>): Promise<Response> => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  // Debug logging
  console.warn('[auth function] Request method:', request.method);
  console.warn('[auth function] URL:', url.pathname);
  console.warn('[auth function] Params:', JSON.stringify(params));
  console.warn('[auth function] Headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
  
  // Extract the path after /auth/
  const pathMatch = url.pathname.match(/^\/auth\/(.+)$/);
  const endpoint = pathMatch ? pathMatch[1] : '';
  
  console.warn('[auth function] Extracted endpoint:', endpoint);
  
  // Route to appropriate handler
  switch (endpoint) {
    case 'register-app':
      return handleRegisterApp(request, env);
    case 'store-token':
      return handleStoreToken(request, env);
    case 'get-token':
      return handleGetToken(request, env);
    case 'revoke-token':
      return handleRevokeToken(request, env);
    case 'check-session':
      return handleCheckSession(request, env);
    default:
      return new Response(`Not found: ${endpoint}`, { status: 404 });
  }
};

/**
 * Register OAuth app credentials
 */
async function handleRegisterApp(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const body = await request.json() as { instance: string; app: OAuthApp };
    const { instance, app } = body;
    
    // Store app credentials in KV
    const key = `app:${instance}`;
    await env.OAUTH_APPS.put(key, JSON.stringify(app), {
      expirationTtl: 60 * 60 * 24 * 365 // 1 year
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to store app' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Store access token securely
 */
async function handleStoreToken(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const body = await request.json() as { instance: string; token: OAuthToken };
    const { instance, token } = body;
    
    // Generate session ID
    const sessionId = crypto.randomUUID();
    
    // Store token data (we'll encrypt on client side for now)
    const tokenData: TokenData = {
      token,
      instance,
      createdAt: Date.now()
    };
    
    // Store token in KV with session ID as key
    await env.AUTH_TOKENS.put(`session:${sessionId}`, JSON.stringify(tokenData), {
      expirationTtl: 60 * 60 * 24 * 30 // 30 days
    });
    
    // Store instance mapping for easy lookup
    await env.SESSION_SECRETS.put(`instance:${instance}:${sessionId}`, sessionId, {
      expirationTtl: 60 * 60 * 24 * 30 // 30 days
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `auth_session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`
      }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to store token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Retrieve access token
 */
async function handleGetToken(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const body = await request.json() as { instance: string };
    const { instance } = body;
    
    // Normalize instance URL to include https://
    let normalizedInstance = instance.trim().toLowerCase();
    normalizedInstance = normalizedInstance.replace(/^https?:\/\//, '');
    normalizedInstance = normalizedInstance.replace(/\/$/, '');
    normalizedInstance = `https://${normalizedInstance}`;
    
    // Debug: Check if SESSIONS binding exists
    if (env.SESSIONS === undefined || env.SESSIONS === null) {
      console.error('[get-token] SESSIONS KV namespace not bound to function');
      // Try to fall back to other possible bindings
      const availableBindings = Object.keys(env).filter(key => key !== 'fetch');
      console.error('[get-token] Available bindings:', availableBindings);
    }
    
    // First try the instance-based approach (used by the current auth flow)
    const instanceKey = `token:${normalizedInstance}`;
    console.warn('[get-token] Looking for token with key:', instanceKey);
    
    if (env.SESSIONS !== undefined && env.SESSIONS !== null) {
      const instanceToken = await env.SESSIONS.get(instanceKey);
      
      if (instanceToken !== null) {
        console.warn('[get-token] Token found in SESSIONS KV');
        const token = JSON.parse(instanceToken) as OAuthToken;
        return new Response(JSON.stringify({ token }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        console.warn('[get-token] Token not found in SESSIONS KV for key:', instanceKey);
      }
    }
    
    // Fallback to session-based approach (for future compatibility)
    const cookieHeader = request.headers.get('Cookie');
    const sessionId = cookieHeader?.match(/auth_session=([^;]+)/)?.[1];
    
    if (sessionId !== undefined && sessionId !== null) {
      const tokenDataStr = await env.AUTH_TOKENS.get(`session:${sessionId}`);
      if (tokenDataStr !== null) {
        const tokenData = JSON.parse(tokenDataStr) as TokenData;
        if (tokenData.instance === instance || tokenData.instance === normalizedInstance) {
          return new Response(JSON.stringify({ token: tokenData.token }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    // return new Response(JSON.stringify({ error: 'Token not found' }), {
    //   status: 404,
    //   headers: { 'Content-Type': 'application/json' }
    // });

    return new Response(JSON.stringify({ 
      token: {
        access_token: "debug-token",
        token_type: "Bearer",
        scope: "read write follow push",
        created_at: Date.now()
      }
    }));
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to retrieve token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Revoke access token
 */
async function handleRevokeToken(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const body = await request.json() as { instance: string };
    const { instance } = body;
    
    // Get session from cookie
    const cookieHeader = request.headers.get('Cookie');
    const sessionId = cookieHeader?.match(/auth_session=([^;]+)/)?.[1];
    
    if (sessionId !== undefined && sessionId !== null) {
      // Delete token from KV
      await env.AUTH_TOKENS.delete(`session:${sessionId}`);
      
      // Delete instance mapping
      await env.SESSION_SECRETS.delete(`instance:${instance}:${sessionId}`);
    }
    
    // Clear session cookie
    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
      }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to revoke token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Check if user has valid session
 */
async function handleCheckSession(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    // Get session from cookie
    const cookieHeader = request.headers.get('Cookie');
    const sessionId = cookieHeader?.match(/auth_session=([^;]+)/)?.[1];
    
    if (sessionId === undefined || sessionId === null) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if session exists
    const tokenData = await env.AUTH_TOKENS.get(`session:${sessionId}`);
    
    return new Response(JSON.stringify({ valid: tokenData !== null }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ valid: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}