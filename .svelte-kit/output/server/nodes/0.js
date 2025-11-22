

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "csr": true
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CcvOMERz.js","_app/immutable/chunks/Dk8Y7fR_.js","_app/immutable/chunks/Bpv4puWN.js","_app/immutable/chunks/DHI4pdy5.js","_app/immutable/chunks/_LYS6rzG.js","_app/immutable/chunks/C2zQ9FVj.js","_app/immutable/chunks/Ci0fFNKZ.js","_app/immutable/chunks/BEwztiVq.js"];
export const stylesheets = ["_app/immutable/assets/RealtimeWrapper.Dg2O3mWJ.css","_app/immutable/assets/0.DCtF2Obr.css"];
export const fonts = [];
