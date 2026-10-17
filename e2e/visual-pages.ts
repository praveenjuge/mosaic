// Signed-out pages with visual baselines (visual.spec.ts). global-setup.ts
// opens each one first so the dev server's compiles finish before the specs
// take screenshots in parallel.
export const visualPages = [
  { name: "home", path: "/" },
  { name: "help", path: "/help" },
  { name: "guide-nextjs", path: "/help/guides/nextjs" },
  { name: "legal", path: "/legal" },
  { name: "not-found", path: "/this-page-does-not-exist" },
];
