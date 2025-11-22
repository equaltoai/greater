import { T as TimelineLayout, C as ComposeBoxGC, a as Timeline } from "../../../chunks/ComposeBoxGC.js";
function _page($$renderer) {
  TimelineLayout($$renderer, {
    title: "Local Timeline",
    activeTab: "local",
    children: ($$renderer2) => {
      $$renderer2.push(`<div class="home-page svelte-1a8ex5g"><div class="compose-section svelte-1a8ex5g">`);
      ComposeBoxGC($$renderer2, {});
      $$renderer2.push(`<!----></div> <div class="timeline-section svelte-1a8ex5g">`);
      Timeline($$renderer2, { type: "local" });
      $$renderer2.push(`<!----></div></div>`);
    }
  });
}
export {
  _page as default
};
