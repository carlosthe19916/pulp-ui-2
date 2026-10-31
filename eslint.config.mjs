// `.oxlintrc.json` is derived from this file: run `npm run oxlint:sync` after changing it.
import eslintReact from "@eslint-react/eslint-plugin";
import eslintJs from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// client/src style rules; .rulesync/rules/code-style.md covers what lint can't.
const PF_CLASS_MESSAGE =
  "Import the class from @patternfly/react-styles/css/... and combine with css().";
const clientRestrictedSyntax = [
  {
    selector: "TSEnumDeclaration",
    message: "Use a string-literal union or an `as const` object.",
  },
  {
    selector: "ExportDefaultDeclaration",
    message: "Use a named export.",
  },
  {
    selector: "FunctionDeclaration:not([typeParameters])",
    message: "Use an arrow const; `function` is only for generic helpers.",
  },
  {
    selector:
      "CallExpression[callee.name='memo'], CallExpression[callee.object.name='React'][callee.property.name='memo']",
    message: "Don't use React.memo.",
  },
];
const pfClassRestrictedSyntax = [
  {
    selector: "Literal[value=/\\bpf-(v6-c|m|u|l)-/]",
    message: PF_CLASS_MESSAGE,
  },
  {
    selector: "TemplateElement[value.raw=/\\bpf-(v6-c|m|u|l)-/]",
    message: PF_CLASS_MESSAGE,
  },
];
const iconBarrelImport = {
  name: "@patternfly/react-icons",
  message:
    "Import the icon from its deep path: @patternfly/react-icons/dist/esm/icons/<name>-icon.",
};

const pluginInternals = {
  group: ["@plugins/*", "@catalog/*"],
  message:
    "Reach plugins through the registries: @catalog (facts) and @plugins (UI), never a plugin's files.",
};

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
    ],
  },
  {
    files: ["client/src/**/*.ts", "client/src/**/*.tsx"],
    ignores: [
      "client/src/app/client/**",
      "client/src/routeTree.gen.ts",
      "client/src/vite-env.d.ts",
    ],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // Five blocks: react → packages → @patternfly → @app/@catalog/@plugin-sdk/@plugins → relative.
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000?react\\u0000?$", "^\\u0000?react-"],
            ["^\\u0000?@?\\w"],
            ["^\\u0000?@patternfly/"],
            ["^\\u0000?@(app|catalog|plugin-sdk|plugins)(/|$)"],
            ["^\\u0000?\\."],
          ],
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "no-console": ["error", { allow: ["error"] }],
      "no-restricted-imports": ["error", { paths: [iconBarrelImport] }],
      "no-restricted-syntax": [
        "error",
        ...clientRestrictedSyntax,
        ...pfClassRestrictedSyntax,
      ],
    },
  },
  {
    // Tests may assert on rendered PatternFly class names.
    files: ["client/src/**/*.test.ts", "client/src/**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": ["error", ...clientRestrictedSyntax],
    },
  },
  {
    // Hosts reach plugins only through the registries (ADR 0012).
    files: ["client/src/app/**", "client/src/routes/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [iconBarrelImport], patterns: [pluginInternals] },
      ],
    },
  },
  {
    // App-root modules are shared; pages depend on them, never the reverse.
    files: [
      "client/src/app/components/**",
      "client/src/app/hooks/**",
      "client/src/app/utils/**",
      "client/src/app/context/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [iconBarrelImport],
          patterns: [
            {
              group: ["@app/pages", "@app/pages/*", "**/pages/*"],
              message: "App-root modules never import from pages/.",
            },
            pluginInternals,
          ],
        },
      ],
    },
  },
  {
    // The SDK is what plugins build on; it never depends on the plugins or their registries.
    files: ["client/src/plugin-sdk/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [iconBarrelImport],
          patterns: [
            {
              group: ["@plugins", "@plugins/*", "@catalog"],
              message: "The plugin SDK never imports the plugins or their registries.",
            },
          ],
        },
      ],
    },
  },
  {
    // A definition is facts about Pulp: generated types and @plugin-sdk/definition only.
    files: [
      "client/src/plugin-sdk/definition/**",
      "client/src/plugins/*/definition.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@app/*",
                "!@app/client",
                "!@app/client/*",
                "react",
                "react-*",
                "@patternfly/*",
                "@plugin-sdk/ui",
                "@plugin-sdk/ui/*",
                "@plugins",
                "@plugins/*",
                "@catalog",
              ],
              message:
                "A plugin definition holds facts only: no UI, app modules or registries.",
            },
          ],
        },
      ],
    },
  },
  {
    // A plugin's UI uses the SDK and shared building blocks, never the hosts or registries.
    files: ["client/src/plugins/*/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [iconBarrelImport],
          patterns: [
            {
              group: [
                "@plugins",
                "@plugins/*",
                "@app/pages/*",
                "@app/layout/*",
                "@app/components/PluginContentPanel",
                "@app/components/RepositoryContent",
              ],
              message:
                "A plugin's UI never imports the UI registry, the hosts or another plugin.",
            },
          ],
        },
      ],
    },
  },
]);
