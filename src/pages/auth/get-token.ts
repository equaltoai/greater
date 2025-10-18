import type { APIRoute } from 'astro';

interface OAuthToken {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
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
    
    const body = await request.json() as { instance: string };
    const { instance } = body;
    
    // Normalize instance URL to include https://
    let normalizedInstance = instance.trim().toLowerCase();
    normalizedInstance = normalizedInstance.replace(/^https?:\/\//, '');
    normalizedInstance = normalizedInstance.replace(/\/$/, '');
    normalizedInstance = `https://${normalizedInstance}`;
    
    // First try the instance-based approach
    const instanceKey = `token:${normalizedInstance}`;
    
    const kvNamespace = env.SESSIONS;
    if (!kvNamespace) {
      return new Response(JSON.stringify({ error: 'KV namespace not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const instanceToken = await kvNamespace.get(instanceKey);
    
    if (instanceToken !== null) {
      const token = JSON.parse(instanceToken) as OAuthToken;
      return new Response(JSON.stringify({ token }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Try to get from session cookie
    const sessionId = cookies.get('auth_session')?.value;
    if (sessionId) {
      const tokenDataStr = await kvNamespace.get(`session:${sessionId}`);
      
      if (tokenDataStr) {
        const tokenData = JSON.parse(tokenDataStr) as { token: OAuthToken; instance: string };
        if (tokenData.instance === normalizedInstance) {
          return new Response(JSON.stringify({ token: tokenData.token }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    return new Response(JSON.stringify({ error: 'No token found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to get token:', error);
    return new Response(JSON.stringify({ error: 'Failed to get token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
