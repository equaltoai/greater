import type { APIRoute } from 'astro';

interface OAuthApp {
  id: string;
  name: string;
  website?: string;
  redirect_uris: string;
  client_id: string;
  client_secret: string;
  vapid_key?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env) {
      return new Response(JSON.stringify({ error: 'Runtime env not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const env = runtime.env;
    
    // Check if OAUTH_APPS KV is available
    if (!env.OAUTH_APPS) {
      console.error('OAUTH_APPS KV namespace not bound');
      // Fall back to SESSIONS KV if OAUTH_APPS is not available
      if (!env.SESSIONS) {
        return new Response(JSON.stringify({ error: 'KV namespace not available' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    const body = await request.json() as { instance: string; app: OAuthApp };
    const { instance, app } = body;
    
    // Store app credentials in KV
    const kvNamespace = env.OAUTH_APPS || env.SESSIONS;
    const key = `app:${instance}`;
    await kvNamespace.put(key, JSON.stringify(app), {
      expirationTtl: 60 * 60 * 24 * 365 // 1 year
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to store app:', error);
    return new Response(JSON.stringify({ error: 'Failed to store app' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
