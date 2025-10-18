import type { APIRoute } from 'astro';

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

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env) {
      return new Response(JSON.stringify({ error: 'Runtime env not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const env = runtime.env;
    
    const body = await request.json() as { instance: string; token: OAuthToken };
    const { instance, token } = body;
    
    // Generate session ID
    const sessionId = crypto.randomUUID();
    
    // Store token data
    const tokenData: TokenData = {
      token,
      instance,
      createdAt: Date.now()
    };
    
    // Use SESSIONS KV to store tokens
    const kvNamespace = env.AUTH_TOKENS || env.SESSIONS;
    if (!kvNamespace) {
      return new Response(JSON.stringify({ error: 'KV namespace not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Store token in KV with session ID as key
    await kvNamespace.put(`session:${sessionId}`, JSON.stringify(tokenData), {
      expirationTtl: 60 * 60 * 24 * 30 // 30 days
    });
    
    // Store instance mapping for easy lookup
    if (env.SESSION_SECRETS) {
      await env.SESSION_SECRETS.put(`instance:${instance}:${sessionId}`, sessionId, {
        expirationTtl: 60 * 60 * 24 * 30 // 30 days
      });
    }
    
    // Set cookie
    cookies.set('auth_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to store token:', error);
    return new Response(JSON.stringify({ error: 'Failed to store token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
