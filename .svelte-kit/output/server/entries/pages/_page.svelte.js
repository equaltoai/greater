import { T as TimelineLayout, C as ComposeBoxGC, a as Timeline } from "../../chunks/ComposeBoxGC.js";
function _page($$renderer) {
  TimelineLayout($$renderer, {
    title: "Home",
    activeTab: "home",
    children: ($$renderer2) => {
      $$renderer2.push(`<div class="home-page svelte-1uha8ag"><div class="compose-section svelte-1uha8ag">`);
      ComposeBoxGC($$renderer2, {});
      $$renderer2.push(`<!----></div> <div class="timeline-section svelte-1uha8ag">`);
      Timeline($$renderer2, { type: "home" });
      $$renderer2.push(`<!----></div></div>`);
    }
  });
}
export {
  _page as default
};
