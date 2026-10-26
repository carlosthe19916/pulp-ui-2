---
name: add-plugin
description: >-
  Use when adding support for a new Pulp plugin (or a new content type or entity
  of an existing one) to the UI — the catalog entry, optional per-type
  presentation in the pulp_type registries, tests and spec refresh. No new
  routes or nav entries.
---

# Add a plugin

A new Pulp plugin needs catalog data and, optionally, presentation. No new routes or nav
entries. The constraints are in `.rulesync/rules/catalog.md` (data only; per-type UI in
registries). The snippets use a made-up `foo` plugin.

## 1. Spec

Refresh `client/openapi/pulp.json` from a backend that has the plugin installed, then
`npm run generate`. Verify every endpoint, field and filter against it (the `pulp-api`
skill): the `pulp_type`s, the `<app>/<slug>` paths, which content types have an upload or
create endpoint.

## 2. Catalog entry

Add `client/src/catalog/plugins/foo.ts` and append `foo` to `pluginDefinitions` in the catalog
index. Declare only the entity types the plugin implements; start each form from the shared
base field groups and add the plugin's own fields.

```ts
import { remoteBase, repositoryBase } from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition } from "../types";

const fooRemoteExtras: IEntityField[] = [
  { key: "channel", label: "Channel", type: "text", group: "General" },
];

export const foo: IPluginDefinition = {
  // <installed app label>, <python package> as reported by the status endpoint
  app: { isAvailable: whenInstalled("foo", "pulp-foo") },
  // repository pulp_type and its `repositories/<apiPath>/` collection
  rest: { pulpType: "foo.foo", apiPath: "foo/foo" },
  entities: {
    repository: {
      form: {
        isWizard: false,
        createFields: [
          ...repositoryBase.create,
          {
            key: "remote",
            label: "Remote",
            type: "asyncResource",
            resourceKind: "remote",
          },
        ],
        editFields: [
          ...repositoryBase.edit,
          {
            key: "remote",
            label: "Remote",
            type: "asyncResource",
            resourceKind: "remote",
          },
        ],
      },
      compatibleRemoteTypes: ["foo.foo"], // [] when it can't sync
      compatiblePublicationTypes: [], // [] when it doesn't publish
      // `modify/` endpoint, `add/` + `remove/` endpoints, or null when neither exists
      contentChanges: "modify", // "modify" | "addRemove" | null
      archiveImport: false,
    },
    remote: {
      form: {
        isWizard: false,
        createFields: [...remoteBase.create, ...fooRemoteExtras],
        editFields: [...remoteBase.edit, ...fooRemoteExtras],
      },
    },
  },
  // every content type; `apiPath` is the content collection, which may differ from the
  // pulp_type. `uploadable` only when the API has an upload or create endpoint.
  content: [
    {
      pulpType: "foo.widget",
      apiPath: "foo/widgets",
      uploadable: {
        mechanism: "upload",
        fields: [
          {
            key: "relative_path",
            label: "Relative Path",
            type: "text",
            required: true,
          },
        ],
      },
    },
  ],
};
```

Field `type`s: `text`, `textarea`, `number`, `boolean`, `select`, `file`, `asyncResource`,
`stringList`, `json`, `content`.

## 3. Test

Run `npm test`; the catalog test checks every definition's shape.

## 4. Optional presentation

Each a UI registry keyed by `pulp_type`, with a generic fallback:

- a content detail panel in `PANEL_BY_TYPE`;
- Browse sections in `BROWSE_BY_REPOSITORY_TYPE`;
- an extra repository tab in `TAB_BY_REPOSITORY_TYPE`.

```ts
export const TAB_BY_REPOSITORY_TYPE: Record<string, IPluginTab> = {
  "foo.foo": { key: "channels", title: "Channels", Tab: FooChannelsTab },
};
```

Without these, content renders with the generic panel and the repository shows only
"All content".

## 5. e2e

Extend the relevant area spec in `e2e/tests/` if the local backend has the plugin.
