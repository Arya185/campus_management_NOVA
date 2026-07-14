import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  // TypeScript base
  ...tseslint.configs.recommended,

  // Next.js plugin rules
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Downgrade to warning so existing `any` props don't fail the build
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow empty catch blocks (used as fallbacks throughout)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // Ignores
  {
    ignores: [".next/**", "node_modules/**", "public/**", "scripts/**"],
  },
];

export default eslintConfig;
