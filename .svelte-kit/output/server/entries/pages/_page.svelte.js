import { F as FILENAME } from "../../chunks/index.js";
import { p as prevent_snippet_stringification } from "../../chunks/validate.js";
import { p as push_element, a as pop_element } from "../../chunks/dev.js";
import { T as TimelineLayout, C as ComposeBoxGC, a as Timeline } from "../../chunks/ComposeBoxGC.js";
_page[FILENAME] = "src/routes/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      TimelineLayout($$renderer2, {
        title: "Home",
        activeTab: "home",
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<div class="home-page svelte-1uha8ag">`);
          push_element($$renderer3, "div", 9, 2);
          $$renderer3.push(`<div class="compose-section svelte-1uha8ag">`);
          push_element($$renderer3, "div", 10, 4);
          ComposeBoxGC($$renderer3, {});
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="timeline-section svelte-1uha8ag">`);
          push_element($$renderer3, "div", 13, 4);
          Timeline($$renderer3, {});
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
        })
      });
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
