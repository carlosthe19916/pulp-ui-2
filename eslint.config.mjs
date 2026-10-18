import eslintReact from "@eslint-react/eslint-plugin";
import eslintJs from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
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
      jsxA11y.flatConfigs.recommended,
      prettierRecommended,
    ],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
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
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
          prefix: ["I"],
          filter: {
            regex: "^(Register|Window|Global|ProcessEnv)$",
            match: false,
          },
        },
      ],
      // Hook correctness (eslint-plugin-react-hooks) — not covered by the
      // presets above. Only the two classic rules; not v7's broad
      // React-Compiler ruleset.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // React 19 + composition standards. The first three are "warn" in the
      // @eslint-react preset; promote to "error" for explicit intent. The last
      // three aren't enabled by the preset at all.
      "@eslint-react/no-use-context": "error",
      "@eslint-react/no-forward-ref": "error",
      "@eslint-react/no-context-provider": "error",
      "@eslint-react/no-unstable-default-props": "error",
      "@eslint-react/no-unstable-context-value": "error",
      "@eslint-react/no-leaked-conditional-rendering": "error",
    },
    ignores: [
      "client/config/**",
      "client/src/app/client/**",
      "client/src/app/specs/**",
      "client/types/**",
      "client/src/vite-env.d.ts",
      "client/src/routeTree.gen.ts",
      "client/test-setup.ts",
    ],
  },
]);
