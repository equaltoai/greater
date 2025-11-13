

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "csr": true
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.zo5G-ZA4.js","_app/immutable/chunks/LQvIjRXQ.js","_app/immutable/chunks/DIpZa-rG.js","_app/immutable/chunks/DSqW2YpI.js","_app/immutable/chunks/sirv-2-2.js","_app/immutable/chunks/DLudcOmY.js","_app/immutable/chunks/rm3Wd_Ll.js"];
export const stylesheets = ["_app/immutable/assets/building.Brk73kRE.css","_app/immutable/assets/0.DCtF2Obr.css"];
export const fonts = [];
