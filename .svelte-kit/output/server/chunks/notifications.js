import { map, atom, computed } from "nanostores";
import "./logger.js";
import i from "isomorphic-dompurify";
const MASTODON_CONFIG = {
  // Allowed tags for Mastodon content
  ALLOWED_TAGS: [
    "p",
    "br",
    "span",
    "a",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "del",
    "blockquote",
    "pre",
    "code",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    // Mastodon-specific tags
    "mention",
    "hashtag"
  ],
  // Allowed attributes
  ALLOWED_ATTR: [
    "href",
    "rel",
    "target",
    "class",
    "title",
    // Mastodon-specific attributes
    "data-user",
    "data-tag"
  ],
  // Force all links to open in new tab with secure rel
  ADD_ATTR: ["target", "rel"],
  // Remove dangerous tags completely
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  // Remove dangerous attributes
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"]
};
const URI_SAFE_PATTERN = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
const HTML_DECODE_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#x27": "'",
  "#39": "'"
};
const HTML_DECODE_PATTERN = /&(?:amp|lt|gt|quot|#x27|#39);/gi;
const TAG_STRIP_PATTERN = /<[^>]*>/g;
function decodeHtmlEntities(text) {
  return text.replace(HTML_DECODE_PATTERN, (match) => {
    const key = match.slice(1, -1).toLowerCase();
    return HTML_DECODE_MAP[key] ?? match;
  });
}
function stripTagsIteratively(value) {
  let current = value;
  let previous;
  do {
    previous = current;
    current = current.replace(TAG_STRIP_PATTERN, "");
  } while (current !== previous);
  return current;
}
let dompurifyCache = typeof window === "undefined" ? i : null;
let dompurifyPromise = typeof window === "undefined" ? Promise.resolve(i) : null;
if (typeof window !== "undefined") {
  ensureDomPurifyLoading();
}
function isDomPurifyInstance(value) {
  return value !== null && value !== false;
}
function ensureDomPurifyLoading() {
  if (typeof window === "undefined") {
    return;
  }
  if (dompurifyPromise) {
    return;
  }
  dompurifyCache = i;
  dompurifyPromise = Promise.resolve(i);
}
function getPurifierInstance() {
  return isDomPurifyInstance(dompurifyCache) ? dompurifyCache : i;
}
function sanitizeWithInstance(instance, html, config) {
  const normalized = decodeHtmlEntities(html);
  return instance.sanitize(normalized, {
    ...config,
    KEEP_CONTENT: true
  });
}
function enhanceMastodonMarkup(markup) {
  if (typeof document === "undefined") {
    return markup;
  }
  const div = document.createElement("div");
  div.innerHTML = markup;
  div.querySelectorAll("a").forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer ugc");
    const href = link.getAttribute("href");
    if (href && !href.startsWith("/") && !href.startsWith("#")) {
      link.classList.add("external-link");
    }
  });
  div.querySelectorAll(".mention").forEach((mention) => {
    mention.setAttribute("rel", "noopener noreferrer ugc");
  });
  return div.innerHTML;
}
function sanitizeMastodonHtml(html) {
  if (!html) return "";
  const config = {
    ...MASTODON_CONFIG,
    ALLOWED_URI_REGEXP: URI_SAFE_PATTERN
  };
  if (typeof window === "undefined") {
    return sanitizeWithInstance(getPurifierInstance(), html, config);
  }
  if (isDomPurifyInstance(dompurifyCache)) {
    const clean = sanitizeWithInstance(dompurifyCache, html, config);
    return enhanceMastodonMarkup(clean);
  }
  ensureDomPurifyLoading();
  return stripTagsIteratively(decodeHtmlEntities(html));
}
const notifications$ = map({});
atom(false);
atom(null);
const hasMoreNotifications$ = atom(true);
const endCursor$ = atom(null);
const notificationFilter$ = atom("all");
computed([notifications$], (notifications2) => {
  return Object.values(notifications2).length;
});
computed(
  [notifications$, notificationFilter$],
  (notifications2, filter) => {
    let filtered = Object.values(notifications2);
    if (filter !== "all") {
      filtered = filtered.filter((n) => n.type === filter);
    }
    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
);
computed([notifications$], (notifications2) => {
  const counts = {
    all: 0,
    mention: 0,
    status: 0,
    reblog: 0,
    follow: 0,
    follow_request: 0,
    favourite: 0,
    poll: 0,
    update: 0,
    "admin.sign_up": 0,
    "admin.report": 0
  };
  Object.values(notifications2).forEach((notification) => {
    counts.all++;
    const notificationType = notification.type;
    if (counts[notificationType] !== void 0) {
      counts[notificationType]++;
    }
  });
  return counts;
});
function cleanupNotifications() {
  notifications$.set({});
  endCursor$.set(null);
  hasMoreNotifications$.set(true);
}
const notifications = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  cleanupNotifications,
  endCursor$,
  hasMoreNotifications$,
  notificationFilter$,
  notifications$
}, Symbol.toStringTag, { value: "Module" }));
export {
  notifications as n,
  sanitizeMastodonHtml as s
};
