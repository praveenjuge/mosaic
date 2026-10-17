import js from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      ".wrangler/",
      ".agents/",
      "playwright-report/",
      "test-results/",
      "worker-configuration.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Codacy lints with eslint-plugin-xss, which reads the sitemap's XML as
    // HTML. A no-op stub lets the file's disable comment resolve locally.
    files: ["src/routes/sitemap*.ts"],
    plugins: { xss: { rules: { "no-mixed-html": { create: () => ({}) } } } },
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
);
