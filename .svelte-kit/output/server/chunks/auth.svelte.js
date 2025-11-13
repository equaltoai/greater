import { a2 as attributes, a0 as clsx, V as attr_class, F as FILENAME, _ as attr, Q as escape_html, a1 as bind_props, N as head, X as stringify } from "./index.js";
import { p as push_element, a as pop_element } from "./dev.js";
import { l as logDebug, s as secureAuthClient } from "./logger.js";
Button[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-primitives@file+..+greater-components+packages+primitives_72512e2dbfd882386a7e6d113d91f43e/node_modules/@equaltoai/greater-components-primitives/src/components/Button.svelte";
function Button($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        variant = "solid",
        size = "md",
        type = "button",
        disabled = false,
        loading = false,
        class: className = "",
        children,
        prefix,
        suffix,
        onclick,
        onkeydown,
        $$slots,
        $$events,
        ...restProps
      } = $$props;
      const buttonClass = () => {
        const classes = [
          "gr-button",
          `gr-button--${variant}`,
          `gr-button--${size}`,
          loading && "gr-button--loading",
          disabled && "gr-button--disabled",
          className
        ].filter(Boolean).join(" ");
        return classes;
      };
      $$renderer2.push(`<button${attributes({
        class: clsx(buttonClass()),
        type,
        disabled: disabled || loading,
        "aria-disabled": disabled || loading,
        "aria-busy": loading,
        tabindex: disabled ? -1 : 0,
        ...restProps
      })}>`);
      push_element($$renderer2, "button", 157, 0);
      if (prefix) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="gr-button__prefix">`);
        push_element($$renderer2, "span", 169, 4);
        prefix($$renderer2);
        $$renderer2.push(`<!----></span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (loading) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="gr-button__spinner" aria-hidden="true">`);
        push_element($$renderer2, "span", 175, 4);
        $$renderer2.push(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`);
        push_element($$renderer2, "svg", 176, 6);
        $$renderer2.push(`<path d="M21 12a9 9 0 11-6.219-8.56">`);
        push_element($$renderer2, "path", 186, 8);
        $$renderer2.push(`</path>`);
        pop_element();
        $$renderer2.push(`</svg>`);
        pop_element();
        $$renderer2.push(`</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span${attr_class("gr-button__content", void 0, { "gr-button__content--loading": loading })}>`);
      push_element($$renderer2, "span", 191, 2);
      if (children) {
        $$renderer2.push("<!--[-->");
        children($$renderer2);
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></span>`);
      pop_element();
      $$renderer2.push(` `);
      if (suffix) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="gr-button__suffix">`);
        push_element($$renderer2, "span", 198, 4);
        suffix($$renderer2);
        $$renderer2.push(`<!----></span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></button>`);
      pop_element();
    },
    Button
  );
}
Button.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
TextField[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-primitives@file+..+greater-components+packages+primitives_72512e2dbfd882386a7e6d113d91f43e/node_modules/@equaltoai/greater-components-primitives/src/components/TextField.svelte";
function TextField($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        label,
        value = "",
        type = "text",
        placeholder,
        invalid = false,
        disabled = false,
        readonly = false,
        required = false,
        helpText,
        errorMessage,
        class: className = "",
        inputClass = "",
        prefix,
        suffix,
        id,
        onblur,
        onfocus,
        oninput,
        onkeydown,
        $$slots,
        $$events,
        ...restProps
      } = $$props;
      const fieldId = id || `gr-textfield-${Math.random().toString(36).substr(2, 9)}`;
      const helpTextId = `${fieldId}-help`;
      const errorId = `${fieldId}-error`;
      let focused = false;
      let hasValue = Boolean(value);
      const fieldClass = () => {
        const classes = [
          "gr-textfield",
          focused,
          invalid && "gr-textfield--invalid",
          disabled && "gr-textfield--disabled",
          readonly && "gr-textfield--readonly",
          hasValue && "gr-textfield--has-value",
          className
        ].filter(Boolean).join(" ");
        return classes;
      };
      const inputClasses = () => {
        const classes = ["gr-textfield__input", inputClass].filter(Boolean).join(" ");
        return classes;
      };
      $$renderer2.push(`<div${attr_class(clsx(fieldClass()))}>`);
      push_element($$renderer2, "div", 98, 0);
      if (label) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<label${attr("for", fieldId)}${attr_class("gr-textfield__label", void 0, { "gr-textfield__label--required": required })}>`);
        push_element($$renderer2, "label", 100, 4);
        $$renderer2.push(`${escape_html(label)} `);
        if (required) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="gr-textfield__required" aria-hidden="true">`);
          push_element($$renderer2, "span", 107, 8);
          $$renderer2.push(`*</span>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></label>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="gr-textfield__container">`);
      push_element($$renderer2, "div", 112, 2);
      if (prefix) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="gr-textfield__prefix" aria-hidden="true">`);
        push_element($$renderer2, "div", 114, 6);
        prefix($$renderer2);
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <input${attributes(
        {
          type,
          id: fieldId,
          class: clsx(inputClasses()),
          placeholder,
          value,
          disabled,
          readonly,
          required,
          "aria-invalid": invalid,
          "aria-describedby": [
            helpText ? helpTextId : null,
            errorMessage && invalid ? errorId : null
          ].filter(Boolean).join(" ") || void 0,
          ...restProps
        },
        void 0,
        void 0,
        void 0,
        4
      )}/>`);
      push_element($$renderer2, "input", 119, 4);
      pop_element();
      $$renderer2.push(` `);
      if (suffix) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="gr-textfield__suffix" aria-hidden="true">`);
        push_element($$renderer2, "div", 141, 6);
        suffix($$renderer2);
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` `);
      if (helpText && !invalid) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div${attr("id", helpTextId)} class="gr-textfield__help">`);
        push_element($$renderer2, "div", 148, 4);
        $$renderer2.push(`${escape_html(helpText)}</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (errorMessage && invalid) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div${attr("id", errorId)} class="gr-textfield__error" role="alert" aria-live="polite">`);
        push_element($$renderer2, "div", 154, 4);
        $$renderer2.push(`${escape_html(errorMessage)}</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { value });
    },
    TextField
  );
}
TextField.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
const PREFERENCES_KEY$1 = "gr-preferences-v1";
const DEFAULT_PREFERENCES$1 = {
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
function clonePreferences$1(preferences) {
  return {
    ...preferences,
    customColors: {
      ...preferences.customColors
    }
  };
}
function mergePreferences$1(base, updates) {
  const next = {
    ...base,
    ...updates
  };
  next.customColors = {
    ...base.customColors,
    ...updates.customColors ?? {}
  };
  return clonePreferences$1(next);
}
let PreferencesStore$1 = class PreferencesStore {
  constructor() {
    this._preferences = clonePreferences$1(DEFAULT_PREFERENCES$1);
    this._systemColorScheme = "light";
    this._systemMotion = "normal";
    this._systemHighContrast = false;
    this.loadPreferences();
    this.setupSystemPreferenceDetection();
    this.applyTheme();
  }
  // Getters using $derived for computed values
  get preferences() {
    return clonePreferences$1(this._preferences);
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
    this._preferences = mergePreferences$1(this._preferences, updates);
    this.saveAndApply();
  }
  // Reset to defaults
  reset() {
    this._preferences = clonePreferences$1(DEFAULT_PREFERENCES$1);
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
        this._preferences = mergePreferences$1(DEFAULT_PREFERENCES$1, imported);
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
      const stored = localStorage.getItem(PREFERENCES_KEY$1);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (this.validatePreferences(parsed)) {
          this._preferences = mergePreferences$1(DEFAULT_PREFERENCES$1, parsed);
        }
      }
    } catch (error) {
      console.warn("Failed to load preferences from localStorage:", error);
    }
  }
  savePreferences() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREFERENCES_KEY$1, JSON.stringify(this._preferences));
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
};
new PreferencesStore$1();
ThemeProvider[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components-primitives@file+..+greater-components+packages+primitives_72512e2dbfd882386a7e6d113d91f43e/node_modules/@equaltoai/greater-components-primitives/src/components/ThemeProvider.svelte";
function ThemeProvider($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        theme,
        enableSystemDetection = true,
        enablePersistence = true,
        preventFlash = true,
        children
      } = $$props;
      head("14640p0", $$renderer2, ($$renderer3) => {
        if (preventFlash && typeof window === "undefined") {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<script>{preventFlashScript()}<\/script><!---->`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      });
      $$renderer2.push(`<div class="gr-theme-provider" data-theme-provider="">`);
      push_element($$renderer2, "div", 147, 0);
      children($$renderer2);
      $$renderer2.push(`<!----></div>`);
      pop_element();
    },
    ThemeProvider
  );
}
ThemeProvider.render = function() {
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
class PreferencesStore2 {
  // Internal state
  _preferences = clonePreferences(DEFAULT_PREFERENCES);
  _systemColorScheme = "light";
  _systemMotion = "normal";
  _systemHighContrast = false;
  // Media query matchers
  darkModeQuery;
  reducedMotionQuery;
  highContrastQuery;
  constructor() {
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
new PreferencesStore2();
const PUBLIC_VERSION = "5";
if (typeof window !== "undefined") {
  ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(PUBLIC_VERSION);
}
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
Globe[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components@file+..+greater-components+packages+greater-components_re_b4c086aa19ba9ae4cdaac7df975eaac6/node_modules/@equaltoai/greater-components/dist/icons/src/icons/globe.svelte";
function Globe($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        size = 24,
        color = "currentColor",
        strokeWidth = 2,
        class: className = "",
        $$slots,
        $$events,
        ...restProps
      } = $$props;
      $$renderer2.push(`<svg${attributes(
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: color,
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: `gr-icon gr-icon-globe ${stringify(className)}`,
          "aria-hidden": "true",
          ...restProps
        },
        void 0,
        void 0,
        void 0,
        3
      )}>`);
      push_element($$renderer2, "svg", 20, 0);
      $$renderer2.push(`<circle cx="12" cy="12" r="10">`);
      push_element($$renderer2, "circle", 34, 2);
      $$renderer2.push(`</circle>`);
      pop_element();
      $$renderer2.push(`<line x1="2" y1="12" x2="22" y2="12">`);
      push_element($$renderer2, "line", 34, 42);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z">`);
      push_element($$renderer2, "path", 34, 86);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
    },
    Globe
  );
}
Globe.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
User[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components@file+..+greater-components+packages+greater-components_re_b4c086aa19ba9ae4cdaac7df975eaac6/node_modules/@equaltoai/greater-components/dist/icons/src/icons/user.svelte";
function User($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        size = 24,
        color = "currentColor",
        strokeWidth = 2,
        class: className = "",
        $$slots,
        $$events,
        ...restProps
      } = $$props;
      $$renderer2.push(`<svg${attributes(
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: color,
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: `gr-icon gr-icon-user ${stringify(className)}`,
          "aria-hidden": "true",
          ...restProps
        },
        void 0,
        void 0,
        void 0,
        3
      )}>`);
      push_element($$renderer2, "svg", 20, 0);
      $$renderer2.push(`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2">`);
      push_element($$renderer2, "path", 34, 2);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`<circle cx="12" cy="7" r="4">`);
      push_element($$renderer2, "circle", 34, 61);
      $$renderer2.push(`</circle>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
    },
    User
  );
}
User.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Arrow_right[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components@file+..+greater-components+packages+greater-components_re_b4c086aa19ba9ae4cdaac7df975eaac6/node_modules/@equaltoai/greater-components/dist/icons/src/icons/arrow-right.svelte";
function Arrow_right($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        size = 24,
        color = "currentColor",
        strokeWidth = 2,
        class: className = "",
        $$slots,
        $$events,
        ...restProps
      } = $$props;
      $$renderer2.push(`<svg${attributes(
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: color,
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: `gr-icon gr-icon-arrow-right ${stringify(className)}`,
          "aria-hidden": "true",
          ...restProps
        },
        void 0,
        void 0,
        void 0,
        3
      )}>`);
      push_element($$renderer2, "svg", 20, 0);
      $$renderer2.push(`<line x1="5" y1="12" x2="19" y2="12">`);
      push_element($$renderer2, "line", 34, 2);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`<polyline points="12 5 19 12 12 19">`);
      push_element($$renderer2, "polyline", 34, 46);
      $$renderer2.push(`</polyline>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
    },
    Arrow_right
  );
}
Arrow_right.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Building[FILENAME] = "node_modules/.pnpm/@equaltoai+greater-components@file+..+greater-components+packages+greater-components_re_b4c086aa19ba9ae4cdaac7df975eaac6/node_modules/@equaltoai/greater-components/dist/icons/src/icons/building.svelte";
function Building($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        size = 24,
        color = "currentColor",
        strokeWidth = 2,
        class: className = "",
        $$slots,
        $$events,
        ...restProps
      } = $$props;
      $$renderer2.push(`<svg${attributes(
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: color,
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: `gr-icon gr-icon-building ${stringify(className)}`,
          "aria-hidden": "true",
          ...restProps
        },
        void 0,
        void 0,
        void 0,
        3
      )}>`);
      push_element($$renderer2, "svg", 20, 0);
      $$renderer2.push(`<rect x="3" y="7" width="7" height="15" rx="1">`);
      push_element($$renderer2, "rect", 34, 2);
      $$renderer2.push(`</rect>`);
      pop_element();
      $$renderer2.push(`<rect x="14" y="3" width="7" height="19" rx="1">`);
      push_element($$renderer2, "rect", 34, 50);
      $$renderer2.push(`</rect>`);
      pop_element();
      $$renderer2.push(`<line x1="6" y1="11" x2="6" y2="11.01">`);
      push_element($$renderer2, "line", 34, 99);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`<line x1="6" y1="15" x2="6" y2="15.01">`);
      push_element($$renderer2, "line", 34, 139);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`<line x1="17.5" y1="7" x2="17.5" y2="7.01">`);
      push_element($$renderer2, "line", 34, 179);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`<line x1="17.5" y1="11" x2="17.5" y2="11.01">`);
      push_element($$renderer2, "line", 34, 223);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`<line x1="17.5" y1="15" x2="17.5" y2="15.01">`);
      push_element($$renderer2, "line", 34, 269);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`<line x1="17.5" y1="19" x2="17.5" y2="19.01">`);
      push_element($$renderer2, "line", 34, 315);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
    },
    Building
  );
}
Building.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
const OAUTH_SCOPES = "read write follow push";
function getRedirectUri() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return "http://localhost:4321/auth/callback";
}
function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function generateCodeVerifier() {
  return generateRandomString(64);
}
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
async function registerApp(instance) {
  const instanceUrl = normalizeInstanceUrl(instance);
  const params = new URLSearchParams({
    client_name: "Greater",
    redirect_uris: getRedirectUri(),
    scopes: OAUTH_SCOPES,
    website: "https://greater.website"
  });
  const response = await fetch(`${instanceUrl}/api/v1/apps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register app: ${error}`);
  }
  const app = await response.json();
  await secureAuthClient.storeApp(instanceUrl, app);
  return app;
}
async function getOrCreateApp(instance) {
  const instanceUrl = normalizeInstanceUrl(instance);
  const currentRedirectUri = getRedirectUri();
  const storedKey = `app_${instanceUrl}_${currentRedirectUri}`;
  const stored = sessionStorage.getItem(storedKey);
  if (stored) {
    try {
      const app2 = JSON.parse(stored);
      logDebug("[OAuth] Using stored app for", instanceUrl);
      return app2;
    } catch (e) {
      console.error("[OAuth] Failed to parse stored app:", e);
      sessionStorage.removeItem(storedKey);
    }
  }
  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith(`app_${instanceUrl}_`) && key !== storedKey) {
      logDebug("[OAuth] Removing old app registration:", key);
      sessionStorage.removeItem(key);
    }
  });
  logDebug("[OAuth] Registering new app for", instanceUrl, "with redirect URI:", currentRedirectUri);
  const app = await registerApp(instance);
  sessionStorage.setItem(storedKey, JSON.stringify(app));
  return app;
}
async function buildAuthorizationUrl(params) {
  const instanceUrl = normalizeInstanceUrl(params.instance);
  const app = await getOrCreateApp(params.instance);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);
  sessionStorage.setItem(`oauth_state_${state}`, JSON.stringify({
    instance: instanceUrl,
    codeVerifier,
    timestamp: Date.now(),
    appId: app.client_id,
    appName: app.name
  }));
  const authParams = new URLSearchParams({
    client_id: app.client_id,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: params.scopes?.join(" ") || OAUTH_SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state
  });
  if (params.force) {
    authParams.append("force_login", "true");
  }
  return {
    url: `${instanceUrl}/oauth/authorize?${authParams.toString()}`,
    codeVerifier,
    state
  };
}
async function exchangeCodeForToken(params) {
  const instanceUrl = normalizeInstanceUrl(params.instance);
  const app = await getOrCreateApp(params.instance);
  const tokenParams = new URLSearchParams({
    client_id: app.client_id,
    client_secret: app.client_secret,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
    code: params.code,
    code_verifier: params.codeVerifier
  });
  const response = await fetch(`${instanceUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: tokenParams.toString()
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }
  const token = await response.json();
  return token;
}
async function revokeToken(instance, token) {
  const instanceUrl = normalizeInstanceUrl(instance);
  let app = null;
  const stored = sessionStorage.getItem(`app_${instanceUrl}`);
  if (stored) {
    app = JSON.parse(stored);
  }
  if (!app) {
    return;
  }
  const params = new URLSearchParams({
    client_id: app.client_id,
    client_secret: app.client_secret,
    token
  });
  const response = await fetch(`${instanceUrl}/oauth/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) ;
}
function normalizeInstanceUrl(instance) {
  let url = instance.trim().toLowerCase();
  url = url.replace(/^https?:\/\//, "");
  url = url.replace(/\/$/, "");
  return `https://${url}`;
}
async function validateInstance(instance) {
  try {
    const instanceUrl = normalizeInstanceUrl(instance);
    const response = await fetch(`${instanceUrl}/api/v1/instance`);
    return response.ok;
  } catch {
    return false;
  }
}
class AuthError extends Error {
  constructor(message, code, instance) {
    super(message);
    this.code = code;
    this.instance = instance;
    this.name = "AuthError";
  }
}
class AuthStore {
  currentUser = null;
  currentInstance = null;
  accounts = [];
  isAuthenticated = false;
  isLoading = false;
  error = null;
  _initialized = false;
  constructor() {
  }
  persist() {
    if (typeof window === "undefined") return;
    const toPersist = {
      state: {
        accounts: this.accounts.map((a) => ({
          id: a.id,
          instance: a.instance,
          user: a.user,
          lastUsed: a.lastUsed,
          token: {},
          app: {}
        })),
        currentUser: this.currentUser,
        currentInstance: this.currentInstance,
        isAuthenticated: this.isAuthenticated
      }
    };
    localStorage.setItem("auth-storage", JSON.stringify(toPersist));
  }
  /**
   * Initialize the auth store - must be called from client-side code
   */
  initialize() {
    if (typeof window === "undefined" || this._initialized) return;
    this._initialized = true;
    const savedState = localStorage.getItem("auth-storage");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.state) {
          this.currentUser = parsed.state.currentUser;
          this.currentInstance = parsed.state.currentInstance;
          this.accounts = parsed.state.accounts || [];
          this.isAuthenticated = !!(parsed.state.currentUser && parsed.state.currentInstance);
          if (this.isAuthenticated && this.currentInstance) {
            this.refreshCurrentUser().catch((err) => {
              console.error("[Auth] Failed to refresh user on init:", err);
              this.isAuthenticated = false;
              this.currentUser = null;
              this.persist();
            });
          }
        }
      } catch (e) {
        console.error("[Auth] Failed to load auth state:", e);
        this.isAuthenticated = false;
        localStorage.removeItem("auth-storage");
      }
    } else {
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentInstance = null;
      this.accounts = [];
    }
  }
  async startLogin(instance) {
    this.isLoading = true;
    this.error = null;
    try {
      const isValid = await validateInstance(instance);
      if (!isValid) {
        throw new AuthError("Invalid instance URL", "INVALID_INSTANCE", instance);
      }
      const { url, state } = await buildAuthorizationUrl({ instance });
      this.isLoading = false;
      return { url, state };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      this.isLoading = false;
      this.error = message;
      throw error;
    }
  }
  async completeLogin(code, state) {
    this.isLoading = true;
    this.error = null;
    try {
      const stateData = sessionStorage.getItem(`oauth_state_${state}`);
      if (!stateData) {
        throw new AuthError("Invalid or expired state", "INVALID_STATE");
      }
      const { instance, codeVerifier } = JSON.parse(stateData);
      sessionStorage.removeItem(`oauth_state_${state}`);
      const token = await exchangeCodeForToken({ instance, code, codeVerifier });
      const user = await verifyCredentials(instance, token.access_token);
      let appData = null;
      let appKey = null;
      const keys = Object.keys(sessionStorage);
      for (const key of keys) {
        if (key.startsWith(`app_${instance}_`)) {
          appData = sessionStorage.getItem(key);
          appKey = key;
          break;
        }
      }
      if (!appData) {
        console.error("[Auth] No app data found for instance:", instance);
        console.error("[Auth] Available keys:", keys.filter((k) => k.startsWith("app_")));
      }
      let app = null;
      if (appData) {
        try {
          app = JSON.parse(appData);
          await secureAuthClient.storeApp(instance, app);
          if (appKey) {
            sessionStorage.removeItem(appKey);
          }
        } catch (e) {
          console.error("[Auth] Failed to parse app data:", e);
        }
      }
      await secureAuthClient.storeToken(instance, token);
      const account = {
        id: `${instance}:${user.id}`,
        instance,
        user,
        token: {},
        // Token is stored securely, not in memory
        app: {},
        // App data is stored securely, not in memory
        lastUsed: Date.now()
      };
      this.currentUser = user;
      this.currentInstance = instance;
      this.accounts = [...this.accounts.filter((a) => a.id !== account.id), account];
      this.isAuthenticated = true;
      this.isLoading = false;
      this.error = null;
      this.persist();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      this.isLoading = false;
      this.error = message;
      throw error;
    }
  }
  async logout() {
    if (!this.currentInstance || !this.currentUser) {
      return;
    }
    this.isLoading = true;
    const { cleanupNotifications } = await import("./notifications.js").then((n) => n.n);
    cleanupNotifications();
    try {
      const account = this.accounts.find((a) => a.instance === this.currentInstance && a.user.id === this.currentUser?.id);
      if (account) {
        const token = await secureAuthClient.getToken(account.instance);
        if (token) {
          await revokeToken(account.instance, token.access_token);
          await secureAuthClient.revokeToken(account.instance);
        }
        const remainingAccounts = this.accounts.filter((a) => a.id !== account.id);
        const nextAccount = remainingAccounts[0];
        this.currentUser = nextAccount?.user || null;
        this.currentInstance = nextAccount?.instance || null;
        this.accounts = remainingAccounts;
        this.isAuthenticated = !!nextAccount;
        this.isLoading = false;
        this.persist();
      }
    } catch (error) {
      this.currentUser = null;
      this.currentInstance = null;
      this.accounts = [];
      this.isAuthenticated = false;
      this.isLoading = false;
      this.persist();
    }
  }
  async switchAccount(accountId) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (account) {
      const token = await secureAuthClient.getToken(account.instance);
      if (!token) {
        await this.removeAccount(accountId);
        throw new AuthError("Session expired", "SESSION_EXPIRED");
      }
      account.lastUsed = Date.now();
      this.currentUser = account.user;
      this.currentInstance = account.instance;
      this.accounts = this.accounts.map((a) => a.id === accountId ? { ...a, lastUsed: Date.now() } : a);
    }
  }
  async removeAccount(accountId) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;
    try {
      const token = await secureAuthClient.getToken(account.instance);
      if (token) {
        await revokeToken(account.instance, token.access_token);
        await secureAuthClient.revokeToken(account.instance);
      }
    } catch (error) {
    }
    const remainingAccounts = this.accounts.filter((a) => a.id !== accountId);
    if (account.user.id === this.currentUser?.id) {
      const nextAccount = remainingAccounts[0];
      this.currentUser = nextAccount?.user || null;
      this.currentInstance = nextAccount?.instance || null;
      this.accounts = remainingAccounts;
      this.isAuthenticated = !!nextAccount;
    } else {
      this.accounts = remainingAccounts;
    }
  }
  async validateInstanceUrl(instance) {
    return validateInstance(instance);
  }
  setError(error) {
    this.error = error;
  }
  clearError() {
    this.error = null;
  }
  async restoreSession() {
    if (!this.currentInstance || !this.isAuthenticated) {
      return;
    }
    try {
      const hasSession = await secureAuthClient.hasValidSession();
      if (!hasSession) {
        this.currentUser = null;
        this.currentInstance = null;
        this.accounts = [];
        this.isAuthenticated = false;
      }
    } catch (error) {
    }
  }
  updateAccount(updatedAccount) {
    this.currentUser = updatedAccount;
    this.accounts = this.accounts.map((account) => {
      if (account.user.id === updatedAccount.id && account.instance === this.currentInstance) {
        return { ...account, user: updatedAccount };
      }
      return account;
    });
    this.persist();
  }
  async refreshCurrentUser() {
    if (!this.currentInstance || !this.isAuthenticated) {
      return;
    }
    try {
      const response = await fetch(`${this.currentInstance}/api/v1/accounts/verify_credentials`, {
        headers: { "Authorization": `Bearer ${await getAccessToken()}` }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const freshUserData = await response.json();
      logDebug("[Auth] Fresh user data from API:", freshUserData);
      logDebug("[Auth] Avatar URL from API:", freshUserData.avatar);
      const accountData = freshUserData.user || freshUserData;
      if (!accountData.acct && accountData.username) {
        accountData.acct = accountData.username;
      }
      logDebug("[Auth] Account data to use:", accountData);
      logDebug("[Auth] Account username:", accountData.username);
      logDebug("[Auth] Account acct:", accountData.acct);
      this.updateAccount(accountData);
      logDebug("[Auth] Current user after update:", this.currentUser);
      logDebug("[Auth] Avatar after update:", this.currentUser?.avatar);
    } catch (error) {
      console.error("[Auth] Failed to refresh current user:", error);
    }
  }
}
async function verifyCredentials(instance, token) {
  const response = await fetch(`${instance}/api/v1/accounts/verify_credentials`, { headers: { "Authorization": `Bearer ${token}` } });
  if (!response.ok) {
    throw new AuthError("Failed to verify credentials", "VERIFY_FAILED", instance);
  }
  const data = await response.json();
  const accountData = data.user || data;
  if (!accountData.acct && accountData.username) {
    accountData.acct = accountData.username;
  }
  return accountData;
}
const authStore = new AuthStore();
async function getAccessToken() {
  const { currentInstance } = authStore;
  if (!currentInstance) {
    return null;
  }
  try {
    const token = await secureAuthClient.getToken(currentInstance);
    return token?.access_token || null;
  } catch {
    return null;
  }
}
export {
  Arrow_right as A,
  Button as B,
  Globe as G,
  ThemeProvider as T,
  User as U,
  TextField as a,
  authStore as b,
  Building as c
};
