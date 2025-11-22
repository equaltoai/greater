import { T as TimelineLayout, C as ComposeBoxGC, a as Timeline } from "../../../chunks/ComposeBoxGC.js";
function _page($$renderer) {
  TimelineLayout($$renderer, {
    title: "Home",
    activeTab: "home",
    children: ($$renderer2) => {
      $$renderer2.push(`<div class="home-page svelte-1j6ictg"><div class="compose-section svelte-1j6ictg">`);
      ComposeBoxGC($$renderer2, {});
      $$renderer2.push(`<!----></div> <div class="timeline-section svelte-1j6ictg">`);
      Timeline($$renderer2, {});
      $$renderer2.push(`<!----></div></div>`);
    }
  });
}
export {
  _page as default
};
