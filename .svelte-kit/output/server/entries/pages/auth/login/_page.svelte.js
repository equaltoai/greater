import { N as head, T as ensure_array_like, V as attr_class, X as stringify, Q as escape_html, F as FILENAME } from "../../../../chunks/index.js";
import { G as Globe, a as TextField, B as Button, A as Arrow_right, b as authStore } from "../../../../chunks/auth.svelte.js";
import "isomorphic-dompurify";
import { p as push_element, a as pop_element } from "../../../../chunks/dev.js";
import { p as prevent_snippet_stringification } from "../../../../chunks/validate.js";
_page[FILENAME] = "src/routes/auth/login/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
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
      $$renderer2.push(`<div class="login-page svelte-1i2smtp">`);
      push_element($$renderer2, "div", 47, 0);
      $$renderer2.push(`<div class="login-container svelte-1i2smtp">`);
      push_element($$renderer2, "div", 48, 2);
      $$renderer2.push(`<div class="header svelte-1i2smtp">`);
      push_element($$renderer2, "div", 49, 4);
      $$renderer2.push(`<h1 class="svelte-1i2smtp">`);
      push_element($$renderer2, "h1", 50, 6);
      $$renderer2.push(`Welcome to Greater</h1>`);
      pop_element();
      $$renderer2.push(` <p class="svelte-1i2smtp">`);
      push_element($$renderer2, "p", 51, 6);
      $$renderer2.push(`A modern client for the fediverse</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="server-selection svelte-1i2smtp">`);
      push_element($$renderer2, "div", 54, 4);
      $$renderer2.push(`<h2 class="svelte-1i2smtp">`);
      push_element($$renderer2, "h2", 55, 6);
      $$renderer2.push(`Select your server</h2>`);
      pop_element();
      $$renderer2.push(` <p class="subtitle svelte-1i2smtp">`);
      push_element($$renderer2, "p", 56, 6);
      $$renderer2.push(`Choose a Mastodon or ActivityPub compatible server to connect</p>`);
      pop_element();
      $$renderer2.push(` <div class="default-servers svelte-1i2smtp">`);
      push_element($$renderer2, "div", 59, 6);
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(defaultServers);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let server = each_array[$$index];
        $$renderer2.push(`<button${attr_class(`server-card ${stringify(instance === server.domain ? "selected" : "")}`, "svelte-1i2smtp")} type="button">`);
        push_element($$renderer2, "button", 61, 10);
        $$renderer2.push(`<div class="server-icon svelte-1i2smtp">`);
        push_element($$renderer2, "div", 66, 12);
        Globe($$renderer2, { size: 24 });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(` <div class="server-info svelte-1i2smtp">`);
        push_element($$renderer2, "div", 69, 12);
        $$renderer2.push(`<div class="server-name svelte-1i2smtp">`);
        push_element($$renderer2, "div", 70, 14);
        $$renderer2.push(`${escape_html(server.name)}</div>`);
        pop_element();
        $$renderer2.push(` <div class="server-domain svelte-1i2smtp">`);
        push_element($$renderer2, "div", 71, 14);
        $$renderer2.push(`${escape_html(server.domain)}</div>`);
        pop_element();
        $$renderer2.push(` <div class="server-description svelte-1i2smtp">`);
        push_element($$renderer2, "div", 72, 14);
        $$renderer2.push(`${escape_html(server.description)}</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</button>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` <div class="divider svelte-1i2smtp">`);
      push_element($$renderer2, "div", 78, 6);
      $$renderer2.push(`<span>`);
      push_element($$renderer2, "span", 79, 8);
      $$renderer2.push(`or enter a custom server</span>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="custom-server svelte-1i2smtp">`);
      push_element($$renderer2, "div", 83, 6);
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
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(` `);
      Button($$renderer2, {
        onclick: handleConnect,
        disabled: !instance.trim() || isValidating,
        loading: isValidating,
        variant: "solid",
        size: "lg",
        class: "connect-button",
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<span>`);
          push_element($$renderer3, "span", 103, 8);
          $$renderer3.push(`Continue to ${escape_html(instance || "server")}</span>`);
          pop_element();
          $$renderer3.push(` `);
          Arrow_right($$renderer3, { size: 20 });
          $$renderer3.push(`<!---->`);
        }),
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(` <div class="footer svelte-1i2smtp">`);
      push_element($$renderer2, "div", 108, 4);
      $$renderer2.push(`<p class="svelte-1i2smtp">`);
      push_element($$renderer2, "p", 109, 6);
      $$renderer2.push(`Don't have an account? <a href="https://joinmastodon.org/servers" target="_blank" rel="noopener noreferrer" class="svelte-1i2smtp">`);
      push_element($$renderer2, "a", 111, 8);
      $$renderer2.push(`Find a server to join</a>`);
      pop_element();
      $$renderer2.push(`</p>`);
      pop_element();
      $$renderer2.push(` <p class="about svelte-1i2smtp">`);
      push_element($$renderer2, "p", 115, 6);
      $$renderer2.push(`Greater is an open-source Mastodon client. <a href="https://github.com/aron23/greater" target="_blank" rel="noopener noreferrer" class="svelte-1i2smtp">`);
      push_element($$renderer2, "a", 117, 8);
      $$renderer2.push(`Learn more</a>`);
      pop_element();
      $$renderer2.push(`</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    _page
  );
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
