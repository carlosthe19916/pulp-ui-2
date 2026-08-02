import eslintReact from "@eslint-react/eslint-plugin";
import eslintJs from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/dist", "**/coverage"]),
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      eslintJs.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
      ...pluginQuery.configs["flat/recommended-strict"],
      ...pluginRouter.configs["flat/recommended"],
      reactRefresh.configs.vite,
      prettierRecommended,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ["e2e/playwright.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
          disallowTypeAnnotations: true,
        },
      ],
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
    ignores: [
      "client/config/**",
      "client/src/app/client/**",
      "client/src/app/specs/**",
      "client/types/**",
    ],
  },
]);
