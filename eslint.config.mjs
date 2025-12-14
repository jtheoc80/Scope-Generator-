import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// `eslint-config-next` still publishes legacy (extends-based) configs.
// Use FlatCompat to consume them from ESLint flat config.
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Override default ignores of eslint-config-next.
    ignores: [
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
    ],
  },
  {
    rules: {
      // The repo currently contains a lot of WIP/migration code; keep lint useful
      // without blocking builds on `any` usage.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
