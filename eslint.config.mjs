import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Migration / scratch areas:
    "api-to-convert/**",
    "pages-to-convert/**",
    "nextjs-app/**",
    // Large content-addressed folders that aren't source:
    "[0-9a-f][0-9a-f]/**",
  ]),
  {
    rules: {
      // The repo currently contains a lot of WIP/migration code; keep lint useful
      // without blocking builds on `any` usage.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
]);

export default eslintConfig;
