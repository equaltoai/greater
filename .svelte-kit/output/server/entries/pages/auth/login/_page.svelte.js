import { w as attributes, x as clsx, y as attr_class, z as attr, F as bind_props, G as stringify, v as head, J as ensure_array_like } from "../../../../chunks/index2.js";
import { a as authStore } from "../../../../chunks/auth.svelte.js";
import { e as escape_html } from "../../../../chunks/context.js";
import "isomorphic-dompurify";
import { G as Globe } from "../../../../chunks/globe.js";
function Button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
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
    if (prefix) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="gr-button__prefix">`);
      prefix($$renderer2);
      $$renderer2.push(`<!----></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (loading) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="gr-button__spinner" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <span${attr_class("gr-button__content", void 0, { "gr-button__content--loading": loading })}>`);
    if (children) {
      $$renderer2.push("<!--[-->");
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></span> `);
    if (suffix) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="gr-button__suffix">`);
      suffix($$renderer2);
      $$renderer2.push(`<!----></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></button>`);
  });
}
function TextField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
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
    if (label) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<label${attr("for", fieldId)}${attr_class("gr-textfield__label", void 0, { "gr-textfield__label--required": required })}>${escape_html(label)} `);
      if (required) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="gr-textfield__required" aria-hidden="true">*</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></label>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="gr-textfield__container">`);
    if (prefix) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="gr-textfield__prefix" aria-hidden="true">`);
      prefix($$renderer2);
      $$renderer2.push(`<!----></div>`);
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
    )}/> `);
    if (suffix) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="gr-textfield__suffix" aria-hidden="true">`);
      suffix($$renderer2);
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (helpText && !invalid) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr("id", helpTextId)} class="gr-textfield__help">${escape_html(helpText)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (errorMessage && invalid) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr("id", errorId)} class="gr-textfield__error" role="alert" aria-live="polite">${escape_html(errorMessage)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { value });
  });
}
function Arrow_right($$renderer, $$props) {
  let {
    size = 24,
    color = "currentColor",
    strokeWidth = 2,
    class: className = "",
    $$slots,
    $$events,
    ...restProps
  } = $$props;
  $$renderer.push(`<svg${attributes(
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
  )}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let instance = "dev.lesser.host";
    let isValidating = false;
    let error = null;
    const defaultServers = [
      {
        name: "Lesser (Development)",
        domain: "dev.lesser.host",
        description: "Default development server"
      },
      {
        name: "Mastodon Social",
        domain: "mastodon.social",
        description: "Official Mastodon instance"
      },
      {
        name: "Fosstodon",
        domain: "fosstodon.org",
        description: "Open source focused"
      }
    ];
    async function handleConnect() {
      if (!instance.trim()) {
        error = "Please enter a server address";
        return;
      }
      isValidating = true;
      error = null;
      try {
        const { url } = await authStore.startLogin(instance.trim());
        window.location.href = url;
      } catch (err) {
        error = err instanceof Error ? err.message : "Failed to connect to server";
        isValidating = false;
      }
    }
    head("1i2smtp", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Sign In - Greater</title>`);
      });
    });
    $$renderer2.push(`<div class="login-page svelte-1i2smtp"><div class="login-container svelte-1i2smtp"><div class="header svelte-1i2smtp"><h1 class="svelte-1i2smtp">Welcome to Greater</h1> <p class="svelte-1i2smtp">A modern client for the fediverse</p></div> <div class="server-selection svelte-1i2smtp"><h2 class="svelte-1i2smtp">Select your server</h2> <p class="subtitle svelte-1i2smtp">Choose a Mastodon or ActivityPub compatible server to connect</p> <div class="default-servers svelte-1i2smtp"><!--[-->`);
    const each_array = ensure_array_like(defaultServers);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let server = each_array[$$index];
      $$renderer2.push(`<button${attr_class(`server-card ${stringify(instance === server.domain ? "selected" : "")}`, "svelte-1i2smtp")} type="button"><div class="server-icon svelte-1i2smtp">`);
      Globe($$renderer2, { size: 24 });
      $$renderer2.push(`<!----></div> <div class="server-info svelte-1i2smtp"><div class="server-name svelte-1i2smtp">${escape_html(server.name)}</div> <div class="server-domain svelte-1i2smtp">${escape_html(server.domain)}</div> <div class="server-description svelte-1i2smtp">${escape_html(server.description)}</div></div></button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="divider svelte-1i2smtp"><span>or enter a custom server</span></div> <div class="custom-server svelte-1i2smtp">`);
    TextField($$renderer2, {
      value: instance,
      label: "Server address",
      placeholder: "mastodon.example.com",
      helperText: "Enter the domain of your Mastodon instance",
      error: error || void 0,
      oninput: (e) => {
        instance = e.currentTarget.value;
        error = null;
      }
    });
    $$renderer2.push(`<!----></div> `);
    Button($$renderer2, {
      onclick: handleConnect,
      disabled: !instance.trim() || isValidating,
      loading: isValidating,
      variant: "solid",
      size: "lg",
      class: "connect-button",
      children: ($$renderer3) => {
        $$renderer3.push(`<span>Continue to ${escape_html(instance || "server")}</span> `);
        Arrow_right($$renderer3, { size: 20 });
        $$renderer3.push(`<!---->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div> <div class="footer svelte-1i2smtp"><p class="svelte-1i2smtp">Don't have an account? <a href="https://joinmastodon.org/servers" target="_blank" rel="noopener noreferrer" class="svelte-1i2smtp">Find a server to join</a></p> <p class="about svelte-1i2smtp">Greater is an open-source Mastodon client. <a href="https://github.com/aron23/greater" target="_blank" rel="noopener noreferrer" class="svelte-1i2smtp">Learn more</a></p></div></div></div>`);
  });
}
export {
  _page as default
};
