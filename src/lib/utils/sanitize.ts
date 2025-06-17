/**
 * HTML sanitization utilities for preventing XSS attacks
 */

import DOMPurify from 'isomorphic-dompurify';

// Configure DOMPurify for Mastodon content
const MASTODON_CONFIG = {
  // Allowed tags for Mastodon content
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'a', 'strong', 'em', 'b', 'i', 'u', 's', 'del',
    'blockquote', 'pre', 'code', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Mastodon-specific tags
    'mention', 'hashtag'
  ],
  
  // Allowed attributes
  ALLOWED_ATTR: [
    'href', 'rel', 'target', 'class', 'title',
    // Mastodon-specific attributes
    'data-user', 'data-tag'
  ],
  
  // Force all links to open in new tab with secure rel
  ADD_ATTR: ['target', 'rel'],
  
  // Remove dangerous tags completely
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  
  // Remove dangerous attributes
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Sanitize HTML content from Mastodon posts
 */
export function sanitizeMastodonHtml(html: string): string {
  if (!html) return '';
  
  // Configure DOMPurify
  const clean = DOMPurify.sanitize(html, {
    ...MASTODON_CONFIG,
    // Add target="_blank" and rel="noopener noreferrer" to all links
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
  
  // Additional processing for Mastodon-specific elements
  const div = document.createElement('div');
  div.innerHTML = clean;
  
  // Process all links
  div.querySelectorAll('a').forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer ugc');
    
    // Add class for external links
    const href = link.getAttribute('href');
    if (href && !href.startsWith('/') && !href.startsWith('#')) {
      link.classList.add('external-link');
    }
  });
  
  // Process mentions
  div.querySelectorAll('.mention').forEach(mention => {
    mention.setAttribute('rel', 'noopener noreferrer ugc');
  });
  
  return div.innerHTML;
}

/**
 * Sanitize user-generated content for display names, bios, etc.
 */
export function sanitizeUserContent(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'b', 'i'],
    ALLOWED_ATTR: ['href', 'rel', 'target'],
    ADD_ATTR: ['target', 'rel'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * Strip all HTML tags from content (safe alternative to innerHTML)
 */
export function stripHtmlSafe(html: string): string {
  if (!html) return '';
  
  // Use DOMPurify with no allowed tags to strip all HTML
  return DOMPurify.sanitize(html, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check if content contains potentially dangerous HTML
 */
export function containsDangerousHtml(html: string): boolean {
  const dirty = html.toLowerCase();
  const dangerous = [
    '<script', 'javascript:', 'onerror=', 'onload=', 'onclick=',
    '<iframe', '<object', '<embed', '<form', '<input',
    'vbscript:', 'data:text/html', '<svg', '<math'
  ];
  
  return dangerous.some(pattern => dirty.includes(pattern));
}