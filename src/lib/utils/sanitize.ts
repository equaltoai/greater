import DOMPurifyModule from 'isomorphic-dompurify';

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

const URI_SAFE_PATTERN = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

type DomPurifyInstance = typeof DOMPurifyModule;

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
};

const HTML_ESCAPE_PATTERN = /[&<>"']/g;

const HTML_DECODE_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#x27': "'",
  '#39': "'"
};

const HTML_DECODE_PATTERN = /&(?:amp|lt|gt|quot|#x27|#39);/gi;

const TAG_STRIP_PATTERN = /<[^>]*>/g;

function decodeHtmlEntities(text: string): string {
  return text.replace(HTML_DECODE_PATTERN, match => {
    const key = match.slice(1, -1).toLowerCase();
    return HTML_DECODE_MAP[key] ?? match;
  });
}

function stripTagsIteratively(value: string): string {
  let current = value;
  let previous: string;
  do {
    previous = current;
    current = current.replace(TAG_STRIP_PATTERN, '');
  } while (current !== previous);
  return current;
}

/**
 * Basic HTML escaping for server-side rendering
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(HTML_ESCAPE_PATTERN, char => HTML_ESCAPE_MAP[char]);
}

/**
 * Sanitize HTML content from Mastodon posts
 */
// Cache for DOMPurify instance
let dompurifyCache: DomPurifyInstance | false | null =
  typeof window === 'undefined' ? DOMPurifyModule : null;
let dompurifyPromise: Promise<DomPurifyInstance | false> | null =
  typeof window === 'undefined' ? Promise.resolve(DOMPurifyModule) : null;

// Initialize DOMPurify loading on client side
if (typeof window !== 'undefined') {
  // Start loading DOMPurify immediately on client side
  ensureDomPurifyLoading();
}

function isDomPurifyInstance(
  value: DomPurifyInstance | false | null
): value is DomPurifyInstance {
  return value !== null && value !== false;
}

function ensureDomPurifyLoading(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  if (dompurifyPromise) {
    return;
  }
  
  dompurifyCache = DOMPurifyModule;
  dompurifyPromise = Promise.resolve(DOMPurifyModule);
}

function getPurifierInstance(): DomPurifyInstance {
  return isDomPurifyInstance(dompurifyCache) ? dompurifyCache : DOMPurifyModule;
}

function sanitizeWithInstance(
  instance: DomPurifyInstance,
  html: string,
  config: Record<string, unknown>
): string {
  const normalized = decodeHtmlEntities(html);
  return instance.sanitize(normalized, {
    ...config,
    KEEP_CONTENT: true
  });
}

function enhanceMastodonMarkup(markup: string): string {
  if (typeof document === 'undefined') {
    return markup;
  }
  
  const div = document.createElement('div');
  div.innerHTML = markup;
  
  div.querySelectorAll('a').forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer ugc');
    
    const href = link.getAttribute('href');
    if (href && !href.startsWith('/') && !href.startsWith('#')) {
      link.classList.add('external-link');
    }
  });
  
  div.querySelectorAll('.mention').forEach(mention => {
    mention.setAttribute('rel', 'noopener noreferrer ugc');
  });
  
  return div.innerHTML;
}

function enforceSafeLinks(markup: string): string {
  if (typeof document === 'undefined') {
    return markup;
  }
  
  const div = document.createElement('div');
  div.innerHTML = markup;
  
  div.querySelectorAll('a').forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer ugc');
  });
  
  return div.innerHTML;
}

export function sanitizeMastodonHtml(html: string): string {
  if (!html) return '';
  const config = {
    ...MASTODON_CONFIG,
    ALLOWED_URI_REGEXP: URI_SAFE_PATTERN
  };
  
  if (typeof window === 'undefined') {
    return sanitizeWithInstance(getPurifierInstance(), html, config);
  }
  
  if (isDomPurifyInstance(dompurifyCache)) {
    const clean = sanitizeWithInstance(dompurifyCache, html, config);
    return enhanceMastodonMarkup(clean);
  }
  
  ensureDomPurifyLoading();
  return stripTagsIteratively(decodeHtmlEntities(html));
}

/**
 * Sanitize user-generated content for display names, bios, etc.
 */
export function sanitizeUserContent(html: string): string {
  if (!html) return '';
  const config = {
    ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'b', 'i'],
    ALLOWED_ATTR: ['href', 'rel', 'target'],
    ADD_ATTR: ['target', 'rel'],
    ALLOW_DATA_ATTR: false
  };
  
  if (typeof window === 'undefined') {
    return sanitizeWithInstance(getPurifierInstance(), html, config);
  }
  
  if (isDomPurifyInstance(dompurifyCache)) {
    const clean = sanitizeWithInstance(dompurifyCache, html, config);
    return enforceSafeLinks(clean);
  }
  
  ensureDomPurifyLoading();
  return stripTagsIteratively(decodeHtmlEntities(html));
}

/**
 * Strip all HTML tags from content (safe alternative to innerHTML)
 */
export function stripHtmlSafe(html: string): string {
  if (!html) return '';
  
  const normalized = decodeHtmlEntities(html);
  const instance = isDomPurifyInstance(dompurifyCache)
    ? dompurifyCache
    : (typeof window === 'undefined' ? DOMPurifyModule : null);
  
  if (instance) {
    return instance.sanitize(normalized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }
  
  ensureDomPurifyLoading();
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
