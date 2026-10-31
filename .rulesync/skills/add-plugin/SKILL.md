---
name: add-plugin
description: Use when adding support for a new Pulp plugin, or a new type (remote, repository, distribution, publication, content) to an existing one — the plugin folder in client/src/plugins with its definition and UI, and the two registry entries. Lets the compiler list what's missing.
targets: ["*"]
---

# Add a plugin

Constraints: `.rulesync/rules/plugins.md` (definition vs UI, opt-outs, boundaries) and
`.rulesync/rules/forms.md` (form pages). Read them first; `client/src/plugins/file/` is the
smallest complete example. The snippets use a made-up `widget` plugin.

## 1. Find the API facts

Read the plugin's collections in `client/openapi/pulp.json` (`/api/pulp/{pulp_domain}/api/v3/
<remotes|repositories|distributions|publications|content>/<app>/<slug>/`), or its keys in
`client/src/app/client/pulpTypes.gen.ts` after `npm run generate`. Note each type's
`pulp_type`, its repository's `REMOTE_TYPES`, how content is changed, and its actions.

## 2. Write the definition

```ts
// client/src/plugins/widget/definition.ts
import { definePlugin } from "@plugin-sdk/definition";

export const widget = definePlugin({
  id: "widget",
  packages: ["widget", "pulp-widget"],
  remote: { "widget.widget": { apiPath: "widget/widget" } },
  repository: {
    "widget.widget": {
      apiPath: "widget/widget",
      compatibleRemoteTypes: ["widget.widget"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      actions: { prune: { path: "prune/", target: "repository" } },
    },
  },
  distribution: { "widget.widget": { apiPath: "widget/widget" } },
  content: { "widget.unit": { apiPath: "widget/units", upload: "upload" } },
});
```

Add it to `PLUGIN_DEFINITIONS` in `client/src/plugins/catalog.ts`.

## 3. Let the compiler list the UI

Add `widget: widgetUi` to `PLUGIN_UI` in `client/src/plugins/registry.ts`, then write
`client/src/plugins/widget/ui/index.ts` and run `npx tsc --noEmit -p client/tsconfig.app.json`
until it is quiet. Each error names a missing piece.

```ts
export const widgetUi = definePluginUi({
  definition: widget,
  ui: {
    label: "Widget",
    remote: { "widget.widget": { form: widgetRemoteForm } },
    repository: {
      "widget.widget": {
        form: widgetRepositoryForm,
        browse: GENERIC, // or sections whose views are lazyViews(() => import(...))
        tab: null,
        actions: { prune: { label: "Prune", fields: [] } },
      },
    },
    distribution: {
      "widget.widget": { form: widgetDistributionForm, clientSetup: GENERIC },
    },
    content: {
      "widget.unit": { panel: GENERIC, search: null, upload: [] },
    },
  },
});
```

## 4. Write the forms

One file per type in `ui/forms/`, typed from the definition and built from
`@app/forms/fragments`:

```ts
export const widgetRemoteForm = remoteForm(widget.remote["widget.widget"])(
  ({ f, s }) => ({
    title: { create: "Create widget remote", edit: "Edit widget remote" },
    sections: [
      s.essentials([nameField(f), urlField(f)]),
      ...connectionSections({ f, s }),
    ],
  }),
);
```

`tsc` names every API field the form neither renders nor `omit`s.

## 5. Check

- `npm test` runs the conformance suite (`client/src/plugins/plugins.test.ts`) over the new
  plugin: forms per type, actions with labels, Browse types with list endpoints.
- Custom panels, Browse views and tabs go in `ui/content/`, `ui/browse/`, `ui/tabs/`, built from
  `@app/components/ContentPanelLayout` and `@app/components/BrowseShell`, registered with
  `lazyViews`.
- No page or component changes: hosts pick the plugin up from the registries.
