/**
 * Cloudflare Pages middleware for security headers
 */

import type { PagesFunction } from '@cloudflare/workers-types';

// Define CSP policy
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Astro/Svelte
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://*.mastodon.* https://*.masto.* https://*.social https://lesser.host https://ws.lesser.host wss://*.mastodon.* wss://*.masto.* wss://*.social wss://lesser.host wss://ws.lesser.host",
  "media-src 'self' https: blob:",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join('; ');

// Security headers configuration
const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

export const onRequest: PagesFunction = async (context) => {
  try {
    // Get the response from the next middleware or page
    const response = await context.next();
    
    // Clone the response to modify headers
    const newResponse = new Response(response.body, response);
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    
    // Add CORS headers for API routes
    const url = new URL(context.request.url);
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
      newResponse.headers.set('Access-Control-Allow-Origin', context.request.headers.get('Origin') || '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      
      // Handle preflight requests
      if (context.request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: newResponse.headers
        });
      }
    }
    
    // Add cache headers for static assets
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Security headers for HTML responses
    const contentType = newResponse.headers.get('Content-Type');
    if (contentType && contentType.includes('text/html')) {
      // Add nonce for inline scripts if needed
      const nonce = crypto.randomUUID();
      context.data.nonce = nonce;
      
      // Update CSP with nonce
      const cspWithNonce = CSP_POLICY.replace(
        "'unsafe-inline'",
        `'unsafe-inline' 'nonce-${nonce}'`
      );
      newResponse.headers.set('Content-Security-Policy', cspWithNonce);
    }
    
    return newResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return context.next();
  }
};