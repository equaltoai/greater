import { N as head, F as FILENAME } from "../../../../chunks/index.js";
import "../../../../chunks/logger.js";
import "../../../../chunks/client.js";
import { p as push_element, a as pop_element } from "../../../../chunks/dev.js";
_page[FILENAME] = "src/routes/auth/callback/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      head("3cfahf", $$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>Completing Sign In - Greater</title>`);
        });
      });
      $$renderer2.push(`<div class="callback-page svelte-3cfahf">`);
      push_element($$renderer2, "div", 43, 0);
      $$renderer2.push(`<div class="callback-container svelte-3cfahf">`);
      push_element($$renderer2, "div", 44, 2);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="spinner svelte-3cfahf">`);
        push_element($$renderer2, "div", 46, 6);
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <h1 class="svelte-3cfahf">`);
        push_element($$renderer2, "h1", 47, 6);
        $$renderer2.push(`Completing sign in...</h1>`);
        pop_element();
        $$renderer2.push(` <p class="svelte-3cfahf">`);
        push_element($$renderer2, "p", 48, 6);
        $$renderer2.push(`Please wait while we finalize your authentication</p>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
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
