/**
 * Cloudflare Worker for handling OAuth operations
 * Provides secure storage for OAuth app credentials and tokens
 */

import type { EventContext } from '@cloudflare/workers-types';

interface Env {
  OAUTH_APPS: KVNamespace;
  AUTH_TOKENS: KVNamespace;
  SESSION_SECRETS: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path as string[];
  
  // Route to appropriate handler
  switch (path[0]) {
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
      return new Response('Not found', { status: 404 });
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
    const { instance, app } = await request.json() as {
      instance: string;
      app: any;
    };
    
    // Store app credentials in KV
    const key = `app:${instance}`;
    await env.OAUTH_APPS.put(key, JSON.stringify(app), {
      expirationTtl: 60 * 60 * 24 * 365 // 1 year
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
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
    const { instance, token } = await request.json() as {
      instance: string;
      token: any;
    };
    
    // Generate session ID
    const sessionId = crypto.randomUUID();
    
    // Store token data (we'll encrypt on client side for now)
    const tokenData = {
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
  } catch (error) {
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
    const { instance } = await request.json() as { instance: string };
    
    // Get session from cookie
    const cookieHeader = request.headers.get('Cookie');
    const sessionId = cookieHeader?.match(/auth_session=([^;]+)/)?.[1];
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'No session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get token data from session
    const tokenDataStr = await env.AUTH_TOKENS.get(`session:${sessionId}`);
    if (!tokenDataStr) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const tokenData = JSON.parse(tokenDataStr);
    
    // Verify instance matches
    if (tokenData.instance !== instance) {
      return new Response(JSON.stringify({ error: 'Token not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ token: tokenData.token }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
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
    const { instance } = await request.json() as { instance: string };
    
    // Get session from cookie
    const cookieHeader = request.headers.get('Cookie');
    const sessionId = cookieHeader?.match(/auth_session=([^;]+)/)?.[1];
    
    if (sessionId) {
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
  } catch (error) {
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
    
    if (!sessionId) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if session exists
    const tokenData = await env.AUTH_TOKENS.get(`session:${sessionId}`);
    
    return new Response(JSON.stringify({ valid: !!tokenData }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ valid: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}