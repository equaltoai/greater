/**
 * HTML sanitization utilities for preventing XSS attacks
 */

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
 * Basic HTML escaping for server-side rendering
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Simple server-side HTML sanitizer
 * Allows safe HTML tags while removing dangerous ones
 */
function serverSanitizeHtml(html: string): string {
  if (!html) return '';
  
  // First, normalize the HTML to handle already-escaped content
  let normalized = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
  
  // Remove script tags and their content
  normalized = normalized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  normalized = normalized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove dangerous event handlers
  normalized = normalized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  normalized = normalized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: URLs
  normalized = normalized.replace(/href\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'href="#"');
  
  // Build allowed tags regex
  const allowedTags = MASTODON_CONFIG.ALLOWED_TAGS.join('|');
  const tagRegex = new RegExp(`<\\/?(?:${allowedTags})(?:\\s[^>]*)?>`, 'gi');
  
  // Extract all allowed tags
  const allowedMatches = normalized.match(tagRegex) || [];
  
  // Replace all tags with placeholders
  let sanitized = normalized;
  const placeholders: string[] = [];
  
  allowedMatches.forEach((tag, index) => {
    const placeholder = `__SAFE_TAG_${index}__`;
    placeholders.push(tag);
    sanitized = sanitized.replace(tag, placeholder);
  });
  
  // Remove all remaining HTML tags (dangerous ones)
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  
  // Restore allowed tags
  placeholders.forEach((tag, index) => {
    const placeholder = `__SAFE_TAG_${index}__`;
    
    // For anchor tags, ensure they have safe attributes
    if (tag.toLowerCase().startsWith('<a ')) {
      tag = tag.replace(/target\s*=\s*["'][^"']*["']/gi, '');
      tag = tag.replace(/rel\s*=\s*["'][^"']*["']/gi, '');
      tag = tag.replace(/>/, ' target="_blank" rel="noopener noreferrer ugc">');
    }
    
    sanitized = sanitized.replace(placeholder, tag);
  });
  
  // Escape any remaining HTML entities properly
  sanitized = sanitized
    .replace(/&(?!(amp|lt|gt|quot|#x27|#\d+);)/g, '&amp;');
  
  return sanitized;
}

/**
 * Sanitize HTML content from Mastodon posts
 */
// Cache for DOMPurify instance
let dompurifyCache: any = null;
let dompurifyPromise: Promise<any> | null = null;

// Initialize DOMPurify loading on client side
if (typeof window !== 'undefined') {
  // Start loading DOMPurify immediately on client side
  dompurifyPromise = import('isomorphic-dompurify').then(module => {
    dompurifyCache = module.default;
    return dompurifyCache;
  }).catch((error) => {
    console.warn('Failed to load DOMPurify:', error);
    dompurifyCache = false;
    return false;
  });
}

export function sanitizeMastodonHtml(html: string): string {
  if (!html) return '';
  
  // For SSR, use our custom server-side sanitizer
  if (typeof window === 'undefined') {
    return serverSanitizeHtml(html);
  }
  
  // If DOMPurify is already loaded, use it
  if (dompurifyCache) {
    return sanitizeWithDOMPurify(dompurifyCache, html);
  }
  
  // If we haven't started loading DOMPurify yet, start the process
  if (!dompurifyPromise) {
    dompurifyPromise = import('isomorphic-dompurify').then(module => {
      dompurifyCache = module.default;
      return dompurifyCache;
    }).catch(() => {
      dompurifyCache = false; // Mark as unavailable
      return false;
    });
  }
  
  // For the first call, fall back to server sanitizer
  return serverSanitizeHtml(html);
}

function sanitizeWithDOMPurify(DOMPurify: any, html: string): string {
  try {
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
  } catch (error) {
    // Fallback to server-side sanitizer if DOMPurify fails
    console.warn('DOMPurify error, falling back to server sanitizer:', error);
    return serverSanitizeHtml(html);
  }
}

/**
 * Sanitize user-generated content for display names, bios, etc.
 */
export function sanitizeUserContent(html: string): string {
  if (!html) return '';
  
  // For SSR, use server sanitizer with limited tags
  if (typeof window === 'undefined') {
    // Create a simple version that only allows basic formatting
    const basicHtml = html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&');
    
    // Only allow very basic tags
    const basicAllowedTags = ['p', 'br', 'a', 'strong', 'em', 'b', 'i'];
    const basicTagRegex = new RegExp(`<\\/?(?:${basicAllowedTags.join('|')})(?:\\s[^>]*)?>`, 'gi');
    
    const matches = basicHtml.match(basicTagRegex) || [];
    let sanitized = basicHtml;
    
    // Replace allowed tags with placeholders
    const placeholders: string[] = [];
    matches.forEach((tag, index) => {
      const placeholder = `__BASIC_TAG_${index}__`;
      placeholders.push(tag);
      sanitized = sanitized.replace(tag, placeholder);
    });
    
    // Remove all other tags
    sanitized = sanitized.replace(/<[^>]+>/g, '');
    
    // Restore allowed tags
    placeholders.forEach((tag, index) => {
      sanitized = sanitized.replace(`__BASIC_TAG_${index}__`, tag);
    });
    
    return sanitized;
  }
  
  // If DOMPurify is available, use it
  if (dompurifyCache) {
    return dompurifyCache.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'b', 'i'],
      ALLOWED_ATTR: ['href', 'rel', 'target'],
      ADD_ATTR: ['target', 'rel'],
      ALLOW_DATA_ATTR: false
    });
  }
  
  // Start loading DOMPurify if not already started
  if (!dompurifyPromise) {
    dompurifyPromise = import('isomorphic-dompurify').then(module => {
      dompurifyCache = module.default;
      return dompurifyCache;
    }).catch(() => {
      dompurifyCache = false;
      return false;
    });
  }
  
  // Fallback to simple HTML escaping
  return escapeHtml(html);
}

/**
 * Strip all HTML tags from content (safe alternative to innerHTML)
 */
const TAG_STRIP_PATTERN = /<[^>]*>/g;

function stripTagsIteratively(value: string): string {
  let current = value;
  let previous: string;
  do {
    previous = current;
    current = current.replace(TAG_STRIP_PATTERN, '');
  } while (current !== previous);
  return current;
}

export function stripHtmlSafe(html: string): string {
  if (!html) return '';
  
  // First normalize any HTML entities
  let normalized = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
  
  // For SSR, use regex
  if (typeof window === 'undefined') {
    return stripTagsIteratively(normalized);
  }
  
  // If DOMPurify is available, use it
  if (dompurifyCache) {
    return dompurifyCache.sanitize(normalized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }
  
  // Start loading DOMPurify if not already started
  if (!dompurifyPromise) {
    dompurifyPromise = import('isomorphic-dompurify').then(module => {
      dompurifyCache = module.default;
      return dompurifyCache;
    }).catch(() => {
      dompurifyCache = false;
      return false;
    });
  }
  
  // Fallback to regex for immediate use and repeat until no tags remain
  return stripTagsIteratively(normalized);
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
