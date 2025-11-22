import { w as attributes, G as stringify } from "./index2.js";
function Globe($$renderer, $$props) {
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
      class: `gr-icon gr-icon-globe ${stringify(className)}`,
      "aria-hidden": "true",
      ...restProps
    },
    void 0,
    void 0,
    void 0,
    3
  )}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`);
}
export {
  Globe as G
};
