import { v as head } from "../../../../chunks/index2.js";
import "../../../../chunks/logger.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("3cfahf", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Completing Sign In - Greater</title>`);
      });
    });
    $$renderer2.push(`<div class="callback-page svelte-3cfahf"><div class="callback-container svelte-3cfahf">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="spinner svelte-3cfahf"></div> <h1 class="svelte-3cfahf">Completing sign in...</h1> <p class="svelte-3cfahf">Please wait while we finalize your authentication</p>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
