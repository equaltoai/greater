import { T as TimelineLayout, C as ComposeBoxGC, a as Timeline } from "../../../chunks/ComposeBoxGC.js";
function _page($$renderer) {
  TimelineLayout($$renderer, {
    title: "Federated Timeline",
    activeTab: "federated",
    children: ($$renderer2) => {
      $$renderer2.push(`<div class="home-page svelte-na0cmz"><div class="compose-section svelte-na0cmz">`);
      ComposeBoxGC($$renderer2, {});
      $$renderer2.push(`<!----></div> <div class="timeline-section svelte-na0cmz">`);
      Timeline($$renderer2, { type: "federated" });
      $$renderer2.push(`<!----></div></div>`);
    }
  });
}
export {
  _page as default
};
