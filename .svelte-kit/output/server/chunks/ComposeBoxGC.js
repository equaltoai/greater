import { Y as hash, Z as ssr_context, _ as attr, $ as attr_style, X as stringify, Q as escape_html, V as attr_class, a0 as clsx, F as FILENAME, N as head, T as ensure_array_like, K as setContext, O as getContext, a1 as bind_props } from "./index.js";
import { p as prevent_snippet_stringification } from "./validate.js";
import { v as validate_snippet_args, p as push_element, a as pop_element } from "./dev.js";
import { b as authStore, U as User, c as Building, G as Globe } from "./auth.svelte.js";
import { s as sanitizeMastodonHtml } from "./notifications.js";
import "isomorphic-dompurify";
import { g as getGraphQLAdapter } from "./graphql-client.js";
import { l as logDebug } from "./logger.js";
function html(value) {
  var html2 = String(value ?? "");
  var open = `<!--${hash(html2)}-->`;
  return open + html2 + "<!---->";
}
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
let r = 0;
function t$1(e = "greater") {
  return `${e}-${++r}`;
}
function t(r2) {
  return r2.key === "Enter" || r2.key === " " || r2.key === "Spacebar";
}
function j(n = {}) {
  const {
    type: r2 = "button",
    disabled: g = false,
    loading: p = false,
    pressed: E = false,
    id: L,
    label: f,
    onClick: b,
    onPressedChange: m,
    onKeyDown: y,
    onFocus: k,
    onBlur: A,
    onDestroy: v
  } = n;
  let i = null;
  const D = {
    disabled: g,
    loading: p,
    pressed: E,
    id: L || t$1("button"),
    focused: false
  }, t$2 = new Proxy(D, {
    set(e, s, c) {
      const K = e[s];
      return e[s] = c, s === "pressed" && K !== c && m?.(c), h(), true;
    }
  });
  function h() {
    i && d(i);
  }
  function o(e) {
    if (t$2.disabled || t$2.loading) {
      e.preventDefault(), e.stopPropagation();
      return;
    }
    b?.(e);
  }
  function u(e) {
    if (!(t$2.disabled || t$2.loading)) {
      if (t(e) && (e.preventDefault(), i && b)) {
        const s = new MouseEvent("click", {
          bubbles: true,
          cancelable: true
        });
        o(s);
      }
      y?.(e);
    }
  }
  function a(e) {
    t$2.focused = true, k?.(e);
  }
  function l(e) {
    t$2.focused = false, A?.(e);
  }
  function w(e) {
    return i = e, e.setAttribute("type", r2), e.id = t$2.id, d(e), e.addEventListener("click", o), e.addEventListener("keydown", u), e.addEventListener("focus", a), e.addEventListener("blur", l), {
      update() {
        d(e);
      },
      destroy() {
        e.removeEventListener("click", o), e.removeEventListener("keydown", u), e.removeEventListener("focus", a), e.removeEventListener("blur", l), i = null, v?.();
      }
    };
  }
  function d(e) {
    const s = !t$2.disabled && !t$2.loading;
    e.disabled = t$2.disabled || t$2.loading, e.setAttribute("aria-disabled", String(t$2.disabled || t$2.loading)), e.setAttribute("aria-busy", String(t$2.loading)), e.setAttribute("aria-pressed", String(t$2.pressed)), f && e.setAttribute("aria-label", f), s ? e.removeAttribute("tabindex") : e.setAttribute("tabindex", "-1");
  }
  function B() {
    i && !t$2.disabled && !t$2.loading && i.click();
  }
  function M() {
    i && !t$2.disabled && i.focus();
  }
  function P() {
    i && i.blur();
  }
  function x() {
    t$2.pressed = !t$2.pressed;
  }
  function I(e) {
    t$2.disabled = e;
  }
  function S(e) {
    t$2.loading = e;
  }
  function C(e) {
    t$2.pressed = e;
  }
  function H() {
    if (i) {
      const e = i;
      e.removeEventListener("click", o), e.removeEventListener("keydown", u), e.removeEventListener("focus", a), e.removeEventListener("blur", l), i = null;
    }
    v?.();
  }
  return {
    state: t$2,
    actions: {
      button: w
    },
    helpers: {
      click: B,
      focus: M,
      blur: P,
      toggle: x,
      setDisabled: I,
      setLoading: S,
      setPressed: C,
      destroy: H
    }
  };
}
Avatar[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components@file+..+greater-components+packages+greater-components_re_b4c086aa19ba9ae4cdaac7df975eaac6/node_modules/@equaltoai/greater-components/dist/primitives/src/components/Avatar.svelte";
function Avatar($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        src,
        alt,
        name = "",
        size = "md",
        shape = "circle",
        loading = false,
        status,
        statusPosition = "bottom-right",
        class: className = "",
        fallback,
        id,
        style,
        onclick,
        onmouseenter,
        onmouseleave,
        onfocus,
        onblur,
        onkeydown,
        onkeyup,
        role,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledby,
        "aria-describedby": ariaDescribedby,
        tabindex
      } = $$props;
      const INTERACTIVE_ROLES = /* @__PURE__ */ new Set([
        "button",
        "checkbox",
        "combobox",
        "link",
        "menuitem",
        "menuitemcheckbox",
        "menuitemradio",
        "option",
        "radio",
        "searchbox",
        "slider",
        "spinbutton",
        "switch",
        "tab",
        "textbox",
        "treeitem"
      ]);
      const parsedTabIndex = () => {
        if (tabindex === void 0 || tabindex === null) {
          return void 0;
        }
        if (typeof tabindex === "number") {
          return Number.isFinite(tabindex) ? tabindex : void 0;
        }
        const numericValue = Number(tabindex);
        return Number.isFinite(numericValue) ? numericValue : void 0;
      };
      const hasInteractiveHandlers = () => Boolean(onclick || onkeydown || onkeyup);
      const isInteractiveRole = (roleValue) => {
        if (!roleValue) {
          return false;
        }
        return INTERACTIVE_ROLES.has(roleValue);
      };
      const isInteractive = () => {
        if (isInteractiveRole(role)) {
          return true;
        }
        if (hasInteractiveHandlers) {
          return true;
        }
        if (parsedTabIndex !== void 0 && parsedTabIndex >= 0) {
          return true;
        }
        return false;
      };
      const avatarClass = () => {
        const classes = [
          "gr-avatar",
          `gr-avatar--${size}`,
          `gr-avatar--${shape}`,
          loading && "gr-avatar--loading",
          status && "gr-avatar--has-status",
          className
        ].filter(Boolean).join(" ");
        return classes;
      };
      const statusClass = () => {
        if (!status) return "";
        const classes = [
          "gr-avatar__status",
          `gr-avatar__status--${status}`,
          `gr-avatar__status--${statusPosition}`
        ].filter(Boolean).join(" ");
        return classes;
      };
      const initials = () => {
        if (!name) return "";
        const words = name.trim().split(/\s+/);
        if (words.length === 1) {
          return words[0].substring(0, 2).toUpperCase();
        } else {
          return words.slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
        }
      };
      const initialsBackgroundColor = () => {
        if (!name) return "var(--gr-semantic-background-secondary)";
        let hash2 = 0;
        for (let i = 0; i < name.length; i++) {
          hash2 = name.charCodeAt(i) + ((hash2 << 5) - hash2);
        }
        const hue = Math.abs(hash2) % 360;
        return `hsl(${hue}, 65%, 55%)`;
      };
      const accessibleName = () => {
        if (alt) return alt;
        if (name) return name;
        return "Avatar";
      };
      const statusId = `avatar-status-${Math.random().toString(36).substr(2, 9)}`;
      prevent_snippet_stringification(AvatarContent);
      function AvatarContent($$renderer3) {
        validate_snippet_args($$renderer3);
        if (loading) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="gr-avatar__loading" aria-hidden="true">`);
          push_element($$renderer3, "div", 190, 4);
          $$renderer3.push(`<svg class="gr-avatar__spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`);
          push_element($$renderer3, "svg", 191, 6);
          $$renderer3.push(`<path d="M21 12a9 9 0 11-6.219-8.56">`);
          push_element($$renderer3, "path", 202, 8);
          $$renderer3.push(`</path>`);
          pop_element();
          $$renderer3.push(`</svg>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
        } else {
          $$renderer3.push("<!--[!-->");
          if (src && true) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<img class="gr-avatar__image"${attr("src", src)}${attr("alt", alt || name || "Avatar")}${attr_style(`display: ${stringify("none")}`)} onload="this.__e=event" onerror="this.__e=event"/>`);
            push_element($$renderer3, "img", 206, 4);
            pop_element();
            $$renderer3.push(` `);
            {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="gr-avatar__placeholder" aria-hidden="true">`);
              push_element($$renderer3, "div", 217, 6);
              if (initials) {
                $$renderer3.push("<!--[-->");
                $$renderer3.push(`<span class="gr-avatar__initials"${attr_style(`background-color: ${stringify(initialsBackgroundColor())}`)}>`);
                push_element($$renderer3, "span", 219, 10);
                $$renderer3.push(`${escape_html(initials)}</span>`);
                pop_element();
              } else {
                $$renderer3.push("<!--[!-->");
                if (fallback) {
                  $$renderer3.push("<!--[-->");
                  fallback($$renderer3);
                  $$renderer3.push(`<!---->`);
                } else {
                  $$renderer3.push("<!--[!-->");
                  $$renderer3.push(`<svg class="gr-avatar__fallback-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">`);
                  push_element($$renderer3, "svg", 228, 10);
                  $$renderer3.push(`<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z">`);
                  push_element($$renderer3, "path", 235, 12);
                  $$renderer3.push(`</path>`);
                  pop_element();
                  $$renderer3.push(`</svg>`);
                  pop_element();
                }
                $$renderer3.push(`<!--]-->`);
              }
              $$renderer3.push(`<!--]--></div>`);
              pop_element();
            }
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push("<!--[!-->");
            $$renderer3.push(`<div class="gr-avatar__placeholder" aria-hidden="true">`);
            push_element($$renderer3, "div", 242, 4);
            if (initials) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span class="gr-avatar__initials"${attr_style(`background-color: ${stringify(initialsBackgroundColor())}; color: white;`)}>`);
              push_element($$renderer3, "span", 244, 8);
              $$renderer3.push(`${escape_html(initials)}</span>`);
              pop_element();
            } else {
              $$renderer3.push("<!--[!-->");
              if (fallback) {
                $$renderer3.push("<!--[-->");
                fallback($$renderer3);
                $$renderer3.push(`<!---->`);
              } else {
                $$renderer3.push("<!--[!-->");
                $$renderer3.push(`<svg class="gr-avatar__fallback-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">`);
                push_element($$renderer3, "svg", 253, 8);
                $$renderer3.push(`<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z">`);
                push_element($$renderer3, "path", 260, 10);
                $$renderer3.push(`</path>`);
                pop_element();
                $$renderer3.push(`</svg>`);
                pop_element();
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]--></div>`);
            pop_element();
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--> `);
        if (status) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div${attr_class(clsx(statusClass()))}${attr("id", statusId)} role="status"${attr("aria-label", `Status: ${status}`)}>`);
          push_element($$renderer3, "div", 267, 4);
          $$renderer3.push(`</div>`);
          pop_element();
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      }
      if (isInteractive) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button${attr_class(clsx(avatarClass()))}${attr("aria-label", ariaLabel ?? accessibleName())}${attr("aria-labelledby", ariaLabelledby)}${attr("aria-describedby", ariaDescribedby ?? (status ? statusId : void 0))}${attr("id", id)}${attr_style(style)}${attr("role", role)}${attr("tabindex", parsedTabIndex)} type="button">`);
        push_element($$renderer2, "button", 277, 2);
        AvatarContent($$renderer2);
        $$renderer2.push(`<!----></button>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div${attr_class(clsx(avatarClass()))}${attr("role", role ?? "img")}${attr("aria-label", ariaLabel ?? accessibleName())}${attr("aria-labelledby", ariaLabelledby)}${attr("aria-describedby", ariaDescribedby ?? (status ? statusId : void 0))}${attr("id", id)}${attr_style(style)}>`);
        push_element($$renderer2, "div", 298, 2);
        AvatarContent($$renderer2);
        $$renderer2.push(`<!----></div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]-->`);
    },
    Avatar
  );
}
Avatar.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Skeleton[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components@file+..+greater-components+packages+greater-components_re_b4c086aa19ba9ae4cdaac7df975eaac6/node_modules/@equaltoai/greater-components/dist/primitives/src/components/Skeleton.svelte";
function Skeleton($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        variant = "text",
        width,
        height,
        animation = "pulse",
        class: className = "",
        loading = true,
        children,
        id,
        style: styleProp,
        onclick,
        onmouseenter,
        onmouseleave,
        onfocus,
        onblur,
        onkeydown,
        onkeyup,
        role,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledby,
        "aria-describedby": ariaDescribedby,
        tabindex
      } = $$props;
      const INTERACTIVE_ROLES = /* @__PURE__ */ new Set([
        "button",
        "checkbox",
        "combobox",
        "link",
        "menuitem",
        "menuitemcheckbox",
        "menuitemradio",
        "option",
        "radio",
        "searchbox",
        "slider",
        "spinbutton",
        "switch",
        "tab",
        "textbox",
        "treeitem"
      ]);
      const parsedTabIndex = () => {
        if (tabindex === void 0 || tabindex === null) {
          return void 0;
        }
        if (typeof tabindex === "number") {
          return Number.isFinite(tabindex) ? tabindex : void 0;
        }
        const numericValue = Number(tabindex);
        return Number.isFinite(numericValue) ? numericValue : void 0;
      };
      const hasInteractiveHandlers = () => Boolean(onclick || onkeydown || onkeyup);
      const isInteractiveRole = (roleValue) => {
        if (!roleValue) {
          return false;
        }
        return INTERACTIVE_ROLES.has(roleValue);
      };
      const isInteractive = () => {
        if (isInteractiveRole(role)) {
          return true;
        }
        if (hasInteractiveHandlers) {
          return true;
        }
        if (parsedTabIndex !== void 0 && parsedTabIndex >= 0) {
          return true;
        }
        return false;
      };
      const skeletonClass = () => {
        const classes = [
          "gr-skeleton",
          `gr-skeleton--${variant}`,
          animation !== "none" && `gr-skeleton--${animation}`,
          className
        ].filter(Boolean).join(" ");
        return classes;
      };
      const skeletonStyle = () => {
        const styles = {};
        if (width !== void 0) {
          styles.width = typeof width === "number" ? `${width}px` : width;
        }
        if (height !== void 0) {
          styles.height = typeof height === "number" ? `${height}px` : height;
        }
        if (variant === "text") {
          if (!height) styles.height = "1em";
          if (!width) styles.width = "100%";
        } else if (variant === "circular") {
          const size = width || height || "40px";
          styles.width = typeof size === "number" ? `${size}px` : size;
          styles.height = typeof size === "number" ? `${size}px` : size;
        } else if (variant === "rectangular" || variant === "rounded") {
          if (!width) styles.width = "100%";
          if (!height) styles.height = "120px";
        }
        const baseStyle = Object.entries(styles).map(([key, value]) => `${key}: ${value}`).join("; ");
        return styleProp ? `${baseStyle}; ${styleProp}` : baseStyle;
      };
      prevent_snippet_stringification(SkeletonContent);
      function SkeletonContent($$renderer3) {
        validate_snippet_args($$renderer3);
        if (animation === "wave") {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="gr-skeleton__wave">`);
          push_element($$renderer3, "div", 140, 4);
          $$renderer3.push(`</div>`);
          pop_element();
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      }
      if (loading) {
        $$renderer2.push("<!--[-->");
        if (isInteractive) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button${attr_class(clsx(skeletonClass()))}${attr_style(skeletonStyle())}${attr("role", role)}${attr("aria-label", ariaLabel ?? "Loading")}${attr("aria-labelledby", ariaLabelledby)}${attr("aria-describedby", ariaDescribedby)}${attr("id", id)}${attr("tabindex", parsedTabIndex)} type="button">`);
          push_element($$renderer2, "button", 146, 4);
          SkeletonContent($$renderer2);
          $$renderer2.push(`<!----></button>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<div${attr_class(clsx(skeletonClass()))}${attr_style(skeletonStyle())} aria-hidden="true"${attr("role", role ?? "status")}${attr("aria-label", ariaLabel ?? "Loading")}${attr("aria-labelledby", ariaLabelledby)}${attr("aria-describedby", ariaDescribedby)}${attr("id", id)}>`);
          push_element($$renderer2, "div", 167, 4);
          SkeletonContent($$renderer2);
          $$renderer2.push(`<!----></div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (children) {
          $$renderer2.push("<!--[-->");
          children($$renderer2);
          $$renderer2.push(`<!---->`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    },
    Skeleton
  );
}
Skeleton.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
const PREFERENCES_KEY = "gr-preferences-v1";
const DEFAULT_PREFERENCES = {
  colorScheme: "auto",
  density: "comfortable",
  fontSize: "medium",
  motion: "normal",
  customColors: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899"
  },
  highContrastMode: false,
  fontScale: 1
};
function clonePreferences(preferences) {
  return {
    ...preferences,
    customColors: {
      ...preferences.customColors
    }
  };
}
function mergePreferences(base, updates) {
  const next = {
    ...base,
    ...updates
  };
  next.customColors = {
    ...base.customColors,
    ...updates.customColors ?? {}
  };
  return clonePreferences(next);
}
class PreferencesStore {
  constructor() {
    this._preferences = clonePreferences(DEFAULT_PREFERENCES);
    this._systemColorScheme = "light";
    this._systemMotion = "normal";
    this._systemHighContrast = false;
    this.loadPreferences();
    this.setupSystemPreferenceDetection();
    this.applyTheme();
  }
  // Getters using $derived for computed values
  get preferences() {
    return clonePreferences(this._preferences);
  }
  get state() {
    const { customColors, ...rest } = this._preferences;
    return {
      ...rest,
      customColors: {
        ...customColors
      },
      systemColorScheme: this._systemColorScheme,
      systemMotion: this._systemMotion,
      systemHighContrast: this._systemHighContrast,
      resolvedColorScheme: this.resolvedColorScheme
    };
  }
  get resolvedColorScheme() {
    if (this._preferences.highContrastMode || this._systemHighContrast) {
      return "high-contrast";
    }
    if (this._preferences.colorScheme === "auto") {
      return this._systemColorScheme;
    }
    if (this._preferences.colorScheme === "high-contrast") {
      return "high-contrast";
    }
    return this._preferences.colorScheme;
  }
  get resolvedMotion() {
    if (this._systemMotion === "reduced") {
      return "reduced";
    }
    return this._preferences.motion;
  }
  // Methods to update preferences
  setColorScheme(scheme) {
    this._preferences.colorScheme = scheme;
    this.saveAndApply();
  }
  setDensity(density) {
    this._preferences.density = density;
    this.saveAndApply();
  }
  setFontSize(size) {
    this._preferences.fontSize = size;
    this.saveAndApply();
  }
  setFontScale(scale) {
    this._preferences.fontScale = Math.max(0.85, Math.min(1.5, scale));
    this.saveAndApply();
  }
  setMotion(motion) {
    this._preferences.motion = motion;
    this.saveAndApply();
  }
  setCustomColors(colors) {
    this._preferences.customColors = {
      ...this._preferences.customColors,
      ...colors
    };
    this.saveAndApply();
  }
  setHighContrastMode(enabled) {
    this._preferences.highContrastMode = enabled;
    this.saveAndApply();
  }
  updatePreferences(updates) {
    this._preferences = mergePreferences(this._preferences, updates);
    this.saveAndApply();
  }
  // Reset to defaults
  reset() {
    this._preferences = clonePreferences(DEFAULT_PREFERENCES);
    this.saveAndApply();
  }
  // Export current preferences as JSON
  export() {
    return JSON.stringify(this._preferences, null, 2);
  }
  // Import preferences from JSON
  import(json) {
    try {
      const imported = JSON.parse(json);
      if (this.validatePreferences(imported)) {
        this._preferences = mergePreferences(DEFAULT_PREFERENCES, imported);
        this.saveAndApply();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  // Private methods
  loadPreferences() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (this.validatePreferences(parsed)) {
          this._preferences = mergePreferences(DEFAULT_PREFERENCES, parsed);
        }
      }
    } catch (error) {
      console.warn("Failed to load preferences from localStorage:", error);
    }
  }
  savePreferences() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(this._preferences));
    } catch (error) {
      console.warn("Failed to save preferences to localStorage:", error);
    }
  }
  saveAndApply() {
    this.savePreferences();
    this.applyTheme();
  }
  validatePreferences(prefs) {
    const validColorSchemes = ["light", "dark", "high-contrast", "auto"];
    const validDensities = ["compact", "comfortable", "spacious"];
    const validFontSizes = ["small", "medium", "large"];
    const validMotion = ["normal", "reduced"];
    if (prefs.colorScheme && !validColorSchemes.includes(prefs.colorScheme)) {
      return false;
    }
    if (prefs.density && !validDensities.includes(prefs.density)) {
      return false;
    }
    if (prefs.fontSize && !validFontSizes.includes(prefs.fontSize)) {
      return false;
    }
    if (prefs.motion && !validMotion.includes(prefs.motion)) {
      return false;
    }
    return true;
  }
  setupSystemPreferenceDetection() {
    if (typeof window === "undefined") return;
    this.darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this._systemColorScheme = this.darkModeQuery.matches ? "dark" : "light";
    this.darkModeQuery.addEventListener("change", (e) => {
      this._systemColorScheme = e.matches ? "dark" : "light";
      if (this._preferences.colorScheme === "auto") {
        this.applyTheme();
      }
    });
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this._systemMotion = this.reducedMotionQuery.matches ? "reduced" : "normal";
    this.reducedMotionQuery.addEventListener("change", (e) => {
      this._systemMotion = e.matches ? "reduced" : "normal";
      this.applyTheme();
    });
    this.highContrastQuery = window.matchMedia("(prefers-contrast: high)");
    this._systemHighContrast = this.highContrastQuery.matches;
    this.highContrastQuery.addEventListener("change", (e) => {
      this._systemHighContrast = e.matches;
      this.applyTheme();
    });
  }
  applyTheme() {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", this.resolvedColorScheme);
    root.setAttribute("data-density", this._preferences.density);
    root.setAttribute("data-font-size", this._preferences.fontSize);
    root.setAttribute("data-motion", this.resolvedMotion);
    this.applyCustomProperties();
  }
  applyCustomProperties() {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (this._preferences.customColors.primary) {
      root.style.setProperty("--gr-custom-primary", this._preferences.customColors.primary);
    }
    if (this._preferences.customColors.secondary) {
      root.style.setProperty("--gr-custom-secondary", this._preferences.customColors.secondary);
    }
    if (this._preferences.customColors.accent) {
      root.style.setProperty("--gr-custom-accent", this._preferences.customColors.accent);
    }
    root.style.setProperty("--gr-font-scale", String(this._preferences.fontScale));
    const densityScale = {
      compact: 0.85,
      comfortable: 1,
      spacious: 1.2
    };
    root.style.setProperty("--gr-density-scale", String(densityScale[this._preferences.density]));
  }
  // Cleanup method
  destroy() {
    if (this.darkModeQuery) ;
  }
}
new PreferencesStore();
BaseLayout[FILENAME] = "src/lib/layouts/BaseLayout.svelte";
function BaseLayout($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        title = "Greater",
        description = "A modern Mastodon client",
        children
      } = $$props;
      head("1q4t6f0", $$renderer2, ($$renderer3) => {
        $$renderer3.push(`<meta name="description"${attr("content", description)}/>`);
        push_element($$renderer3, "meta", 22, 2);
        pop_element();
        $$renderer3.push(` <meta property="og:title"${attr("content", title)}/>`);
        push_element($$renderer3, "meta", 23, 2);
        pop_element();
        $$renderer3.push(` <meta property="og:description"${attr("content", description)}/>`);
        push_element($$renderer3, "meta", 24, 2);
        pop_element();
      });
      $$renderer2.push(`<div class="base-layout svelte-1q4t6f0">`);
      push_element($$renderer2, "div", 27, 0);
      children($$renderer2);
      $$renderer2.push(`<!----></div>`);
      pop_element();
    },
    BaseLayout
  );
}
BaseLayout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
function coalesceBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }
  return void 0;
}
function resolveFavouritedFlag(source) {
  return coalesceBoolean(
    source?.userInteractions?.liked,
    source?.viewerInteractions?.liked,
    source?.viewerState?.liked,
    source?.favourited,
    source?.favorited,
    source?.liked
  ) ?? false;
}
function resolveRebloggedFlag(source) {
  return coalesceBoolean(
    source?.userInteractions?.shared,
    source?.viewerInteractions?.shared,
    source?.viewerState?.shared,
    source?.reblogged,
    source?.shared
  ) ?? false;
}
function resolveBookmarkedFlag(source) {
  return coalesceBoolean(
    source?.userInteractions?.bookmarked,
    source?.viewerInteractions?.bookmarked,
    source?.viewerState?.bookmarked,
    source?.bookmarked
  ) ?? false;
}
function resolvePinnedFlag(source) {
  return coalesceBoolean(
    source?.userInteractions?.pinned,
    source?.viewerInteractions?.pinned,
    source?.viewerState?.pinned,
    source?.pinned
  ) ?? false;
}
function mapGraphQLActorToAccount(actor) {
  const attachmentFields = (actor.attachment ?? []).filter(
    (attachment) => attachment.type === "PropertyValue"
  );
  const normalizedFields = Array.isArray(actor.fields) && actor.fields.length > 0 ? actor.fields.map((field) => ({
    name: field.name ?? "",
    value: field.value ?? "",
    verified_at: field.verifiedAt ?? null
  })) : attachmentFields.map((attachment) => ({
    name: attachment.name ?? "",
    value: attachment.value ?? "",
    verified_at: null
  }));
  const avatarUrl = actor.icon?.url ?? actor.avatar ?? "";
  const headerUrl = actor.image?.url ?? actor.header ?? "";
  const acctHandle = actor.webfinger ?? actor.acct ?? (actor.domain && actor.username ? `${actor.username}@${actor.domain}` : void 0) ?? actor.preferredUsername ?? actor.username ?? actor.id;
  const statusesCount = typeof actor.statusesCount === "number" ? actor.statusesCount : resolveCount(actor.outbox);
  return {
    id: actor.id,
    username: actor.preferredUsername ?? actor.username ?? actor.id,
    acct: acctHandle,
    display_name: actor.name ?? actor.displayName ?? actor.preferredUsername ?? actor.username ?? "",
    locked: actor.manuallyApprovesFollowers ?? actor.locked ?? false,
    bot: actor.type === "Service" || actor.bot === true,
    discoverable: actor.discoverable ?? true,
    group: actor.type === "Group",
    created_at: actor.published ?? actor.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    note: actor.summary ?? "",
    url: actor.url ?? actor.id,
    avatar: avatarUrl,
    avatar_static: avatarUrl,
    header: headerUrl,
    header_static: headerUrl,
    followers_count: resolveCount(actor.followers),
    following_count: resolveCount(actor.following),
    statuses_count: statusesCount,
    last_status_at: null,
    emojis: [],
    fields: normalizedFields
  };
}
function resolveCount(value) {
  if (typeof value === "number") {
    return value;
  }
  return value?.totalCount ?? 0;
}
const CATEGORY_TO_ATTACHMENT = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  GIFV: "gifv",
  DOCUMENT: "unknown",
  UNKNOWN: "unknown"
};
function mapGraphQLMediaToAttachment(media, warnings = void 0) {
  if (!media) {
    return {
      id: "",
      type: "unknown",
      url: "",
      preview_url: "",
      remote_url: null,
      description: null,
      blurhash: null,
      meta: warnings?.length ? { warnings: [...warnings] } : void 0
    };
  }
  const legacy = media;
  const snakePreview = legacy.preview_url ?? void 0;
  const snakeRemote = legacy.remote_url ?? void 0;
  const snakeText = legacy.text_url ?? void 0;
  const snakeSpoiler = legacy.spoiler_text ?? void 0;
  const mediaUrl = typeof media.url === "string" ? media.url : "";
  const previewUrl = (typeof media.previewUrl === "string" && media.previewUrl.length > 0 ? media.previewUrl : snakePreview) || mediaUrl;
  const resolvedCategory = normalizeMediaCategory(media.mediaCategory ?? media.type, media.mimeType);
  const attachmentType = CATEGORY_TO_ATTACHMENT[resolvedCategory] ?? "unknown";
  const width = typeof media.width === "number" ? media.width : null;
  const height = typeof media.height === "number" ? media.height : null;
  const duration = typeof media.duration === "number" ? media.duration : null;
  const originalMeta = width !== null || height !== null || duration !== null ? {
    width: width ?? 0,
    height: height ?? 0,
    size: width && height ? `${width}x${height}` : void 0,
    aspect: width && height ? width / height : void 0,
    duration: duration ?? void 0
  } : void 0;
  const meta = {};
  if (originalMeta) {
    meta.original = originalMeta;
  }
  meta.media_category = resolvedCategory;
  if (media.mimeType) {
    meta.mime_type = media.mimeType;
  }
  if (typeof media.type === "string") {
    meta.media_type = media.type;
  }
  if (warnings && warnings.length > 0) {
    meta.warnings = [...warnings];
  }
  return {
    id: typeof media.id === "string" && media.id.length > 0 ? media.id : mediaUrl || `upload-${Date.now()}`,
    type: attachmentType,
    url: mediaUrl,
    preview_url: previewUrl || mediaUrl,
    remote_url: snakeRemote ?? media.remoteUrl ?? (mediaUrl || null),
    text_url: snakeText ?? media.textUrl ?? (mediaUrl || void 0),
    meta: Object.keys(meta).length > 0 ? meta : void 0,
    description: media.description ?? null,
    blurhash: media.blurhash ?? null,
    sensitive: typeof media.sensitive === "boolean" ? media.sensitive : void 0,
    spoiler_text: media.spoilerText ?? snakeSpoiler ?? null
  };
}
function normalizeMediaCategory(category, mimeType) {
  const normalized = typeof category === "string" ? category.toUpperCase() : null;
  if (normalized && CATEGORY_TO_ATTACHMENT[normalized]) {
    return normalized;
  }
  if (mimeType) {
    return inferMediaCategoryFromMime(mimeType) ?? "UNKNOWN";
  }
  return "UNKNOWN";
}
function inferMediaCategoryFromMime(mime) {
  if (!mime) return null;
  const normalized = mime.toLowerCase();
  if (normalized.startsWith("image/")) {
    return normalized === "image/gif" ? "GIFV" : "IMAGE";
  }
  if (normalized.startsWith("video/")) {
    return "VIDEO";
  }
  if (normalized.startsWith("audio/")) {
    return "AUDIO";
  }
  if (normalized === "application/pdf" || normalized === "text/plain" || normalized === "text/markdown") {
    return "DOCUMENT";
  }
  return null;
}
Navigation[FILENAME] = "src/lib/components/islands/svelte/Navigation.svelte";
function Navigation($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      const publicNavItems = [
        { href: "/local", label: "Local", icon: Building },
        { href: "/federated", label: "Federated", icon: Globe }
      ];
      let navItems = publicNavItems;
      let currentPath = "";
      let unreadCount = 0;
      onDestroy(() => {
      });
      function isActive(href, exact = false) {
        if (exact) {
          return currentPath === href;
        }
        return currentPath.startsWith(href);
      }
      $$renderer2.push(`<nav class="nav svelte-jxkij">`);
      push_element($$renderer2, "nav", 69, 0);
      $$renderer2.push(`<div class="user-section svelte-jxkij">`);
      push_element($$renderer2, "div", 71, 2);
      if (authStore.isAuthenticated && authStore.currentUser) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="user-menu svelte-jxkij">`);
        push_element($$renderer2, "div", 73, 6);
        if (authStore.currentUser.avatar) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<img${attr("src", authStore.currentUser.avatar)}${attr("alt", authStore.currentUser.display_name)} class="user-avatar svelte-jxkij"/>`);
          push_element($$renderer2, "img", 75, 10);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<div class="user-avatar-icon svelte-jxkij">`);
          push_element($$renderer2, "div", 81, 10);
          User($$renderer2, { size: 40 });
          $$renderer2.push(`<!----></div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--> <div class="user-info svelte-jxkij">`);
        push_element($$renderer2, "div", 85, 8);
        $$renderer2.push(`<div class="user-name svelte-jxkij">`);
        push_element($$renderer2, "div", 86, 10);
        $$renderer2.push(`${escape_html(authStore.currentUser.display_name || authStore.currentUser.username)}</div>`);
        pop_element();
        $$renderer2.push(` <div class="user-handle svelte-jxkij">`);
        push_element($$renderer2, "div", 87, 10);
        $$renderer2.push(`@${escape_html(authStore.currentUser.acct)}</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<a href="/auth/login" class="sign-in-button svelte-jxkij">`);
        push_element($$renderer2, "a", 91, 6);
        User($$renderer2, { size: 20 });
        $$renderer2.push(`<!----> <span>`);
        push_element($$renderer2, "span", 93, 8);
        $$renderer2.push(`Sign In</span>`);
        pop_element();
        $$renderer2.push(`</a>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` <ul class="nav-list svelte-jxkij">`);
      push_element($$renderer2, "ul", 98, 2);
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(navItems);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 100, 6);
        $$renderer2.push(`<a${attr("href", item.href)}${attr_class(`nav-link ${stringify(isActive(item.href, item.exact) ? "active" : "")}`, "svelte-jxkij")}${attr("aria-current", isActive(item.href, item.exact) ? "page" : void 0)}>`);
        push_element($$renderer2, "a", 101, 8);
        if (isActive(item.href, item.exact)) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="active-indicator svelte-jxkij">`);
          push_element($$renderer2, "span", 107, 12);
          $$renderer2.push(`</span>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <span class="nav-icon svelte-jxkij">`);
        push_element($$renderer2, "span", 109, 10);
        $$renderer2.push(`<!---->`);
        item.icon?.($$renderer2, { size: 20 });
        $$renderer2.push(`<!----> `);
        if (item.href === "/notifications" && unreadCount > 0) ;
        else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></span>`);
        pop_element();
        $$renderer2.push(` <span class="nav-label svelte-jxkij">`);
        push_element($$renderer2, "span", 117, 10);
        $$renderer2.push(`${escape_html(item.label)}</span>`);
        pop_element();
        $$renderer2.push(`</a>`);
        pop_element();
        $$renderer2.push(`</li>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></ul>`);
      pop_element();
      $$renderer2.push(` `);
      if (authStore.isAuthenticated) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="compose-button-wrapper svelte-jxkij">`);
        push_element($$renderer2, "div", 124, 4);
        $$renderer2.push(`<a href="/compose" class="compose-button svelte-jxkij">`);
        push_element($$renderer2, "a", 125, 6);
        $$renderer2.push(`<span class="compose-icon svelte-jxkij">`);
        push_element($$renderer2, "span", 126, 8);
        $$renderer2.push(`✏️</span>`);
        pop_element();
        $$renderer2.push(` <span>`);
        push_element($$renderer2, "span", 127, 8);
        $$renderer2.push(`Compose</span>`);
        pop_element();
        $$renderer2.push(`</a>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></nav>`);
      pop_element();
      $$renderer2.push(` <nav class="mobile-nav svelte-jxkij">`);
      push_element($$renderer2, "nav", 134, 0);
      $$renderer2.push(`<a href="/home"${attr_class(`mobile-nav-link ${stringify(isActive("/home", true) ? "active" : "")}`, "svelte-jxkij")}>`);
      push_element($$renderer2, "a", 135, 2);
      if (isActive("/home", true)) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="mobile-indicator svelte-jxkij">`);
        push_element($$renderer2, "span", 137, 6);
        $$renderer2.push(`</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span>`);
      push_element($$renderer2, "span", 139, 4);
      $$renderer2.push(`🏠</span>`);
      pop_element();
      $$renderer2.push(`</a>`);
      pop_element();
      $$renderer2.push(` <a href="/local"${attr_class(`mobile-nav-link ${stringify(isActive("/local") ? "active" : "")}`, "svelte-jxkij")}>`);
      push_element($$renderer2, "a", 141, 2);
      if (isActive("/local")) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="mobile-indicator svelte-jxkij">`);
        push_element($$renderer2, "span", 143, 6);
        $$renderer2.push(`</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      Building($$renderer2, { size: 24 });
      $$renderer2.push(`<!----></a>`);
      pop_element();
      $$renderer2.push(` <a href="/notifications"${attr_class(`mobile-nav-link ${stringify(isActive("/notifications") ? "active" : "")}`, "svelte-jxkij")}>`);
      push_element($$renderer2, "a", 147, 2);
      if (isActive("/notifications")) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="mobile-indicator svelte-jxkij">`);
        push_element($$renderer2, "span", 149, 6);
        $$renderer2.push(`</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span class="mobile-icon-wrapper svelte-jxkij">`);
      push_element($$renderer2, "span", 151, 4);
      $$renderer2.push(`🔔 `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></span>`);
      pop_element();
      $$renderer2.push(`</a>`);
      pop_element();
      $$renderer2.push(` <a href="/compose" class="mobile-compose-button svelte-jxkij">`);
      push_element($$renderer2, "a", 160, 2);
      $$renderer2.push(`<span>`);
      push_element($$renderer2, "span", 161, 4);
      $$renderer2.push(`✏️</span>`);
      pop_element();
      $$renderer2.push(`</a>`);
      pop_element();
      $$renderer2.push(` <a href="/settings"${attr_class(`mobile-nav-link ${stringify(isActive("/settings") ? "active" : "")}`, "svelte-jxkij")}>`);
      push_element($$renderer2, "a", 163, 2);
      if (isActive("/settings")) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="mobile-indicator svelte-jxkij">`);
        push_element($$renderer2, "span", 165, 6);
        $$renderer2.push(`</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span>`);
      push_element($$renderer2, "span", 167, 4);
      $$renderer2.push(`⚙️</span>`);
      pop_element();
      $$renderer2.push(`</a>`);
      pop_element();
      $$renderer2.push(`</nav>`);
      pop_element();
    },
    Navigation
  );
}
Navigation.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
MainLayout[FILENAME] = "src/lib/layouts/MainLayout.svelte";
function MainLayout($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { title = "Greater", children } = $$props;
      BaseLayout($$renderer2, {
        title,
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<div class="main-layout svelte-1vud52s">`);
          push_element($$renderer3, "div", 15, 2);
          $$renderer3.push(`<aside class="sidebar svelte-1vud52s">`);
          push_element($$renderer3, "aside", 16, 4);
          Navigation($$renderer3);
          $$renderer3.push(`<!----></aside>`);
          pop_element();
          $$renderer3.push(` <main class="content svelte-1vud52s">`);
          push_element($$renderer3, "main", 19, 4);
          children($$renderer3);
          $$renderer3.push(`<!----></main>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
        })
      });
    },
    MainLayout
  );
}
MainLayout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
TimelineTabs[FILENAME] = "src/lib/components/islands/svelte/TimelineTabs.svelte";
function TimelineTabs($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { activeTab } = $$props;
      const allTabs = [
        { id: "home", label: "Home", href: "/home", authRequired: true },
        { id: "local", label: "Local", href: "/local" },
        { id: "federated", label: "Federated", href: "/federated" }
      ];
      const tabs = allTabs.filter((tab) => !tab.authRequired || authStore.isAuthenticated);
      let active = activeTab || "local";
      $$renderer2.push(`<div class="tabs-container svelte-16064hu" role="tablist">`);
      push_element($$renderer2, "div", 62, 0);
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(tabs);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tab = each_array[$$index];
        $$renderer2.push(`<button role="tab"${attr("aria-selected", active === tab.id)}${attr_class("svelte-16064hu", void 0, { "active": active === tab.id })}>`);
        push_element($$renderer2, "button", 64, 4);
        $$renderer2.push(`${escape_html(tab.label)}</button>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    TimelineTabs
  );
}
TimelineTabs.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
TimelineLayout[FILENAME] = "src/lib/layouts/TimelineLayout.svelte";
function TimelineLayout($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { title = "Timeline", activeTab = "home", children } = $$props;
      const effectiveTab = activeTab === "home" && !authStore.isAuthenticated ? "local" : activeTab;
      MainLayout($$renderer2, {
        title,
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<div class="timeline-layout svelte-e1b9ru">`);
          push_element($$renderer3, "div", 22, 2);
          TimelineTabs($$renderer3, { activeTab: effectiveTab });
          $$renderer3.push(`<!----> <div class="timeline-content svelte-e1b9ru">`);
          push_element($$renderer3, "div", 24, 4);
          children($$renderer3);
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
        })
      });
    },
    TimelineLayout
  );
}
TimelineLayout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
const CACHE_DURATION = 5 * 60 * 1e3;
const DEFAULT_PAGE_SIZE = 20;
const initialTimelineData = {
  statuses: [],
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetch: 0,
  stream: null,
  gaps: [],
  endCursor: null
};
function mapGraphQLToStatus(node) {
  const obj = node.object || node;
  const quoteContext = normalizeQuoteContext(obj);
  return {
    id: obj.id,
    uri: obj.id,
    url: obj.id,
    created_at: obj.published || obj.createdAt || /* @__PURE__ */ (/* @__PURE__ */ new Date()).toISOString(),
    account: mapGraphQLToAccount(obj.actor || obj.attributedTo || obj.author),
    content: obj.content || "",
    visibility: obj.visibility?.toLowerCase() || "public",
    sensitive: obj.sensitive ?? false,
    spoiler_text: obj.summary ?? obj.spoilerText ?? "",
    media_attachments: (obj.attachments || []).map(mapGraphQLToMedia),
    mentions: (obj.mentions || obj.tag?.filter((t2) => t2.type === "Mention") || []).map(mapGraphQLToMention),
    tags: (obj.hashtags || obj.tag?.filter((t2) => t2.type === "Hashtag") || []).map(mapGraphQLToTag),
    emojis: [],
    reblogs_count: obj.shares?.totalCount || obj.sharesCount || 0,
    favourites_count: obj.likes?.totalCount || obj.likesCount || 0,
    replies_count: obj.replies?.totalCount || obj.repliesCount || 0,
    reblogged: resolveRebloggedFlag(obj),
    favourited: resolveFavouritedFlag(obj),
    bookmarked: resolveBookmarkedFlag(obj),
    pinned: resolvePinnedFlag(obj),
    reblog: obj.shareOf ? mapGraphQLToStatus(obj.shareOf) : null,
    in_reply_to_id: obj.inReplyTo?.id || null,
    in_reply_to_account_id: null,
    application: null,
    language: obj.language || null,
    muted: false,
    poll: obj.poll ? mapGraphQLToPoll(obj.poll) : null,
    card: null,
    edited_at: obj.updated || null,
    quote_id: quoteContext?.original_note_id || obj.quoteUrl || null,
    quote_url: obj.quoteUrl || null,
    quote_context: quoteContext
  };
}
function mapGraphQLToAccount(actor) {
  if (!actor) {
    return {
      id: "unknown",
      username: "unknown",
      acct: "unknown",
      display_name: "Unknown",
      avatar: "",
      header: ""
    };
  }
  try {
    return mapGraphQLActorToAccount(actor);
  } catch (error) {
    console.warn("[Timeline Store] Failed to map actor, falling back to minimal data.", error);
    return {
      id: actor.id || "unknown",
      username: actor.username || actor.preferredUsername || "unknown",
      acct: actor.webfinger || actor.username || "unknown",
      display_name: actor.displayName || actor.name || actor.username || "Unknown",
      avatar: actor.avatar || actor.icon?.url || "",
      header: actor.header || actor.image?.url || ""
    };
  }
}
function deriveHostFromId(id) {
  if (!id) return void 0;
  try {
    return new URL(id).hostname;
  } catch {
    return void 0;
  }
}
function normalizeQuoteContext(obj) {
  if (!obj.quoteContext && !obj.quoteUrl) {
    return null;
  }
  const ctx = obj.quoteContext;
  if (!ctx) {
    return null;
  }
  const originalAuthor = ctx.originalAuthor ? mapGraphQLToAccount(ctx.originalAuthor) : null;
  return {
    quote_allowed: ctx.quoteAllowed ?? false,
    quote_type: ctx.quoteType || null,
    withdrawn: ctx.withdrawn ?? false,
    original_author: originalAuthor,
    original_note_id: ctx.originalNote?.id || obj.quoteUrl || null
  };
}
function mapGraphQLToMedia(attachment) {
  return mapGraphQLMediaToAttachment(attachment);
}
function mapGraphQLToMention(mention) {
  const username = mention.username || mention.name?.replace("@", "") || "";
  const domain = mention.domain || deriveHostFromId(mention.url || mention.href);
  const acct = domain ? `${username}@${domain}` : username;
  return {
    id: mention.id || mention.href || acct,
    username,
    url: mention.url || mention.href || "",
    acct
  };
}
function mapGraphQLToTag(tag) {
  return { name: tag.name?.replace("#", "") || "", url: tag.href || "" };
}
function mapGraphQLToPoll(poll) {
  return {
    id: poll.id,
    expires_at: poll.endTime,
    expired: new Date(poll.endTime) < /* @__PURE__ */ new Date(),
    multiple: poll.anyOf !== void 0,
    // anyOf = multiple choice
    votes_count: poll.votersCount || 0,
    voters_count: poll.votersCount || 0,
    voted: poll.voted || false,
    own_votes: poll.ownVotes || [],
    options: (poll.oneOf || poll.anyOf || []).map((opt) => ({ title: opt.name, votes_count: opt.replies?.totalCount || 0 })),
    emojis: []
  };
}
class TimelineStore {
  timelines = {};
  isLoading = false;
  error = null;
  _initialized = false;
  _previousInstance = null;
  constructor() {
  }
  /**
   * Initialize the timeline store - must be called from client-side code
   */
  initialize() {
    if (typeof window === "undefined" || this._initialized) return;
    this._initialized = true;
    authStore.initialize();
    this._previousInstance = authStore.currentInstance;
    setInterval(
      () => {
        if (authStore.currentInstance !== this._previousInstance) {
          if (this._previousInstance !== null) {
            Object.keys(this.timelines).forEach((type) => {
              this.disconnectStream(type);
              this.clearTimeline(type);
            });
          }
          this._previousInstance = authStore.currentInstance;
        }
      },
      1e3
    );
  }
  async loadTimeline(type, params) {
    const timeline = this.timelines[type] || { ...initialTimelineData };
    const now = Date.now();
    if (!params?.since_id && timeline.lastFetch && now - timeline.lastFetch < CACHE_DURATION && timeline.statuses.length > 0) {
      return;
    }
    this.isLoading = true;
    this.error = null;
    if (!this.timelines[type]) {
      this.timelines[type] = { ...initialTimelineData };
    }
    this.timelines[type] = { ...this.timelines[type], isLoading: true, error: null };
    try {
      logDebug("[Timeline Store] Loading timeline:", {
        type,
        currentInstance: authStore.currentInstance,
        isAuthenticated: authStore.isAuthenticated,
        currentUser: authStore.currentUser?.username
      });
      const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
      let timelineResponse;
      const pagination = {
        first: params?.limit || DEFAULT_PAGE_SIZE,
        after: params?.since_id ? void 0 : timeline.endCursor
      };
      if (type.startsWith("list:")) {
        const listId = type.replace("list:", "");
        timelineResponse = await adapter.fetchListTimeline(listId, pagination);
      } else {
        switch (type) {
          case "home":
            timelineResponse = await adapter.fetchHomeTimeline(pagination);
            break;
          case "local":
            timelineResponse = await adapter.fetchPublicTimeline(pagination, "LOCAL");
            break;
          case "federated":
            timelineResponse = await adapter.fetchPublicTimeline(pagination, "PUBLIC");
            break;
          default:
            throw new Error(`Unknown timeline type: ${type}`);
        }
      }
      const statuses = (timelineResponse?.edges || []).map((edge) => mapGraphQLToStatus(edge.node));
      const pageInfo = timelineResponse?.pageInfo;
      logDebug("[Timeline Store] Loaded statuses:", statuses.length);
      logDebug("[Timeline Store] First status:", statuses[0]);
      logDebug("[Timeline Store] PageInfo:", pageInfo);
      const updatedTimeline = {
        ...this.timelines[type],
        statuses: params?.since_id ? [...statuses, ...this.timelines[type].statuses] : statuses,
        hasMore: pageInfo?.hasNextPage || false,
        endCursor: pageInfo?.endCursor || null,
        isLoading: false,
        lastFetch: now,
        error: null
      };
      logDebug("[Timeline Store] Setting timeline state:", {
        type,
        statusCount: updatedTimeline.statuses.length,
        isLoading: updatedTimeline.isLoading,
        error: updatedTimeline.error,
        hasMore: updatedTimeline.hasMore
      });
      this.timelines[type] = updatedTimeline;
      this.isLoading = false;
      logDebug("[Timeline Store] Timeline state after update:", this.timelines[type]);
    } catch (error) {
      console.error("[Timeline Store] Error loading timeline:", error);
      this.timelines[type] = { ...this.timelines[type], isLoading: false, error };
      this.isLoading = false;
      this.error = error instanceof Error ? error.message : "Failed to load timeline";
    }
  }
  async loadMore(type) {
    const timeline = this.timelines[type];
    if (!timeline || !timeline.hasMore || timeline.isLoadingMore) {
      return;
    }
    this.timelines[type] = { ...this.timelines[type], isLoadingMore: true };
    try {
      const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
      let timelineResponse;
      const pagination = { first: DEFAULT_PAGE_SIZE, after: timeline.endCursor };
      if (type.startsWith("list:")) {
        const listId = type.replace("list:", "");
        timelineResponse = await adapter.fetchListTimeline(listId, pagination);
      } else {
        switch (type) {
          case "home":
            timelineResponse = await adapter.fetchHomeTimeline(pagination);
            break;
          case "local":
            timelineResponse = await adapter.fetchPublicTimeline(pagination, "LOCAL");
            break;
          case "federated":
            timelineResponse = await adapter.fetchPublicTimeline(pagination, "PUBLIC");
            break;
          default:
            throw new Error(`Unknown timeline type: ${type}`);
        }
      }
      const statuses = (timelineResponse?.edges || []).map((edge) => mapGraphQLToStatus(edge.node));
      const pageInfo = timelineResponse?.pageInfo;
      this.timelines[type] = {
        ...this.timelines[type],
        statuses: [...this.timelines[type].statuses, ...statuses],
        hasMore: pageInfo?.hasNextPage || false,
        endCursor: pageInfo?.endCursor || null,
        isLoadingMore: false
      };
    } catch (error) {
      console.error("[Timeline Store] Error loading more:", error);
      this.timelines[type] = { ...this.timelines[type], isLoadingMore: false, error };
    }
  }
  async refreshTimeline(type) {
    const timeline = this.timelines[type];
    if (!timeline || timeline.statuses.length === 0) {
      return this.loadTimeline(type);
    }
    try {
      await this.loadTimeline(type, { limit: DEFAULT_PAGE_SIZE });
    } catch (error) {
      console.error("[Timeline Store] Error refreshing timeline:", error);
    }
  }
  prependStatus(type, status) {
    if (this.timelines[type]) {
      this.timelines[type] = {
        ...this.timelines[type],
        statuses: [status, ...this.timelines[type].statuses]
      };
    }
  }
  updateStatus(statusId, updates) {
    logDebug("[Timeline Store] Updating status:", { statusId, updates });
    Object.entries(this.timelines).forEach(([type, timeline]) => {
      this.timelines[type] = {
        ...timeline,
        statuses: timeline.statuses.map((status) => {
          if (status.id === statusId) {
            const updated = { ...status, ...updates };
            logDebug("[Timeline Store] Status updated:", {
              id: statusId,
              wasFavorited: status.favourited,
              isFavorited: updated.favourited,
              wasBookmarked: status.bookmarked,
              isBookmarked: updated.bookmarked
            });
            return updated;
          }
          if (status.reblog?.id === statusId) {
            return { ...status, reblog: { ...status.reblog, ...updates } };
          }
          return status;
        })
      };
    });
  }
  removeStatus(statusId) {
    Object.entries(this.timelines).forEach(([type, timeline]) => {
      this.timelines[type] = {
        ...timeline,
        statuses: timeline.statuses.filter((status) => status.id !== statusId && status.reblog?.id !== statusId)
      };
    });
  }
  clearTimeline(type) {
    this.timelines[type] = { ...initialTimelineData };
  }
  async favoriteStatus(statusId) {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
    let originalStatus;
    for (const timeline of Object.values(this.timelines)) {
      originalStatus = timeline.statuses.find((s) => s.id === statusId || s.reblog?.id === statusId);
      if (originalStatus) break;
    }
    this.updateStatus(statusId, {
      favourited: true,
      favourites_count: (originalStatus?.favourites_count || 0) + 1
    });
    try {
      const response = await adapter.likeObject(statusId);
      this.updateStatus(statusId, {
        favourited: response.userInteractions?.liked || true,
        favourites_count: response.likes?.totalCount || response.likesCount || (originalStatus?.favourites_count || 0) + 1
      });
    } catch (error) {
      this.updateStatus(statusId, {
        favourited: false,
        favourites_count: (originalStatus?.favourites_count || 1) - 1
      });
      throw error;
    }
  }
  async unfavoriteStatus(statusId) {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
    let originalStatus;
    for (const timeline of Object.values(this.timelines)) {
      originalStatus = timeline.statuses.find((s) => s.id === statusId || s.reblog?.id === statusId);
      if (originalStatus) break;
    }
    this.updateStatus(statusId, {
      favourited: false,
      favourites_count: Math.max(0, (originalStatus?.favourites_count || 1) - 1)
    });
    try {
      const response = await adapter.unlikeObject(statusId);
      this.updateStatus(statusId, {
        favourited: response.userInteractions?.liked || false,
        favourites_count: response.likes?.totalCount || response.likesCount || Math.max(0, (originalStatus?.favourites_count || 1) - 1)
      });
    } catch (error) {
      this.updateStatus(statusId, {
        favourited: true,
        favourites_count: (originalStatus?.favourites_count || 0) + 1
      });
      throw error;
    }
  }
  async reblogStatus(statusId) {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
    let originalStatus;
    for (const timeline of Object.values(this.timelines)) {
      originalStatus = timeline.statuses.find((s) => s.id === statusId || s.reblog?.id === statusId);
      if (originalStatus) break;
    }
    this.updateStatus(statusId, {
      reblogged: true,
      reblogs_count: (originalStatus?.reblogs_count || 0) + 1
    });
    try {
      const response = await adapter.shareObject(statusId);
      this.updateStatus(statusId, {
        reblogged: response.userInteractions?.shared || true,
        reblogs_count: response.shares?.totalCount || response.sharesCount || (originalStatus?.reblogs_count || 0) + 1
      });
    } catch (error) {
      this.updateStatus(statusId, {
        reblogged: false,
        reblogs_count: (originalStatus?.reblogs_count || 1) - 1
      });
      throw error;
    }
  }
  async unreblogStatus(statusId) {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
    let originalStatus;
    for (const timeline of Object.values(this.timelines)) {
      originalStatus = timeline.statuses.find((s) => s.id === statusId || s.reblog?.id === statusId);
      if (originalStatus) break;
    }
    this.updateStatus(statusId, {
      reblogged: false,
      reblogs_count: Math.max(0, (originalStatus?.reblogs_count || 1) - 1)
    });
    try {
      const response = await adapter.unshareObject(statusId);
      this.updateStatus(statusId, {
        reblogged: response.userInteractions?.shared || false,
        reblogs_count: response.shares?.totalCount || response.sharesCount || Math.max(0, (originalStatus?.reblogs_count || 1) - 1)
      });
    } catch (error) {
      this.updateStatus(statusId, {
        reblogged: true,
        reblogs_count: (originalStatus?.reblogs_count || 0) + 1
      });
      throw error;
    }
  }
  async bookmarkStatus(statusId) {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
    this.updateStatus(statusId, { bookmarked: true });
    try {
      const response = await adapter.bookmarkObject(statusId);
      this.updateStatus(statusId, { bookmarked: response.userInteractions?.bookmarked || true });
    } catch (error) {
      this.updateStatus(statusId, { bookmarked: false });
      throw error;
    }
  }
  async unbookmarkStatus(statusId) {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
    this.updateStatus(statusId, { bookmarked: false });
    try {
      const response = await adapter.unbookmarkObject(statusId);
      this.updateStatus(statusId, { bookmarked: response.userInteractions?.bookmarked || false });
    } catch (error) {
      this.updateStatus(statusId, { bookmarked: true });
      throw error;
    }
  }
  async deleteStatus(statusId) {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || void 0);
    try {
      await adapter.deleteObject(statusId);
      this.removeStatus(statusId);
    } catch (error) {
      throw error;
    }
  }
  async connectStream(type) {
    const timeline = this.timelines[type];
    if (timeline?.stream) {
      return;
    }
    if (!authStore.isAuthenticated || !authStore.currentInstance) {
      logDebug("[Timeline Stream] Cannot connect - not authenticated");
      return;
    }
    try {
      const adapter = await getGraphQLAdapter(authStore.currentInstance);
      let timelineType;
      let listId;
      if (type.startsWith("list:")) {
        timelineType = "LIST";
        listId = type.replace("list:", "");
      } else {
        switch (type) {
          case "home":
            timelineType = "HOME";
            break;
          case "local":
            timelineType = "LOCAL";
            break;
          case "federated":
            timelineType = "PUBLIC";
            break;
          default:
            console.warn(`[Timeline Stream] Unknown timeline type for streaming: ${type}`);
            return;
        }
      }
      const subscription = adapter.subscribeToTimelineUpdates({ type: timelineType, listId }).subscribe({
        next: (result) => {
          try {
            const update = result.data?.timelineUpdates;
            if (!update) return;
            const status = mapGraphQLToStatus(update);
            const timelineState = this.timelines[type];
            if (!timelineState) return;
            const existing = timelineState.statuses.some((current) => current.id === status.id);
            if (existing) {
              this.updateStatus(status.id, status);
            } else {
              this.prependStatus(type, status);
            }
          } catch (error) {
            console.error("[Timeline Stream] Failed to process update:", error);
          }
        },
        error: (error) => {
          console.error("[Timeline Stream] Error:", error);
          this.timelines[type] = { ...this.timelines[type], stream: null };
          setTimeout(
            () => {
              this.connectStream(type);
            },
            5e3
          );
        },
        complete: () => {
          logDebug("[Timeline Stream] Connection closed");
          this.timelines[type] = { ...this.timelines[type], stream: null };
        }
      });
      this.timelines[type] = { ...this.timelines[type], stream: subscription };
    } catch (error) {
      console.error("[Timeline Stream] Failed to connect stream:", error);
    }
  }
  disconnectStream(type) {
    const timeline = this.timelines[type];
    if (timeline?.stream) {
      timeline.stream.unsubscribe();
      this.timelines[type] = { ...this.timelines[type], stream: null };
    }
  }
}
const timelineStore = new TimelineStore();
MediaGallery[FILENAME] = "src/lib/components/islands/svelte/MediaGallery.svelte";
function MediaGallery($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { media, sensitive = false } = $$props;
      let showSensitive = !sensitive;
      let imageLoadStates = {};
      const gridClass = (() => {
        switch (media.length) {
          case 1:
            return "grid-cols-1";
          case 2:
            return "grid-cols-2";
          case 3:
            return "grid-cols-2";
          case 4:
            return "grid-cols-2";
          default:
            return "grid-cols-3";
        }
      })();
      const itemClass = (() => {
        if (media.length === 3) {
          return (index) => index === 0 ? "row-span-2" : "";
        }
        return () => "";
      })();
      function getAspectRatio(attachment) {
        if (attachment.meta?.small?.aspect) {
          const aspect = attachment.meta.small.aspect;
          return `${aspect}`;
        }
        return "1";
      }
      function getOptimizedUrl(attachment, size = "small") {
        if (size === "preview" && attachment.preview_url) {
          return attachment.preview_url;
        }
        if (size === "small" && attachment.preview_url) {
          return attachment.preview_url;
        }
        return attachment.url;
      }
      function getMediaCategory(attachment) {
        if (attachment.meta?.media_category) {
          return attachment.meta.media_category;
        }
        switch (attachment.type) {
          case "image":
            return "IMAGE";
          case "video":
            return "VIDEO";
          case "audio":
            return "AUDIO";
          case "gifv":
            return "GIFV";
          default:
            return "UNKNOWN";
        }
      }
      $$renderer2.push(`<div class="media-gallery">`);
      push_element($$renderer2, "div", 126, 0);
      if (sensitive && !showSensitive) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video flex items-center justify-center">`);
        push_element($$renderer2, "div", 129, 4);
        $$renderer2.push(`<div class="text-center p-4">`);
        push_element($$renderer2, "div", 130, 6);
        $$renderer2.push(`<svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
        push_element($$renderer2, "svg", 131, 8);
        $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21">`);
        push_element($$renderer2, "path", 132, 10);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(` <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">`);
        push_element($$renderer2, "p", 134, 8);
        $$renderer2.push(`Sensitive content</p>`);
        pop_element();
        $$renderer2.push(` <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">`);
        push_element($$renderer2, "button", 135, 8);
        $$renderer2.push(`Show</button>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div${attr_class(`grid gap-1 ${stringify(gridClass)} rounded-lg overflow-hidden`)}>`);
        push_element($$renderer2, "div", 145, 4);
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(media);
        for (let index = 0, $$length = each_array.length; index < $$length; index++) {
          let attachment = each_array[index];
          const category = getMediaCategory(attachment);
          $$renderer2.push(`<div class="relative group">`);
          push_element($$renderer2, "div", 148, 8);
          if (category === "IMAGE" || category === "GIFV" || category === "VIDEO") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<button${attr_class(`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${stringify(itemClass(index))} focus:outline-none focus:ring-2 focus:ring-blue-500`)}${attr_style(`aspect-ratio: ${stringify(getAspectRatio(attachment))}`)}>`);
            push_element($$renderer2, "button", 150, 12);
            if (category === "VIDEO") {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<video${attr("src", attachment.url)}${attr("poster", attachment.preview_url)} class="h-full w-full object-cover" muted playsinline controls>`);
              push_element($$renderer2, "video", 156, 16);
              $$renderer2.push(`</video>`);
              pop_element();
              $$renderer2.push(` <div class="pointer-events-none absolute inset-0 flex items-center justify-center">`);
              push_element($$renderer2, "div", 164, 16);
              $$renderer2.push(`<div class="rounded-full bg-black/60 p-3">`);
              push_element($$renderer2, "div", 165, 18);
              $$renderer2.push(`<svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">`);
              push_element($$renderer2, "svg", 166, 20);
              $$renderer2.push(`<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z">`);
              push_element($$renderer2, "path", 167, 22);
              $$renderer2.push(`</path>`);
              pop_element();
              $$renderer2.push(`</svg>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
              if (category === "GIFV") {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<video${attr("src", attachment.url)}${attr("poster", attachment.preview_url)} class="h-full w-full object-cover" muted loop autoplay playsinline>`);
                push_element($$renderer2, "video", 172, 16);
                $$renderer2.push(`</video>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
                $$renderer2.push(`<img${attr("src", getOptimizedUrl(attachment, "small"))}${attr("alt", attachment.description || "")} class="h-full w-full object-cover" loading="lazy" onload="this.__e=event"/>`);
                push_element($$renderer2, "img", 182, 16);
                pop_element();
                $$renderer2.push(` `);
                if (!imageLoadStates[attachment.id]) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<div class="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700">`);
                  push_element($$renderer2, "div", 190, 18);
                  $$renderer2.push(`</div>`);
                  pop_element();
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--> `);
            if (attachment.spoiler_text) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white">`);
              push_element($$renderer2, "div", 195, 16);
              $$renderer2.push(`CW</div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <div class="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[11px] uppercase tracking-wide text-white">`);
            push_element($$renderer2, "div", 200, 14);
            $$renderer2.push(`${escape_html(category)}</div>`);
            pop_element();
            $$renderer2.push(` `);
            if (attachment.description) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">`);
              push_element($$renderer2, "div", 205, 16);
              $$renderer2.push(`<span class="text-xs text-white">`);
              push_element($$renderer2, "span", 206, 18);
              $$renderer2.push(`ALT</span>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></button>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
            if (category === "AUDIO") {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="flex items-center space-x-3 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">`);
              push_element($$renderer2, "div", 211, 12);
              $$renderer2.push(`<svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
              push_element($$renderer2, "svg", 212, 14);
              $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3">`);
              push_element($$renderer2, "path", 213, 16);
              $$renderer2.push(`</path>`);
              pop_element();
              $$renderer2.push(`</svg>`);
              pop_element();
              $$renderer2.push(` <div class="flex-1">`);
              push_element($$renderer2, "div", 215, 14);
              $$renderer2.push(`<audio${attr("src", attachment.url)} controls class="w-full" preload="metadata">`);
              push_element($$renderer2, "audio", 216, 16);
              $$renderer2.push(`</audio>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
              if (category === "DOCUMENT") {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="flex h-32 items-center justify-center rounded-lg bg-gray-100 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">`);
                push_element($$renderer2, "div", 220, 12);
                $$renderer2.push(`<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
                push_element($$renderer2, "svg", 221, 14);
                $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2z">`);
                push_element($$renderer2, "path", 222, 16);
                $$renderer2.push(`</path>`);
                pop_element();
                $$renderer2.push(`</svg>`);
                pop_element();
                $$renderer2.push(` Document attachment</div>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
                $$renderer2.push(`<div class="flex h-32 items-center justify-center rounded-lg bg-gray-100 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">`);
                push_element($$renderer2, "div", 227, 12);
                $$renderer2.push(`Unsupported media</div>`);
                pop_element();
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]--></div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    MediaGallery
  );
}
MediaGallery.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
StatusSkeleton[FILENAME] = "src/lib/components/islands/svelte/StatusSkeleton.svelte";
function StatusSkeleton($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      $$renderer2.push(`<div class="card p-4 space-y-3">`);
      push_element($$renderer2, "div", 5, 0);
      $$renderer2.push(`<div class="flex items-start gap-3">`);
      push_element($$renderer2, "div", 6, 1);
      Skeleton($$renderer2, { variant: "circular", width: "48px", height: "48px" });
      $$renderer2.push(`<!----> <div class="flex-1 space-y-3">`);
      push_element($$renderer2, "div", 10, 2);
      $$renderer2.push(`<div class="flex items-center gap-2">`);
      push_element($$renderer2, "div", 12, 3);
      Skeleton($$renderer2, { variant: "text", width: "128px", height: "16px" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { variant: "text", width: "96px", height: "12px" });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(` <div class="space-y-2">`);
      push_element($$renderer2, "div", 18, 3);
      Skeleton($$renderer2, { variant: "text", width: "100%", height: "16px" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { variant: "text", width: "80%", height: "16px" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { variant: "text", width: "60%", height: "16px" });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(` `);
      if (Math.random() > 0.5) {
        $$renderer2.push("<!--[-->");
        Skeleton($$renderer2, {
          variant: "rectangular",
          width: "100%",
          height: "192px",
          class: "rounded-lg"
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex items-center gap-6 pt-2">`);
      push_element($$renderer2, "div", 30, 3);
      Skeleton($$renderer2, { variant: "circular", width: "20px", height: "20px" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { variant: "circular", width: "20px", height: "20px" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { variant: "circular", width: "20px", height: "20px" });
      $$renderer2.push(`<!----> `);
      Skeleton($$renderer2, { variant: "circular", width: "20px", height: "20px" });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    StatusSkeleton
  );
}
StatusSkeleton.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
QuotePreview[FILENAME] = "src/lib/components/islands/svelte/QuotePreview.svelte";
function QuotePreview($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      const { quoteId, quoteUrl = null, author = null } = $$props;
      $$renderer2.push(`<div class="quote-preview svelte-1f9da5d">`);
      push_element($$renderer2, "div", 130, 0);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="quote-loading">`);
        push_element($$renderer2, "div", 132, 4);
        StatusSkeleton($$renderer2);
        $$renderer2.push(`<!----></div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    QuotePreview
  );
}
QuotePreview.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
StatusCard[FILENAME] = "src/lib/components/islands/svelte/StatusCard.svelte";
function StatusCard($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      const { $$slots, $$events, ...props } = $$props;
      const status = (() => props.status)();
      const showThread = (() => props.showThread ?? false)();
      const lesserStatus = status;
      const displayStatus = status.reblog || status;
      const isReblog = !!status.reblog;
      const quoteMeta = displayStatus.quote_context || null;
      const avatarPlaceholder = (() => {
        const name = displayStatus.account.display_name || displayStatus.account.username;
        const firstLetter = name.charAt(0).toUpperCase();
        return firstLetter;
      })();
      const relativeTime = (() => {
        const date = new Date(displayStatus.created_at);
        const now = /* @__PURE__ */ new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1e3);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return date.toLocaleDateString();
      })();
      const visibilityIcon = (() => {
        switch (displayStatus.visibility) {
          case "public":
            return "🌐";
          case "unlisted":
            return "🔓";
          case "private":
            return "🔒";
          case "direct":
            return "✉️";
          default:
            return "";
        }
      })();
      let showMenu = false;
      let relationship = null;
      const isOwnStatus = displayStatus.account.id === authStore.currentUser?.id;
      $$renderer2.push(`<article class="card p-4 space-y-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" role="article"${attr("aria-label", `Post by ${stringify(
        // Don't navigate if clicking on interactive elements
        displayStatus.account.display_name || displayStatus.account.username
      )}`)} tabindex="0">`);
      push_element($$renderer2, "article", 306, 0);
      if (isReblog) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-2 text-sm text-text-secondary">`);
        push_element($$renderer2, "div", 330, 2);
        $$renderer2.push(`<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">`);
        push_element($$renderer2, "svg", 331, 3);
        $$renderer2.push(`<path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z">`);
        push_element($$renderer2, "path", 332, 4);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(` <span>`);
        push_element($$renderer2, "span", 334, 3);
        $$renderer2.push(`${escape_html(status.account.display_name || status.account.username)} boosted</span>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (showThread && displayStatus.in_reply_to_id) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex items-center gap-2 text-sm text-text-secondary">`);
        push_element($$renderer2, "div", 339, 2);
        $$renderer2.push(`<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">`);
        push_element($$renderer2, "svg", 340, 3);
        $$renderer2.push(`<path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z">`);
        push_element($$renderer2, "path", 341, 4);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(` <span>`);
        push_element($$renderer2, "span", 343, 3);
        $$renderer2.push(`Replying to thread</span>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex items-start gap-3">`);
      push_element($$renderer2, "div", 347, 1);
      $$renderer2.push(`<a${attr("href", `/@${displayStatus.account.acct}`)} class="flex-shrink-0">`);
      push_element($$renderer2, "a", 348, 2);
      Avatar($$renderer2, {
        src: displayStatus.account.avatar,
        alt: displayStatus.account.display_name || displayStatus.account.username,
        size: "md",
        fallback: avatarPlaceholder
      });
      $$renderer2.push(`<!----></a>`);
      pop_element();
      $$renderer2.push(` <div class="flex-1 min-w-0">`);
      push_element($$renderer2, "div", 357, 2);
      $$renderer2.push(`<div class="flex items-center gap-2 flex-wrap">`);
      push_element($$renderer2, "div", 358, 3);
      $$renderer2.push(`<a${attr("href", `/@${displayStatus.account.acct}`)} class="font-semibold text-text hover:underline">`);
      push_element($$renderer2, "a", 359, 4);
      $$renderer2.push(`${escape_html(displayStatus.account.display_name || displayStatus.account.username)}</a>`);
      pop_element();
      $$renderer2.push(` <span class="text-text-secondary">`);
      push_element($$renderer2, "span", 362, 4);
      $$renderer2.push(`@${escape_html(displayStatus.account.acct)}</span>`);
      pop_element();
      $$renderer2.push(` `);
      if (!isOwnStatus && authStore.currentUser && relationship) ;
      else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span class="text-text-secondary">`);
      push_element($$renderer2, "span", 381, 4);
      $$renderer2.push(`·</span>`);
      pop_element();
      $$renderer2.push(` <time class="text-text-secondary"${attr("datetime", displayStatus.created_at)}>`);
      push_element($$renderer2, "time", 382, 4);
      $$renderer2.push(`${escape_html(relativeTime)}</time>`);
      pop_element();
      $$renderer2.push(` `);
      if (visibilityIcon) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-text-secondary"${attr("title", displayStatus.visibility)}>`);
        push_element($$renderer2, "span", 386, 5);
        $$renderer2.push(`${escape_html(visibilityIcon)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      if (displayStatus.spoiler_text) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<details class="mt-2">`);
        push_element($$renderer2, "details", 393, 4);
        $$renderer2.push(`<summary class="cursor-pointer text-text-secondary hover:text-text">`);
        push_element($$renderer2, "summary", 394, 5);
        $$renderer2.push(`CW: ${escape_html(displayStatus.spoiler_text)}</summary>`);
        pop_element();
        $$renderer2.push(` <div class="mt-2 prose prose-sm max-w-none text-text">`);
        push_element($$renderer2, "div", 397, 5);
        $$renderer2.push(`${html(sanitizeMastodonHtml(displayStatus.content))}</div>`);
        pop_element();
        $$renderer2.push(`</details>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="mt-2 prose prose-sm max-w-none text-text">`);
        push_element($$renderer2, "div", 402, 4);
        $$renderer2.push(`${html(sanitizeMastodonHtml(displayStatus.content))}</div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--> `);
      if (quoteMeta?.original_note_id) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mt-3">`);
        push_element($$renderer2, "div", 408, 4);
        QuotePreview($$renderer2, {
          quoteId: quoteMeta.original_note_id,
          quoteUrl: displayStatus.quote_url,
          author: quoteMeta.original_author
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (displayStatus.media_attachments.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mt-3">`);
        push_element($$renderer2, "div", 418, 4);
        MediaGallery($$renderer2, {
          media: displayStatus.media_attachments,
          sensitive: displayStatus.sensitive
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (displayStatus.poll) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mt-3 space-y-2 p-3 rounded-lg bg-surface-variant">`);
        push_element($$renderer2, "div", 427, 4);
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(displayStatus.poll.options);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let option = each_array[$$index];
          $$renderer2.push(`<div class="flex items-center gap-2">`);
          push_element($$renderer2, "div", 429, 6);
          if (displayStatus.poll.expired || displayStatus.poll.voted) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="flex-1">`);
            push_element($$renderer2, "div", 431, 8);
            $$renderer2.push(`<div class="flex justify-between items-center">`);
            push_element($$renderer2, "div", 432, 9);
            $$renderer2.push(`<span class="text-sm">`);
            push_element($$renderer2, "span", 433, 10);
            $$renderer2.push(`${escape_html(option.title)}</span>`);
            pop_element();
            $$renderer2.push(` <span class="text-sm text-text-secondary">`);
            push_element($$renderer2, "span", 434, 10);
            $$renderer2.push(`${escape_html(Math.round(option.votes_count / displayStatus.poll.votes_count * 100))}%</span>`);
            pop_element();
            $$renderer2.push(`</div>`);
            pop_element();
            $$renderer2.push(` <div class="mt-1 h-2 bg-surface rounded-full overflow-hidden">`);
            push_element($$renderer2, "div", 438, 9);
            $$renderer2.push(`<div class="h-full bg-primary transition-all duration-300"${attr_style(`width: ${stringify(option.votes_count / displayStatus.poll.votes_count * 100)}%`)}>`);
            push_element($$renderer2, "div", 439, 10);
            $$renderer2.push(`</div>`);
            pop_element();
            $$renderer2.push(`</div>`);
            pop_element();
            $$renderer2.push(`</div>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<button class="flex-1 text-left p-2 rounded-lg border border-border hover:bg-surface-variant transition-colors">`);
            push_element($$renderer2, "button", 446, 8);
            $$renderer2.push(`${escape_html(option.title)}</button>`);
            pop_element();
          }
          $$renderer2.push(`<!--]--></div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--> <div class="text-sm text-text-secondary mt-2">`);
        push_element($$renderer2, "div", 452, 5);
        $$renderer2.push(`${escape_html(displayStatus.poll.votes_count)} votes `);
        if (displayStatus.poll.expires_at) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`· ${escape_html(displayStatus.poll.expired ? "Ended" : "Ends")} ${escape_html(new Date(displayStatus.poll.expires_at).toLocaleDateString())}`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (displayStatus.card && !displayStatus.media_attachments.length) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<a${attr("href", displayStatus.card.url)} target="_blank" rel="noopener noreferrer" class="mt-3 flex gap-3 p-3 rounded-lg border border-border hover:bg-surface-variant transition-colors">`);
        push_element($$renderer2, "a", 462, 4);
        if (displayStatus.card.image) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<img${attr("src", displayStatus.card.image)} alt="" class="w-20 h-20 object-cover rounded" loading="lazy"/>`);
          push_element($$renderer2, "img", 469, 6);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="flex-1 min-w-0">`);
        push_element($$renderer2, "div", 476, 5);
        $$renderer2.push(`<div class="font-medium text-sm truncate">`);
        push_element($$renderer2, "div", 477, 6);
        $$renderer2.push(`${escape_html(displayStatus.card.title)}</div>`);
        pop_element();
        $$renderer2.push(` `);
        if (displayStatus.card.description) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="text-sm text-text-secondary line-clamp-2">`);
          push_element($$renderer2, "div", 479, 7);
          $$renderer2.push(`${escape_html(displayStatus.card.description)}</div>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="text-xs text-text-secondary truncate">`);
        push_element($$renderer2, "div", 481, 6);
        $$renderer2.push(`${escape_html(new URL(displayStatus.card.url).hostname)}</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</a>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (lesserStatus.community_notes && lesserStatus.community_notes.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">`);
        push_element($$renderer2, "div", 487, 4);
        $$renderer2.push(`<div class="flex items-center gap-2 mb-2">`);
        push_element($$renderer2, "div", 488, 5);
        $$renderer2.push(`<svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
        push_element($$renderer2, "svg", 489, 6);
        $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z">`);
        push_element($$renderer2, "path", 490, 7);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(` <span class="font-medium text-blue-900 dark:text-blue-100">`);
        push_element($$renderer2, "span", 492, 6);
        $$renderer2.push(`Community Note</span>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <!--[-->`);
        const each_array_1 = ensure_array_like(lesserStatus.community_notes.slice(0, 1));
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let note = each_array_1[$$index_1];
          $$renderer2.push(`<p class="text-sm text-blue-800 dark:text-blue-200">`);
          push_element($$renderer2, "p", 495, 6);
          $$renderer2.push(`${escape_html(note.content)}</p>`);
          pop_element();
          $$renderer2.push(` <div class="mt-2 flex items-center gap-4 text-xs text-blue-600 dark:text-blue-400">`);
          push_element($$renderer2, "div", 496, 6);
          $$renderer2.push(`<span>`);
          push_element($$renderer2, "span", 497, 7);
          $$renderer2.push(`${escape_html(note.votes_helpful)} found helpful</span>`);
          pop_element();
          $$renderer2.push(` `);
          if (note.votes_unhelpful > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span>`);
            push_element($$renderer2, "span", 499, 8);
            $$renderer2.push(`${escape_html(note.votes_unhelpful)} found unhelpful</span>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (lesserStatus.delivery_cost && authStore.currentUser) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mt-2 text-xs text-text-secondary">`);
        push_element($$renderer2, "div", 507, 4);
        $$renderer2.push(`Delivery cost: $${escape_html((lesserStatus.delivery_cost / 1e6).toFixed(6))}</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="mt-3 flex items-center gap-1 -ml-2">`);
      push_element($$renderer2, "div", 512, 3);
      $$renderer2.push(`<button class="flex items-center gap-1 px-2 py-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors" title="Reply"${attr("aria-label", `Reply to post${stringify(displayStatus.replies_count > 0 ? `, ${displayStatus.replies_count} replies` : "")}`)}>`);
      push_element($$renderer2, "button", 513, 4);
      $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">`);
      push_element($$renderer2, "svg", 519, 5);
      $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6">`);
      push_element($$renderer2, "path", 520, 6);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
      $$renderer2.push(` `);
      if (displayStatus.replies_count > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-sm" aria-hidden="true">`);
        push_element($$renderer2, "span", 523, 6);
        $$renderer2.push(`${escape_html(displayStatus.replies_count)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></button>`);
      pop_element();
      $$renderer2.push(` <div class="relative boost-menu-container">`);
      push_element($$renderer2, "div", 527, 4);
      $$renderer2.push(`<button${attr_class(`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${stringify(displayStatus.reblogged ? "text-green-500" : "text-text-secondary")} hover:text-green-500 hover:bg-green-500/10`)} title="Boost"${attr("aria-label", `${stringify(displayStatus.reblogged ? "Unboost" : "Boost")} post${stringify(displayStatus.reblogs_count > 0 ? `, ${displayStatus.reblogs_count} boosts` : "")}`)}${attr("aria-pressed", displayStatus.reblogged)}${attr("disabled", displayStatus.visibility === "private" || displayStatus.visibility === "direct", true)}>`);
      push_element($$renderer2, "button", 528, 5);
      $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">`);
      push_element($$renderer2, "svg", 545, 5);
      $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">`);
      push_element($$renderer2, "path", 546, 6);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
      $$renderer2.push(` `);
      if (displayStatus.reblogs_count > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-sm" aria-hidden="true">`);
        push_element($$renderer2, "span", 549, 6);
        $$renderer2.push(`${escape_html(displayStatus.reblogs_count)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></button>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` <button${attr_class(`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${stringify(displayStatus.favourited ? "text-amber-500" : "text-text-secondary")} hover:text-amber-500 hover:bg-amber-500/10`)} title="Favorite"${attr("aria-label", `${stringify(displayStatus.favourited ? "Unfavorite" : "Favorite")} post${stringify(displayStatus.favourites_count > 0 ? `, ${displayStatus.favourites_count} favorites` : "")}`)}${attr("aria-pressed", displayStatus.favourited)}>`);
      push_element($$renderer2, "button", 577, 4);
      $$renderer2.push(`<svg class="w-5 h-5"${attr("fill", displayStatus.favourited ? "currentColor" : "none")} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">`);
      push_element($$renderer2, "svg", 584, 5);
      $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z">`);
      push_element($$renderer2, "path", 585, 6);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
      $$renderer2.push(` `);
      if (displayStatus.favourites_count > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-sm" aria-hidden="true">`);
        push_element($$renderer2, "span", 588, 6);
        $$renderer2.push(`${escape_html(displayStatus.favourites_count)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></button>`);
      pop_element();
      $$renderer2.push(` <button${attr_class(`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${stringify(displayStatus.bookmarked ? "text-primary" : "text-text-secondary")} hover:text-primary hover:bg-primary/10`)} title="Bookmark"${attr("aria-label", `${stringify(displayStatus.bookmarked ? "Remove bookmark" : "Bookmark")} post`)}${attr("aria-pressed", displayStatus.bookmarked)}>`);
      push_element($$renderer2, "button", 592, 4);
      $$renderer2.push(`<svg class="w-5 h-5"${attr("fill", displayStatus.bookmarked ? "currentColor" : "none")} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">`);
      push_element($$renderer2, "svg", 599, 5);
      $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z">`);
      push_element($$renderer2, "path", 600, 6);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
      $$renderer2.push(`</button>`);
      pop_element();
      $$renderer2.push(` <button class="flex items-center gap-1 px-2 py-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors ml-auto" title="Share" aria-label="Share post">`);
      push_element($$renderer2, "button", 604, 4);
      $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">`);
      push_element($$renderer2, "svg", 610, 5);
      $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.658a3 3 0 01-5.266 0m5.266 0a3 3 0 00-5.266 0m5.266 0L18 18m-5.684-2.342a3 3 0 01-5.266 0M6.75 6l1.266 1.342M18 6l-1.266 1.342M12 12h.01">`);
      push_element($$renderer2, "path", 611, 6);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
      $$renderer2.push(`</button>`);
      pop_element();
      $$renderer2.push(` `);
      if (isOwnStatus) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="relative">`);
        push_element($$renderer2, "div", 616, 5);
        $$renderer2.push(`<button class="flex items-center gap-1 px-2 py-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors" title="More options" aria-label="More options for this post"${attr("aria-expanded", showMenu)} aria-haspopup="menu">`);
        push_element($$renderer2, "button", 617, 6);
        $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">`);
        push_element($$renderer2, "svg", 628, 7);
        $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z">`);
        push_element($$renderer2, "path", 629, 8);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(`</button>`);
        pop_element();
        $$renderer2.push(` `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</article>`);
      pop_element();
    },
    StatusCard
  );
}
StatusCard.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
TimelineSkeleton[FILENAME] = "src/lib/components/islands/svelte/TimelineSkeleton.svelte";
function TimelineSkeleton($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { count = 5 } = $$props;
      $$renderer2.push(`<div class="space-y-2">`);
      push_element($$renderer2, "div", 11, 0);
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(Array(count));
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        each_array[i];
        StatusSkeleton($$renderer2);
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    TimelineSkeleton
  );
}
TimelineSkeleton.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
ErrorState[FILENAME] = "src/lib/components/islands/svelte/ErrorState.svelte";
function ErrorState($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        error = null,
        title = "Something went wrong",
        message = "We encountered an error while loading this content.",
        onRetry
      } = $$props;
      const errorMessage = error?.message || message;
      $$renderer2.push(`<div class="flex-1 flex items-center justify-center p-8">`);
      push_element($$renderer2, "div", 19, 0);
      $$renderer2.push(`<div class="text-center max-w-md">`);
      push_element($$renderer2, "div", 20, 1);
      $$renderer2.push(`<div class="mx-auto w-16 h-16 mb-4 rounded-full bg-error/10 flex items-center justify-center">`);
      push_element($$renderer2, "div", 22, 2);
      $$renderer2.push(`<svg class="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
      push_element($$renderer2, "svg", 23, 3);
      $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z">`);
      push_element($$renderer2, "path", 24, 4);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <h2 class="text-xl font-semibold text-text mb-2">`);
      push_element($$renderer2, "h2", 28, 2);
      $$renderer2.push(`${escape_html(title)}</h2>`);
      pop_element();
      $$renderer2.push(` <p class="text-text-secondary mb-6">`);
      push_element($$renderer2, "p", 29, 2);
      $$renderer2.push(`${escape_html(errorMessage)}</p>`);
      pop_element();
      $$renderer2.push(` `);
      if (onRetry) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button class="btn btn-primary">`);
        push_element($$renderer2, "button", 32, 3);
        $$renderer2.push(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
        push_element($$renderer2, "svg", 33, 4);
        $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">`);
        push_element($$renderer2, "path", 34, 5);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(` Try again</button>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (error) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<details class="mt-4 text-left">`);
        push_element($$renderer2, "details", 41, 3);
        $$renderer2.push(`<summary class="cursor-pointer text-sm text-text-secondary hover:text-text">`);
        push_element($$renderer2, "summary", 42, 4);
        $$renderer2.push(`Show error details</summary>`);
        pop_element();
        $$renderer2.push(` <pre class="mt-2 p-3 bg-surface-variant rounded text-xs overflow-x-auto">`);
        push_element($$renderer2, "pre", 45, 4);
        $$renderer2.push(`${escape_html(error.stack || error.message)}
				</pre>`);
        pop_element();
        $$renderer2.push(`</details>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    ErrorState
  );
}
ErrorState.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
EmptyState[FILENAME] = "src/lib/components/islands/svelte/EmptyState.svelte";
function EmptyState($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        title = "No content yet",
        message = "When there's something to show, it will appear here.",
        icon = "inbox",
        action
      } = $$props;
      $$renderer2.push(`<div class="flex-1 flex items-center justify-center p-8">`);
      push_element($$renderer2, "div", 20, 0);
      $$renderer2.push(`<div class="text-center max-w-md">`);
      push_element($$renderer2, "div", 21, 1);
      $$renderer2.push(`<div class="mx-auto w-16 h-16 mb-4 rounded-full bg-surface-variant flex items-center justify-center">`);
      push_element($$renderer2, "div", 23, 2);
      if (icon === "inbox") {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<svg class="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
        push_element($$renderer2, "svg", 25, 4);
        $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4">`);
        push_element($$renderer2, "path", 26, 5);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        if (icon === "search") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<svg class="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
          push_element($$renderer2, "svg", 29, 4);
          $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z">`);
          push_element($$renderer2, "path", 30, 5);
          $$renderer2.push(`</path>`);
          pop_element();
          $$renderer2.push(`</svg>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
          if (icon === "users") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<svg class="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
            push_element($$renderer2, "svg", 33, 4);
            $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">`);
            push_element($$renderer2, "path", 34, 5);
            $$renderer2.push(`</path>`);
            pop_element();
            $$renderer2.push(`</svg>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` <h2 class="text-xl font-semibold text-text mb-2">`);
      push_element($$renderer2, "h2", 39, 2);
      $$renderer2.push(`${escape_html(title)}</h2>`);
      pop_element();
      $$renderer2.push(` <p class="text-text-secondary mb-6">`);
      push_element($$renderer2, "p", 40, 2);
      $$renderer2.push(`${escape_html(message)}</p>`);
      pop_element();
      $$renderer2.push(` `);
      if (action) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button class="btn btn-primary">`);
        push_element($$renderer2, "button", 43, 3);
        $$renderer2.push(`${escape_html(action.label)}</button>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    EmptyState
  );
}
EmptyState.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Timeline[FILENAME] = "src/lib/components/islands/svelte/Timeline.svelte";
prevent_snippet_stringification(renderStatusGroup);
function renderStatusGroup($$renderer, group) {
  validate_snippet_args($$renderer);
  StatusCard($$renderer, { status: group.status });
  $$renderer.push(`<!----> `);
  if (group.replies.length > 0) {
    $$renderer.push("<!--[-->");
    renderReplies($$renderer, group.replies, 1);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]-->`);
}
prevent_snippet_stringification(renderReplies);
function renderReplies($$renderer, replies, depth = 1) {
  validate_snippet_args($$renderer);
  $$renderer.push(`<!--[-->`);
  const each_array = ensure_array_like(replies);
  for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
    let reply = each_array[$$index_2];
    $$renderer.push(`<div class="ml-12">`);
    push_element($$renderer, "div", 353, 2);
    StatusCard($$renderer, { status: reply.status });
    $$renderer.push(`<!----> `);
    if (reply.replies.length > 0) {
      $$renderer.push("<!--[-->");
      renderReplies($$renderer, reply.replies, depth + 1);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--></div>`);
    pop_element();
  }
  $$renderer.push(`<!--]-->`);
}
function Timeline($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        type = "home",
        enableVirtualization = "auto",
        groupConversations = type === "home",
        // Default true for home
        enablePullToRefresh = true
      } = $$props;
      const timeline = timelineStore.timelines[type] || {
        statuses: [],
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        error: null
      };
      const groupedStatuses = (() => {
        console.log("[Timeline] Computing groupedStatuses:", { groupConversations, statusCount: timeline.statuses.length });
        if (!groupConversations) {
          return timeline.statuses.map((s) => ({ status: s, replies: [] }));
        }
        const statusMap = new Map(timeline.statuses.map((s) => [s.id, s]));
        const rootStatuses = [];
        const processed = /* @__PURE__ */ new Set();
        function collectReplies(statusId) {
          const replies = [];
          for (const status of timeline.statuses) {
            if (status.in_reply_to_id === statusId && !processed.has(status.id)) {
              processed.add(status.id);
              replies.push({ status, replies: collectReplies(status.id) });
            }
          }
          return replies;
        }
        for (const status of timeline.statuses) {
          if (processed.has(status.id)) continue;
          if (status.in_reply_to_id && statusMap.has(status.in_reply_to_id)) {
            continue;
          }
          processed.add(status.id);
          rootStatuses.push({ status, replies: collectReplies(status.id) });
        }
        return rootStatuses;
      })();
      const shouldVirtualize = enableVirtualization === true || enableVirtualization === "auto" && groupedStatuses.length > 50;
      function handleRefresh() {
        timelineStore.refreshTimeline(type);
      }
      $$renderer2.push(`<div class="relative h-full flex flex-col">`);
      push_element($$renderer2, "div", 236, 0);
      if (timeline.isLoading && timeline.statuses.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="flex-1 overflow-y-auto px-4 py-4">`);
        push_element($$renderer2, "div", 238, 2);
        TimelineSkeleton($$renderer2, { count: 10 });
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        if (timeline.error) {
          $$renderer2.push("<!--[-->");
          ErrorState($$renderer2, {
            error: timeline.error,
            title: "Unable to load timeline",
            onRetry: handleRefresh
          });
        } else {
          $$renderer2.push("<!--[!-->");
          if (timeline.statuses.length === 0) {
            $$renderer2.push("<!--[-->");
            EmptyState($$renderer2, {
              title: type === "home" ? "Your timeline is empty" : "No posts yet",
              message: type === "home" ? "Follow some people to see their posts here!" : type === "local" ? "Be the first to post something on this instance!" : "No public posts from other instances yet.",
              icon: "inbox"
            });
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<div class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">`);
            push_element($$renderer2, "div", 258, 2);
            if (enablePullToRefresh) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div${attr_class(`absolute top-0 left-0 right-0 flex justify-center py-4 transition-transform duration-300 ${stringify("-translate-y-full")}`)}>`);
              push_element($$renderer2, "div", 264, 4);
              $$renderer2.push(`<div class="flex items-center gap-2 text-text-secondary">`);
              push_element($$renderer2, "div", 268, 5);
              {
                $$renderer2.push("<!--[!-->");
                {
                  $$renderer2.push("<!--[!-->");
                  $$renderer2.push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">`);
                  push_element($$renderer2, "svg", 278, 7);
                  $$renderer2.push(`<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3">`);
                  push_element($$renderer2, "path", 279, 8);
                  $$renderer2.push(`</path>`);
                  pop_element();
                  $$renderer2.push(`</svg>`);
                  pop_element();
                  $$renderer2.push(` <span>`);
                  push_element($$renderer2, "span", 281, 7);
                  $$renderer2.push(`Pull to refresh</span>`);
                  pop_element();
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]--></div>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> `);
            {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`<div class="px-4 py-4 space-y-4">`);
              push_element($$renderer2, "div", 311, 4);
              $$renderer2.push(`<!--[-->`);
              const each_array_2 = ensure_array_like(groupedStatuses);
              for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
                let group = each_array_2[$$index_1];
                renderStatusGroup($$renderer2, group);
              }
              $$renderer2.push(`<!--]--></div>`);
              pop_element();
            }
            $$renderer2.push(`<!--]--> <div class="h-1">`);
            push_element($$renderer2, "div", 319, 3);
            $$renderer2.push(`</div>`);
            pop_element();
            $$renderer2.push(` `);
            if (timeline.hasMore) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="py-4 text-center">`);
              push_element($$renderer2, "div", 323, 4);
              if (timeline.isLoadingMore) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto">`);
                push_element($$renderer2, "div", 325, 6);
                $$renderer2.push(`</div>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
                if (!shouldVirtualize) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors">`);
                  push_element($$renderer2, "button", 327, 6);
                  $$renderer2.push(`Load more</button>`);
                  pop_element();
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]--></div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
              if (timeline.statuses.length > 0) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="py-4 text-center text-text-secondary">`);
                push_element($$renderer2, "div", 336, 4);
                $$renderer2.push(`<p>`);
                push_element($$renderer2, "p", 337, 5);
                $$renderer2.push(`No more posts</p>`);
                pop_element();
                $$renderer2.push(`</div>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div>`);
            pop_element();
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    Timeline
  );
}
Timeline.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
class AdapterCache {
  constructor(options = {}) {
    this.cache = /* @__PURE__ */ new Map();
    this.accessOrder = [];
    this.maxSize = options.maxSize ?? 1e3;
    this.defaultTTL = options.defaultTTL ?? 3e5;
    this.debug = options.debug ?? false;
    this.hits = 0;
    this.misses = 0;
    this.logger = options.logger;
  }
  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      this.log("miss", key);
      return void 0;
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.misses++;
      this.log("expired", key);
      return void 0;
    }
    this.updateAccessOrder(key);
    this.hits++;
    this.log("hit", key);
    return entry.value;
  }
  /**
   * Set value in cache
   */
  set(key, value, ttl) {
    const entry = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
      size: this.estimateSize(value)
    };
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.log("set", key, `ttl=${entry.ttl}ms`);
  }
  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== void 0;
  }
  /**
   * Delete entry from cache
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.log("delete", key);
    }
    return deleted;
  }
  /**
   * Clear all entries
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
    this.log("clear", "all");
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }
  /**
   * Invalidate entries matching a pattern
   */
  invalidate(pattern) {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    const patternStr = pattern.toString();
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }
    this.log("invalidate", patternStr, `${count} entries`);
    return count;
  }
  /**
   * Update access order (LRU tracking)
   */
  updateAccessOrder(key) {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }
  /**
   * Remove from access order
   */
  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }
  /**
   * Evict least recently used entry
   */
  evictLRU() {
    if (this.accessOrder.length === 0) return;
    const lruKey = this.accessOrder[0];
    if (lruKey === void 0) return;
    this.cache.delete(lruKey);
    this.accessOrder.shift();
    this.log("evict", lruKey);
  }
  /**
   * Estimate size of value (rough approximation)
   */
  estimateSize(value) {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1e3;
    }
  }
  /**
   * Debug logging
   */
  log(action, key, extra) {
    if (!this.debug) {
      return;
    }
    const stats = this.getStats();
    const entry = {
      scope: "cache",
      action,
      message: `${key}${extra ? ` ${extra}` : ""}`.trim(),
      stats
    };
    if (this.logger) {
      this.logger(entry);
    } else if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        `[Cache] ${action} key="${key}" ${extra || ""} (${stats.size}/${stats.maxSize}, hit rate: ${(stats.hitRate * 100).toFixed(1)}%)`
      );
    }
  }
}
new AdapterCache({
  maxSize: 1e3,
  defaultTTL: 3e5,
  // 5 minutes
  debug: false
});
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
const COMPOSE_CONTEXT_KEY = Symbol("compose-context");
function createComposeContext(config = {}, handlers = {}, initialState = {}, state) {
  const characterLimit = config.characterLimit || 500;
  const defaultState = {
    content: "",
    contentWarning: "",
    visibility: config.defaultVisibility || "public",
    mediaAttachments: [],
    submitting: false,
    error: null,
    characterCount: 0,
    overLimit: false,
    inReplyTo: void 0,
    contentWarningEnabled: false
  };
  const reactiveState = state || {
    ...defaultState,
    ...initialState
  };
  function reset() {
    Object.assign(reactiveState, defaultState);
  }
  const context = {
    config: {
      characterLimit,
      allowMedia: config.allowMedia ?? true,
      maxMediaAttachments: config.maxMediaAttachments || 4,
      allowPolls: config.allowPolls ?? true,
      allowContentWarnings: config.allowContentWarnings ?? true,
      defaultVisibility: config.defaultVisibility || "public",
      enableMarkdown: config.enableMarkdown ?? false,
      placeholder: config.placeholder || "What's on your mind?",
      class: config.class || ""
    },
    handlers,
    state: reactiveState,
    updateState: (partial) => {
      Object.assign(reactiveState, partial);
    },
    reset
  };
  setContext(COMPOSE_CONTEXT_KEY, context);
  return context;
}
function getComposeContext() {
  const context = getContext(COMPOSE_CONTEXT_KEY);
  if (!context) {
    throw new Error(
      "Compose context not found. Make sure you are using Compose components inside <Compose.Root>."
    );
  }
  return context;
}
Root[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/Root.svelte";
function Root($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { config = {}, handlers = {}, initialState = {}, children } = $$props;
      const characterLimit = config.characterLimit || 500;
      const defaultState = {
        content: "",
        contentWarning: "",
        visibility: config.defaultVisibility || "public",
        mediaAttachments: [],
        submitting: false,
        error: null,
        characterCount: 0,
        overLimit: false,
        inReplyTo: void 0,
        contentWarningEnabled: false
      };
      let state = { ...defaultState, ...initialState };
      state.characterCount = state.content.length + state.contentWarning.length;
      state.overLimit = state.characterCount > characterLimit;
      function resetState() {
        Object.assign(state, defaultState);
        state.characterCount = state.content.length + state.contentWarning.length;
        state.overLimit = state.characterCount > characterLimit;
      }
      const context = createComposeContext(config, handlers, initialState, state);
      context.reset = resetState;
      $$renderer2.push(`<form${attr_class(`compose-root ${context.config.class}`, "svelte-1mhx2b6", {
        "compose-root--submitting": context.state.submitting,
        "compose-root--over-limit": context.state.overLimit
      })}${attr("aria-busy", context.state.submitting)}>`);
      push_element($$renderer2, "form", 129, 0);
      if (context.state.error) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="compose-root__error svelte-1mhx2b6" role="alert">`);
        push_element($$renderer2, "div", 137, 2);
        $$renderer2.push(`${escape_html(context.state.error.message)}</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (context.state.inReplyTo) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="compose-root__reply-indicator svelte-1mhx2b6">`);
        push_element($$renderer2, "div", 143, 2);
        $$renderer2.push(`Replying to post</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (children) {
        $$renderer2.push("<!--[-->");
        children($$renderer2);
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></form>`);
      pop_element();
    },
    Root
  );
}
Root.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Editor[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/Editor.svelte";
function Editor($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { rows = 4, autofocus = false, class: className = "" } = $$props;
      const context = getComposeContext();
      $$renderer2.push(`<textarea${attr_class(`compose-editor ${className}`, "svelte-1hb5xix")}${attr("rows", rows)}${attr("placeholder", context.config.placeholder)}${attr("disabled", context.state.submitting, true)} aria-label="Compose post content" aria-describedby="compose-character-count">`);
      push_element($$renderer2, "textarea", 82, 0);
      const $$body = escape_html(context.state.content);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea>`);
      pop_element();
    },
    Editor
  );
}
Editor.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Submit[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/Submit.svelte";
function Submit($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        text = "Post",
        loadingText = "Posting...",
        class: className = ""
      } = $$props;
      const context = getComposeContext();
      j({ type: "submit" });
      context.state.submitting || context.state.overLimit || context.state.content.trim().length === 0;
      $$renderer2.push(`<button${attr_class(
        // Update button disabled state
        `compose-submit ${className}`,
        "svelte-gc2xzq"
      )}>`);
      push_element($$renderer2, "button", 56, 0);
      if (context.state.submitting) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="compose-submit__spinner svelte-gc2xzq">`);
        push_element($$renderer2, "span", 58, 2);
        $$renderer2.push(`<svg viewBox="0 0 24 24" aria-hidden="true" class="svelte-gc2xzq">`);
        push_element($$renderer2, "svg", 59, 3);
        $$renderer2.push(`<path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z">`);
        push_element($$renderer2, "path", 60, 4);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`<path fill="currentColor" d="M12 4a8 8 0 0 0-8 8h2a6 6 0 0 1 6-6z">`);
        push_element($$renderer2, "path", 64, 4);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(`</span>`);
        pop_element();
        $$renderer2.push(` ${escape_html(loadingText)}`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`${escape_html(text)}`);
      }
      $$renderer2.push(`<!--]--></button>`);
      pop_element();
    },
    Submit
  );
}
Submit.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
CharacterCount[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/CharacterCount.svelte";
function CharacterCount($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { showProgress = true, class: className = "" } = $$props;
      const context = getComposeContext();
      const percentage = context.state.characterCount / context.config.characterLimit * 100;
      const isNearLimit = percentage >= 80;
      const isOverLimit = context.state.overLimit;
      const radius = 14;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - percentage / 100 * circumference;
      $$renderer2.push(`<div id="compose-character-count"${attr_class(`compose-character-count ${className}`, "svelte-1gfrkus", {
        "compose-character-count--near-limit": isNearLimit,
        "compose-character-count--over-limit": isOverLimit
      })} role="status" aria-live="polite"${attr("aria-label", `${context.state.characterCount} of ${context.config.characterLimit} characters used`)}>`);
      push_element($$renderer2, "div", 46, 0);
      if (showProgress) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<svg class="compose-character-count__progress svelte-1gfrkus" width="32" height="32" viewBox="0 0 32 32">`);
        push_element($$renderer2, "svg", 56, 2);
        $$renderer2.push(`<circle cx="16" cy="16"${attr("r", radius)} fill="none" stroke="var(--compose-progress-bg, #e1e8ed)" stroke-width="2">`);
        push_element($$renderer2, "circle", 58, 3);
        $$renderer2.push(`</circle>`);
        pop_element();
        $$renderer2.push(`<circle cx="16" cy="16"${attr("r", radius)} fill="none" stroke="currentColor" stroke-width="2"${attr("stroke-dasharray", circumference)}${attr("stroke-dashoffset", offset)} transform="rotate(-90 16 16)" class="compose-character-count__progress-circle svelte-1gfrkus">`);
        push_element($$renderer2, "circle", 67, 3);
        $$renderer2.push(`</circle>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (isNearLimit || isOverLimit) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="compose-character-count__text svelte-1gfrkus">`);
        push_element($$renderer2, "span", 83, 2);
        $$renderer2.push(`${escape_html(context.state.characterCount)} / ${escape_html(context.config.characterLimit)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    CharacterCount
  );
}
CharacterCount.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
VisibilitySelect[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/VisibilitySelect.svelte";
function VisibilitySelect($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { class: className = "" } = $$props;
      const context = getComposeContext();
      const visibilityOptions = [
        {
          value: "public",
          label: "Public",
          icon: "🌐",
          description: "Anyone can see this post"
        },
        {
          value: "unlisted",
          label: "Unlisted",
          icon: "🔓",
          description: "Not shown in public timelines"
        },
        {
          value: "private",
          label: "Followers only",
          icon: "🔒",
          description: "Only your followers can see"
        },
        {
          value: "direct",
          label: "Direct",
          icon: "✉️",
          description: "Only mentioned users can see"
        }
      ];
      const currentOption = visibilityOptions.find((opt) => opt.value === context.state.visibility) || visibilityOptions[0];
      function handleChange(event) {
        const target = event.target;
        context.updateState({ visibility: target.value });
      }
      $$renderer2.push(`<div${attr_class(`compose-visibility-select ${className}`, "svelte-sjbzfi")}>`);
      push_element($$renderer2, "div", 74, 0);
      $$renderer2.push(`<label for="compose-visibility" class="compose-visibility-select__label svelte-sjbzfi">`);
      push_element($$renderer2, "label", 75, 1);
      $$renderer2.push(`Visibility</label>`);
      pop_element();
      $$renderer2.push(` `);
      $$renderer2.select(
        {
          id: "compose-visibility",
          class: "compose-visibility-select__select",
          value: context.state.visibility,
          onchange: handleChange,
          disabled: context.state.submitting,
          "aria-label": "Post visibility"
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(visibilityOptions);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let option = each_array[$$index];
            $$renderer3.option({ value: option.value }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(option.icon)}
				${escape_html(option.label)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        },
        "svelte-sjbzfi"
      );
      $$renderer2.push(` <p class="compose-visibility-select__description svelte-sjbzfi">`);
      push_element($$renderer2, "p", 91, 1);
      $$renderer2.push(`${escape_html(currentOption.description)}</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    VisibilitySelect
  );
}
VisibilitySelect.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
AutocompleteMenu[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/AutocompleteMenu.svelte";
function AutocompleteMenu($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        suggestions,
        selectedIndex = 0,
        position,
        loading = false,
        onSelect,
        onClose,
        class: className = ""
      } = $$props;
      $$renderer2.push(`<div${attr_class(
        // Attach event listeners
        /**
         * Scroll selected item into view
         */
        `autocomplete-menu ${className}`,
        "svelte-v7258j"
      )}${attr_style(`left: ${position.x}px; top: ${position.y}px;`)} role="listbox" aria-label="Autocomplete suggestions">`);
      push_element($$renderer2, "div", 110, 0);
      if (loading) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="autocomplete-menu__loading svelte-v7258j">`);
        push_element($$renderer2, "div", 118, 2);
        $$renderer2.push(`<span class="autocomplete-menu__spinner svelte-v7258j">`);
        push_element($$renderer2, "span", 119, 3);
        $$renderer2.push(`</span>`);
        pop_element();
        $$renderer2.push(` <span>`);
        push_element($$renderer2, "span", 120, 3);
        $$renderer2.push(`Loading suggestions...</span>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        if (suggestions.length === 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="autocomplete-menu__empty svelte-v7258j">`);
          push_element($$renderer2, "div", 123, 2);
          $$renderer2.push(`No suggestions found</div>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<!--[-->`);
          const each_array = ensure_array_like(suggestions);
          for (let index = 0, $$length = each_array.length; index < $$length; index++) {
            let suggestion = each_array[index];
            $$renderer2.push(`<button${attr_class("autocomplete-menu__item svelte-v7258j", void 0, { "autocomplete-menu__item--selected": index === selectedIndex })}${attr("data-index", index)} role="option"${attr("aria-selected", index === selectedIndex)} type="button">`);
            push_element($$renderer2, "button", 126, 3);
            if (suggestion.type === "mention" && suggestion.metadata?.avatar) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<img${attr("src", suggestion.metadata.avatar)} alt="" class="autocomplete-menu__avatar svelte-v7258j"/>`);
              push_element($$renderer2, "img", 136, 5);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <div class="autocomplete-menu__content svelte-v7258j">`);
            push_element($$renderer2, "div", 139, 4);
            $$renderer2.push(`<div class="autocomplete-menu__primary svelte-v7258j">`);
            push_element($$renderer2, "div", 140, 5);
            $$renderer2.push(`${escape_html(suggestion.text)}</div>`);
            pop_element();
            $$renderer2.push(` `);
            if (suggestion.type === "mention" && suggestion.metadata) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="autocomplete-menu__secondary svelte-v7258j">`);
              push_element($$renderer2, "div", 143, 6);
              if (suggestion.metadata.displayName) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`${escape_html(suggestion.metadata.displayName)}`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> `);
              if (suggestion.metadata.followers !== void 0) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<span class="autocomplete-menu__followers svelte-v7258j">`);
                push_element($$renderer2, "span", 148, 8);
                $$renderer2.push(`${escape_html(suggestion.metadata.followers.toLocaleString())} followers</span>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--></div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> `);
            if (suggestion.type === "hashtag") {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="autocomplete-menu__secondary svelte-v7258j">`);
              push_element($$renderer2, "div", 156, 6);
              $$renderer2.push(`#${escape_html(suggestion.value)}</div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div>`);
            pop_element();
            $$renderer2.push(` `);
            if (suggestion.type === "emoji") {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span class="autocomplete-menu__emoji svelte-v7258j">`);
              push_element($$renderer2, "span", 161, 5);
              $$renderer2.push(`${escape_html(suggestion.value)}</span>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></button>`);
            pop_element();
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    AutocompleteMenu
  );
}
AutocompleteMenu.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
EditorWithAutocomplete[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/EditorWithAutocomplete.svelte";
function EditorWithAutocomplete($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        rows = 4,
        autofocus = false,
        searchHandler,
        class: className = ""
      } = $$props;
      const context = getComposeContext();
      $$renderer2.push(`<div class="editor-with-autocomplete svelte-rf2u5x">`);
      push_element($$renderer2, "div", 292, 0);
      $$renderer2.push(`<textarea${attr_class(`compose-editor ${className}`, "svelte-rf2u5x")}${attr("rows", rows)}${attr("placeholder", context.config.placeholder)}${attr("disabled", context.state.submitting, true)} aria-label="Compose post content" aria-describedby="compose-character-count">`);
      push_element($$renderer2, "textarea", 293, 1);
      const $$body = escape_html(context.state.content);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    EditorWithAutocomplete
  );
}
EditorWithAutocomplete.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
DraftSaver[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/DraftSaver.svelte";
function DraftSaver($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        draftKey = "default",
        autoSave = true,
        intervalSeconds = 30,
        showIndicator = true,
        class: className = ""
      } = $$props;
      getComposeContext();
      if (
        /**
        * Auto-save effect
        */
        // Only save if there's content
        /**
         * Load draft on mount if exists
         */
        /**
         * Update draft age periodically
         */
        /**
         * Clear draft when submitted
         */
        showIndicator
      ) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div${attr_class(`draft-saver ${className}`, "svelte-1md1jbi")}>`);
        push_element($$renderer2, "div", 182, 1);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    },
    DraftSaver
  );
}
DraftSaver.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
ThreadComposer[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/ThreadComposer.svelte";
function ThreadComposer($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        characterLimit = 500,
        maxPosts = 10,
        defaultVisibility = "public",
        onSubmitThread,
        onCancel,
        class: className = ""
      } = $$props;
      let posts = [
        {
          id: crypto.randomUUID(),
          content: "",
          characterCount: 0,
          overLimit: false
        }
      ];
      let submitting = false;
      let draggedPostId = null;
      j();
      j();
      j();
      const canSubmit = posts.some((p) => p.content.trim().length > 0) && !posts.some((p) => p.overLimit) && !submitting;
      $$renderer2.push(`<div${attr_class(`thread-composer ${className}`, "svelte-18qqf34")}>`);
      push_element($$renderer2, "div", 316, 0);
      $$renderer2.push(`<div class="thread-composer__header svelte-18qqf34">`);
      push_element($$renderer2, "div", 317, 1);
      $$renderer2.push(`<h3 class="thread-composer__title svelte-18qqf34">`);
      push_element($$renderer2, "h3", 318, 2);
      $$renderer2.push(`Compose Thread <span class="thread-composer__count svelte-18qqf34">`);
      push_element($$renderer2, "span", 320, 3);
      $$renderer2.push(`${escape_html(posts.length)} / ${escape_html(maxPosts)} posts</span>`);
      pop_element();
      $$renderer2.push(`</h3>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="thread-composer__posts svelte-18qqf34" role="list" aria-label="Thread posts">`);
      push_element($$renderer2, "div", 330, 1);
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(posts);
      for (let index = 0, $$length = each_array.length; index < $$length; index++) {
        let post = each_array[index];
        $$renderer2.push(`<div${attr_class("thread-post svelte-18qqf34", void 0, { "thread-post--dragging": draggedPostId === post.id })} draggable="true" role="listitem"${attr("aria-grabbed", draggedPostId === post.id)}>`);
        push_element($$renderer2, "div", 332, 3);
        $$renderer2.push(`<div class="thread-post__header svelte-18qqf34">`);
        push_element($$renderer2, "div", 342, 4);
        $$renderer2.push(`<div class="thread-post__number svelte-18qqf34">`);
        push_element($$renderer2, "div", 343, 5);
        $$renderer2.push(`${escape_html(index + 1)}</div>`);
        pop_element();
        $$renderer2.push(` <div class="thread-post__controls svelte-18qqf34">`);
        push_element($$renderer2, "div", 345, 5);
        $$renderer2.push(`<button type="button" class="thread-post__control svelte-18qqf34"${attr("disabled", index === 0, true)} title="Move up" aria-label="Move post up">`);
        push_element($$renderer2, "button", 346, 6);
        $$renderer2.push(`↑</button>`);
        pop_element();
        $$renderer2.push(` <button type="button" class="thread-post__control svelte-18qqf34"${attr("disabled", index === posts.length - 1, true)} title="Move down" aria-label="Move post down">`);
        push_element($$renderer2, "button", 356, 6);
        $$renderer2.push(`↓</button>`);
        pop_element();
        $$renderer2.push(` <button type="button" class="thread-post__control thread-post__control--remove svelte-18qqf34"${attr("disabled", posts.length === 1, true)} title="Remove post" aria-label="Remove post">`);
        push_element($$renderer2, "button", 366, 6);
        $$renderer2.push(`×</button>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <textarea${attr_class("thread-post__textarea svelte-18qqf34", void 0, { "thread-post__textarea--over-limit": post.overLimit })} placeholder="What's on your mind?"${attr("disabled", submitting, true)} rows="4">`);
        push_element($$renderer2, "textarea", 379, 4);
        const $$body = escape_html(post.content);
        if ($$body) {
          $$renderer2.push(`${$$body}`);
        }
        $$renderer2.push(`</textarea>`);
        pop_element();
        $$renderer2.push(` <div class="thread-post__footer svelte-18qqf34">`);
        push_element($$renderer2, "div", 389, 4);
        $$renderer2.push(`<div${attr_class("thread-post__char-count svelte-18qqf34", void 0, {
          "thread-post__char-count--near-limit": post.characterCount / characterLimit >= 0.8,
          "thread-post__char-count--over-limit": post.overLimit
        })}>`);
        push_element($$renderer2, "div", 390, 5);
        $$renderer2.push(`${escape_html(post.characterCount)} / ${escape_html(characterLimit)}</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` <div class="thread-composer__actions svelte-18qqf34">`);
      push_element($$renderer2, "div", 401, 1);
      $$renderer2.push(`<button type="button" class="thread-composer__add-post svelte-18qqf34"${attr("disabled", posts.length >= maxPosts || submitting, true)}>`);
      push_element($$renderer2, "button", 402, 2);
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" class="svelte-18qqf34">`);
      push_element($$renderer2, "svg", 409, 3);
      $$renderer2.push(`<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z">`);
      push_element($$renderer2, "path", 410, 4);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
      $$renderer2.push(` Add post to thread</button>`);
      pop_element();
      $$renderer2.push(` <div class="thread-composer__submit-group svelte-18qqf34">`);
      push_element($$renderer2, "div", 415, 2);
      $$renderer2.push(`<button type="button" class="thread-composer__cancel svelte-18qqf34"${attr("disabled", submitting, true)}>`);
      push_element($$renderer2, "button", 416, 3);
      $$renderer2.push(`Cancel</button>`);
      pop_element();
      $$renderer2.push(` <button type="button" class="thread-composer__submit svelte-18qqf34"${attr("disabled", !canSubmit, true)}>`);
      push_element($$renderer2, "button", 426, 3);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`Post thread (${escape_html(posts.filter((p) => p.content.trim()).length)})`);
      }
      $$renderer2.push(`<!--]--></button>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    ThreadComposer
  );
}
ThreadComposer.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
MediaUpload[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/MediaUpload.svelte";
function MediaUpload($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      const SPOILER_MAX_LENGTH = 200;
      const DESCRIPTION_MAX_LENGTH = 1500;
      const MEDIA_CATEGORY_OPTIONS = [
        { value: "IMAGE", label: "Image" },
        { value: "VIDEO", label: "Video" },
        { value: "AUDIO", label: "Audio" },
        { value: "GIFV", label: "Animated GIF" },
        { value: "DOCUMENT", label: "Document" }
      ];
      let {
        onUpload,
        onRemove,
        maxFiles = 4,
        config = {},
        class: className = ""
      } = $$props;
      let files = [];
      let isDragging = false;
      let sensitiveVisibility = {};
      j();
      function getPreviewType(file) {
        switch (file.mediaCategory) {
          case "IMAGE":
            return "image";
          case "VIDEO":
          case "GIFV":
            return "video";
          case "AUDIO":
            return "audio";
          default:
            return "file";
        }
      }
      const canAddMore = files.length < maxFiles;
      $$renderer2.push(`<div${attr_class(`media-upload ${className}`, "svelte-mzn3xv")}>`);
      push_element($$renderer2, "div", 335, 0);
      $$renderer2.push(`<input type="file" accept="image/*,video/*,audio/*" multiple style="display: none;"/>`);
      push_element($$renderer2, "input", 336, 1);
      pop_element();
      $$renderer2.push(` `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (files.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div${attr_class("media-upload__drop-zone svelte-mzn3xv", void 0, { "media-upload__drop-zone--dragging": isDragging })} role="button" tabindex="0">`);
        push_element($$renderer2, "div", 352, 2);
        $$renderer2.push(`<svg class="media-upload__icon svelte-mzn3xv" viewBox="0 0 24 24" fill="currentColor">`);
        push_element($$renderer2, "svg", 363, 3);
        $$renderer2.push(`<path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z">`);
        push_element($$renderer2, "path", 364, 4);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(` <div class="media-upload__text svelte-mzn3xv">`);
        push_element($$renderer2, "div", 366, 3);
        {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<strong class="svelte-mzn3xv">`);
          push_element($$renderer2, "strong", 370, 5);
          $$renderer2.push(`Click or drag files to upload</strong>`);
          pop_element();
          $$renderer2.push(` <span class="svelte-mzn3xv">`);
          push_element($$renderer2, "span", 371, 5);
          $$renderer2.push(`Images, videos, or audio</span>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="media-upload__grid svelte-mzn3xv">`);
        push_element($$renderer2, "div", 376, 2);
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(files);
        for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
          let file = each_array[$$index_1];
          const previewType = getPreviewType(file);
          $$renderer2.push(`<div class="media-upload__item svelte-mzn3xv">`);
          push_element($$renderer2, "div", 379, 4);
          $$renderer2.push(`<div${attr_class("media-upload__preview svelte-mzn3xv", void 0, {
            "media-upload__preview--blurred": file.sensitive && sensitiveVisibility[file.id] !== true
          })}>`);
          push_element($$renderer2, "div", 380, 5);
          if (previewType === "image" && file.previewUrl) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<img${attr("src", file.previewUrl)}${attr("alt", file.description || file.file.name)} class="media-upload__preview-image svelte-mzn3xv"/>`);
            push_element($$renderer2, "img", 385, 7);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
            if (previewType === "video" && file.previewUrl) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<video${attr("src", file.previewUrl)} class="media-upload__preview-video svelte-mzn3xv" muted loop>`);
              push_element($$renderer2, "video", 391, 7);
              $$renderer2.push(`</video>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
              if (previewType === "audio") {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="media-upload__preview-audio svelte-mzn3xv">`);
                push_element($$renderer2, "div", 398, 7);
                $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" class="svelte-mzn3xv">`);
                push_element($$renderer2, "svg", 399, 8);
                $$renderer2.push(`<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z">`);
                push_element($$renderer2, "path", 400, 9);
                $$renderer2.push(`</path>`);
                pop_element();
                $$renderer2.push(`</svg>`);
                pop_element();
                $$renderer2.push(` <span class="svelte-mzn3xv">`);
                push_element($$renderer2, "span", 402, 8);
                $$renderer2.push(`${escape_html(file.file.name)}</span>`);
                pop_element();
                $$renderer2.push(`</div>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]--> `);
          if (file.sensitive && file.status !== "uploading" && file.status !== "error") {
            $$renderer2.push("<!--[-->");
            if (sensitiveVisibility[file.id] !== true) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="media-upload__overlay media-upload__overlay--sensitive svelte-mzn3xv">`);
              push_element($$renderer2, "div", 408, 7);
              $$renderer2.push(`<span class="media-upload__overlay-label svelte-mzn3xv">`);
              push_element($$renderer2, "span", 409, 8);
              $$renderer2.push(`Sensitive media</span>`);
              pop_element();
              $$renderer2.push(` `);
              if (file.spoilerText) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<p class="media-upload__overlay-text svelte-mzn3xv">`);
                push_element($$renderer2, "p", 411, 9);
                $$renderer2.push(`${escape_html(file.spoilerText)}</p>`);
                pop_element();
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]--> <button type="button" class="media-upload__reveal svelte-mzn3xv">`);
              push_element($$renderer2, "button", 413, 8);
              $$renderer2.push(`Reveal media</button>`);
              pop_element();
              $$renderer2.push(`</div>`);
              pop_element();
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`<div class="media-upload__badge svelte-mzn3xv">`);
              push_element($$renderer2, "div", 422, 7);
              $$renderer2.push(`Sensitive</div>`);
              pop_element();
            }
            $$renderer2.push(`<!--]-->`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (file.status === "uploading") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="media-upload__overlay svelte-mzn3xv">`);
            push_element($$renderer2, "div", 427, 7);
            $$renderer2.push(`<div class="media-upload__progress svelte-mzn3xv">`);
            push_element($$renderer2, "div", 428, 8);
            $$renderer2.push(`<svg class="media-upload__progress-ring svelte-mzn3xv" viewBox="0 0 36 36">`);
            push_element($$renderer2, "svg", 429, 9);
            $$renderer2.push(`<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="white" stroke-width="3"${attr("stroke-dasharray", `${file.progress}, 100`)}>`);
            push_element($$renderer2, "path", 430, 10);
            $$renderer2.push(`</path>`);
            pop_element();
            $$renderer2.push(`</svg>`);
            pop_element();
            $$renderer2.push(` <span class="media-upload__progress-text svelte-mzn3xv">`);
            push_element($$renderer2, "span", 438, 9);
            $$renderer2.push(`${escape_html(Math.round(file.progress))}%</span>`);
            pop_element();
            $$renderer2.push(`</div>`);
            pop_element();
            $$renderer2.push(`</div>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (file.status === "error") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="media-upload__overlay media-upload__overlay--error svelte-mzn3xv">`);
            push_element($$renderer2, "div", 444, 7);
            $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" class="svelte-mzn3xv">`);
            push_element($$renderer2, "svg", 445, 8);
            $$renderer2.push(`<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z">`);
            push_element($$renderer2, "path", 446, 9);
            $$renderer2.push(`</path>`);
            pop_element();
            $$renderer2.push(`</svg>`);
            pop_element();
            $$renderer2.push(` <span class="svelte-mzn3xv">`);
            push_element($$renderer2, "span", 448, 8);
            $$renderer2.push(`${escape_html(file.error)}</span>`);
            pop_element();
            $$renderer2.push(`</div>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> <button type="button" class="media-upload__remove svelte-mzn3xv" aria-label="Remove file">`);
          push_element($$renderer2, "button", 452, 6);
          $$renderer2.push(`×</button>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
          $$renderer2.push(` <div class="media-upload__info svelte-mzn3xv">`);
          push_element($$renderer2, "div", 462, 4);
          $$renderer2.push(`<div class="media-upload__filename svelte-mzn3xv">`);
          push_element($$renderer2, "div", 463, 5);
          $$renderer2.push(`${escape_html(file.file.name)}</div>`);
          pop_element();
          $$renderer2.push(` <div class="media-upload__filesize svelte-mzn3xv">`);
          push_element($$renderer2, "div", 464, 5);
          $$renderer2.push(`${escape_html(formatFileSize(file.metadata?.size || 0))}</div>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
          $$renderer2.push(` <div class="media-upload__meta svelte-mzn3xv">`);
          push_element($$renderer2, "div", 467, 4);
          $$renderer2.push(`<label class="media-upload__field media-upload__field--toggle svelte-mzn3xv">`);
          push_element($$renderer2, "label", 468, 5);
          $$renderer2.push(`<input type="checkbox"${attr("checked", file.sensitive, true)}/>`);
          push_element($$renderer2, "input", 469, 6);
          pop_element();
          $$renderer2.push(` <span class="svelte-mzn3xv">`);
          push_element($$renderer2, "span", 476, 6);
          $$renderer2.push(`Sensitive content</span>`);
          pop_element();
          $$renderer2.push(`</label>`);
          pop_element();
          $$renderer2.push(` <label class="media-upload__field svelte-mzn3xv">`);
          push_element($$renderer2, "label", 479, 5);
          $$renderer2.push(`<span class="media-upload__field-label svelte-mzn3xv">`);
          push_element($$renderer2, "span", 480, 6);
          $$renderer2.push(`Spoiler text <span class="media-upload__counter svelte-mzn3xv">`);
          push_element($$renderer2, "span", 482, 7);
          $$renderer2.push(`${escape_html(file.spoilerText.length)}/200</span>`);
          pop_element();
          $$renderer2.push(`</span>`);
          pop_element();
          $$renderer2.push(` <input type="text"${attr("value", file.spoilerText)}${attr("maxlength", SPOILER_MAX_LENGTH)} placeholder="Optional warning shown before media" class="svelte-mzn3xv"/>`);
          push_element($$renderer2, "input", 484, 6);
          pop_element();
          $$renderer2.push(`</label>`);
          pop_element();
          $$renderer2.push(` <label class="media-upload__field svelte-mzn3xv">`);
          push_element($$renderer2, "label", 495, 5);
          $$renderer2.push(`<span class="media-upload__field-label svelte-mzn3xv">`);
          push_element($$renderer2, "span", 496, 6);
          $$renderer2.push(`Description <span class="media-upload__counter svelte-mzn3xv">`);
          push_element($$renderer2, "span", 498, 7);
          $$renderer2.push(`${escape_html((file.description || "").length)}/1500</span>`);
          pop_element();
          $$renderer2.push(`</span>`);
          pop_element();
          $$renderer2.push(` <textarea rows="3"${attr("maxlength", DESCRIPTION_MAX_LENGTH)} placeholder="Describe the media for accessibility" class="svelte-mzn3xv">`);
          push_element($$renderer2, "textarea", 502, 5);
          const $$body = escape_html(file.description ?? "");
          if ($$body) {
            $$renderer2.push(`${$$body}`);
          }
          $$renderer2.push(`</textarea>`);
          pop_element();
          $$renderer2.push(`</label>`);
          pop_element();
          $$renderer2.push(` <label class="media-upload__field svelte-mzn3xv">`);
          push_element($$renderer2, "label", 512, 5);
          $$renderer2.push(`<span class="media-upload__field-label svelte-mzn3xv">`);
          push_element($$renderer2, "span", 513, 6);
          $$renderer2.push(`Media type</span>`);
          pop_element();
          $$renderer2.push(` <select class="svelte-mzn3xv">`);
          push_element($$renderer2, "select", 514, 6);
          $$renderer2.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(MEDIA_CATEGORY_OPTIONS);
          for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
            let option = each_array_1[$$index];
            $$renderer2.option(
              {
                value: option.value,
                selected: option.value === file.mediaCategory
              },
              ($$renderer3) => {
                $$renderer3.push(`${escape_html(option.label)}`);
              }
            );
          }
          $$renderer2.push(`<!--]--></select>`);
          pop_element();
          $$renderer2.push(`</label>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--> `);
        if (canAddMore) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button type="button" class="media-upload__add-more svelte-mzn3xv">`);
          push_element($$renderer2, "button", 534, 4);
          $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" class="svelte-mzn3xv">`);
          push_element($$renderer2, "svg", 540, 5);
          $$renderer2.push(`<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z">`);
          push_element($$renderer2, "path", 541, 6);
          $$renderer2.push(`</path>`);
          pop_element();
          $$renderer2.push(`</svg>`);
          pop_element();
          $$renderer2.push(` <span class="svelte-mzn3xv">`);
          push_element($$renderer2, "span", 543, 5);
          $$renderer2.push(`Add more</span>`);
          pop_element();
          $$renderer2.push(`</button>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    MediaUpload
  );
}
MediaUpload.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
ImageEditor[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-fediverse@file+..+greater-components+packages+fediverse_graphql@16.12.0_svelte@5.43.6/node_modules/@equaltoai/greater-components-fediverse/src/components/Compose/ImageEditor.svelte";
function ImageEditor($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        image = void 0,
        maxAltTextLength = 1500,
        showFocalPoint = true,
        onSave,
        onCancel,
        class: className = ""
      } = $$props;
      let description = image.description || "";
      let focalPoint = image.focalPoint || { x: 0, y: 0 };
      let isDraggingFocal = false;
      j();
      j();
      const focalPositionPercent = {
        x: (focalPoint.x + 1) / 2 * 100,
        y: (focalPoint.y + 1) / 2 * 100
      };
      const remainingChars = maxAltTextLength - description.length;
      const isDescriptionOverLimit = description.length > maxAltTextLength;
      $$renderer2.push(`<div${attr_class(`image-editor ${className}`, "svelte-1650mjm")}>`);
      push_element($$renderer2, "div", 217, 0);
      $$renderer2.push(`<div class="image-editor__preview svelte-1650mjm">`);
      push_element($$renderer2, "div", 218, 1);
      $$renderer2.push(`<div${attr_class("image-editor__image-container svelte-1650mjm", void 0, { "image-editor__image-container--dragging": isDraggingFocal })} role="button" tabindex="0" aria-label="Click to set focal point">`);
      push_element($$renderer2, "div", 219, 2);
      $$renderer2.push(`<img${attr("src", image.url)}${attr("alt", description || "Image preview")} class="image-editor__image svelte-1650mjm"/>`);
      push_element($$renderer2, "img", 228, 3);
      pop_element();
      $$renderer2.push(` `);
      if (showFocalPoint) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="image-editor__focal-point svelte-1650mjm"${attr_style(`left: ${focalPositionPercent.x}%; top: ${focalPositionPercent.y}%;`)} role="presentation">`);
        push_element($$renderer2, "div", 236, 4);
        $$renderer2.push(`<div class="image-editor__focal-point-inner svelte-1650mjm">`);
        push_element($$renderer2, "div", 241, 5);
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="image-editor__focal-instructions svelte-1650mjm">`);
        push_element($$renderer2, "div", 244, 4);
        $$renderer2.push(`Click or drag to set focal point</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      if (showFocalPoint) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="image-editor__focal-controls svelte-1650mjm">`);
        push_element($$renderer2, "div", 249, 3);
        $$renderer2.push(`<button type="button" class="image-editor__reset-button svelte-1650mjm">`);
        push_element($$renderer2, "button", 250, 4);
        $$renderer2.push(`Reset to center</button>`);
        pop_element();
        $$renderer2.push(` <span class="image-editor__focal-coords svelte-1650mjm">`);
        push_element($$renderer2, "span", 253, 4);
        $$renderer2.push(`x: ${escape_html(focalPoint.x.toFixed(2))}, y: ${escape_html(focalPoint.y.toFixed(2))}</span>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` <div class="image-editor__form svelte-1650mjm">`);
      push_element($$renderer2, "div", 260, 1);
      $$renderer2.push(`<div class="image-editor__field svelte-1650mjm">`);
      push_element($$renderer2, "div", 261, 2);
      $$renderer2.push(`<label for="alt-text" class="image-editor__label svelte-1650mjm">`);
      push_element($$renderer2, "label", 262, 3);
      $$renderer2.push(`Alt text (for accessibility) <span class="image-editor__required svelte-1650mjm">`);
      push_element($$renderer2, "span", 264, 4);
      $$renderer2.push(`Required</span>`);
      pop_element();
      $$renderer2.push(`</label>`);
      pop_element();
      $$renderer2.push(` <textarea id="alt-text"${attr_class("image-editor__textarea svelte-1650mjm", void 0, { "image-editor__textarea--error": isDescriptionOverLimit })} placeholder="Describe this image for people using screen readers..." rows="4"${attr("maxlength", maxAltTextLength)}>`);
      push_element($$renderer2, "textarea", 266, 3);
      const $$body = escape_html(description);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea>`);
      pop_element();
      $$renderer2.push(` <div${attr_class("image-editor__char-count svelte-1650mjm", void 0, { "image-editor__char-count--over": isDescriptionOverLimit })}>`);
      push_element($$renderer2, "div", 276, 3);
      $$renderer2.push(`${escape_html(remainingChars)} characters remaining</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="image-editor__actions svelte-1650mjm">`);
      push_element($$renderer2, "div", 284, 2);
      $$renderer2.push(`<button type="button" class="image-editor__cancel svelte-1650mjm">`);
      push_element($$renderer2, "button", 285, 3);
      $$renderer2.push(`Cancel</button>`);
      pop_element();
      $$renderer2.push(` <button type="button" class="image-editor__save svelte-1650mjm"${attr("disabled", isDescriptionOverLimit || !description.trim(), true)}>`);
      push_element($$renderer2, "button", 294, 3);
      $$renderer2.push(`Save</button>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      bind_props($$props, { image });
    },
    ImageEditor
  );
}
ImageEditor.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
const Compose = {
  /**
   * Root container that provides context and handles submission
   */
  Root,
  /**
   * Basic text editor textarea
   */
  Editor,
  /**
   * Enhanced text editor with hashtag/mention/emoji autocomplete
   */
  EditorWithAutocomplete,
  /**
   * Autocomplete dropdown menu (used by EditorWithAutocomplete)
   */
  AutocompleteMenu,
  /**
   * Submit button with loading state
   */
  Submit,
  /**
   * Character count display with Unicode support
   */
  CharacterCount,
  /**
   * Visibility selector dropdown
   */
  VisibilitySelect,
  /**
   * Auto-save drafts to localStorage
   */
  DraftSaver,
  /**
   * Multi-post thread composer
   */
  ThreadComposer,
  /**
   * Media upload with drag & drop and progress tracking
   */
  MediaUpload,
  /**
   * Image editor with focal point picker and alt text
   */
  ImageEditor
};
ComposeBoxGC[FILENAME] = "src/lib/components/islands/svelte/ComposeBoxGC.svelte";
function ComposeBoxGC($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { replyTo, quoteStatus, initialText, onPostSuccess } = $$props;
      const handlers = {
        onSubmit: async (data) => {
          try {
            const adapter = await getGraphQLAdapter();
            const visibilityMap = {
              "public": "PUBLIC",
              "unlisted": "UNLISTED",
              "private": "FOLLOWERS",
              "direct": "DIRECT"
            };
            const visibility = visibilityMap[data.visibility || "public"] || "PUBLIC";
            const response = await adapter.createNote({
              content: data.content,
              visibility,
              sensitive: data.sensitive || false,
              summary: data.spoilerText || void 0,
              inReplyToId: replyTo || data.inReplyToId || void 0
            });
            console.log("[ComposeBoxGC] Post created via GraphQL:", response);
            onPostSuccess?.();
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          } catch (error) {
            console.error("[ComposeBoxGC] Post failed:", error);
            throw error;
          }
        }
      };
      $$renderer2.push(`<!---->`);
      Compose.Root($$renderer2, {
        handlers,
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<!---->`);
          Compose.Editor($$renderer3, {
            autofocus: true,
            placeholder: initialText || "What's on your mind?"
          });
          $$renderer3.push(`<!----> <!---->`);
          Compose.CharacterCount($$renderer3, {});
          $$renderer3.push(`<!----> <!---->`);
          Compose.VisibilitySelect($$renderer3, {});
          $$renderer3.push(`<!----> <!---->`);
          Compose.Submit($$renderer3, {});
          $$renderer3.push(`<!---->`);
        }),
        $$slots: { default: true }
      });
      $$renderer2.push(`<!---->`);
    },
    ComposeBoxGC
  );
}
ComposeBoxGC.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  ComposeBoxGC as C,
  TimelineLayout as T,
  Timeline as a
};
