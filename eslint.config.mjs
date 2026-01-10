import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// `eslint-config-next` still publishes legacy (extends-based) configs.
// Use FlatCompat to consume them from ESLint flat config.
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
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
      // Legacy/external code not part of Next.js app:
      "App.tsx",
      "apps/**",
      "server/**",
      "script/**",
      "scripts/**",
      // Test files handled by their own tooling:
      "tests/**",
      "qa/**",
      // Config files:
      "drizzle.config.ts",
      "vite.config.ts",
      "playwright.config.ts",
    ],
  },
  {
    rules: {
      // The repo currently contains a lot of WIP/migration code; keep lint useful
      // without blocking builds on `any` usage.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow unescaped entities during migration - pre-existing in legacy pages
      "react/no-unescaped-entities": "warn",
      // Allow unused vars during migration (ignore underscore-prefixed args)
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      // Allow missing hook dependencies during migration
      "react-hooks/exhaustive-deps": "warn",
      // Allow prefer-const during migration
      "prefer-const": "warn",
    },
  },
];

export default config;
