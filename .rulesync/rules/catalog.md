---
name: catalog
description: "Apply when adding plugin-specific behaviour or editing client/src/catalog: plugin differences are catalog data rendered through pulp_type registries, so pages stay generic and never branch on pulp_type."
root: false
targets: ["claudecode", "cursor"]
globs:
  [
    "client/src/catalog/**",
    "client/src/app/pages/**",
    "client/src/app/components/**",
  ]
---

# Catalog and per-plugin UI

The catalog (`client/src/catalog`, `@catalog`) is the data every screen needs about Pulp's
plugins: each plugin is one `plugins/<plugin>.ts` definition (its `pulp_type`s, endpoint paths,
capabilities and actions), and generic pages read it. Repository, remote, distribution and
publication create/edit forms are UI, not data: each plugin's form lives in `@app/forms`
([forms](forms.md), ADR 0009).

## Data only

- Only `.ts` files; no React, JSX, icons, columns, CSS or layout.
- The only `@app` import is `import type { … } from "@app/client"` (generated types).
- Allowed: endpoint paths, `pulp_type`s, capability flags (`contentChanges`, `archiveImport`,
  `compatibleRemoteTypes`, …), action definitions (`actions`: key, label, path, target,
  description) and the upload mechanism.
- Not allowed: form definitions of any kind — entity create/edit forms, action fields, upload
  fields. They are UI and live in `@app/forms` (`forms/<entities>/`, `forms/actions/` keyed
  by repository type and action key, `forms/uploads/` keyed by content type).
- A new plugin is a `plugins/<plugin>.ts` file plus an entry in `pluginDefinitions`, and a form
  per entity in `@app/forms`; no new routes or nav items.

## Per-type presentation

- Lives in UI registries keyed by `pulp_type`: `PANEL_BY_TYPE` (content detail panels),
  `BROWSE_BY_REPOSITORY_TYPE` (repository Browse sections), `TAB_BY_REPOSITORY_TYPE` (extra
  repository tabs), and the create/edit form registries in `@app/forms` (`REMOTE_FORMS`, …),
  which alone have no generic fallback: a type without a form can't be created or edited.
- Each registry has a generic fallback (`BaseContent` — the All-content view, no extra tabs),
  so a lookup never branches on the plugin:

```tsx
const PANEL_BY_TYPE: Record<string, React.FC<IPluginContentProps>> = {
  "foo.widget": FooWidgetContent,
};

const Panel = PANEL_BY_TYPE[pulpType] ?? BaseContent;
return <Panel href={href} />;
```

## Generic pages

- Pages decide what to offer from catalog data (`getPlugin(pulpType)?.entities.repository?.…`,
  `getAvailablePlugins`, `getContentType`) or a registry lookup — not from `pulp_type`
  string comparisons or plugin `if`/`switch` chains.
- Plugin actions render through the shared `RepositoryActionModal` (`TaskActionModal`) from
  `entities.repository.actions`, with the fields `getActionFields` returns; no per-action modal.
- Create/edit offer only installed plugins that have a form (`useCreatableTypes`,
  `getEntityForm` from `@app/forms`).

## Checklist

Pass/fail rubric for `/eval`.

- [ ] `client/src/catalog/**` holds no `.tsx`, no React import, no presentation config and no
      entity create/edit form definitions; its only `@app` import is `import type` from
      `@app/client`.
- [ ] New per-type presentation is added to a `pulp_type`-keyed registry, with the generic
      fallback intact — not to the catalog.
- [ ] Changed pages/components read plugin capabilities from the catalog or a registry; no new
      `pulpType === "<plugin>.<type>"` comparisons or plugin `switch` chains.
- [ ] New plugin actions are catalog `actions` (no fields) rendered by the shared action modal,
      with their fields in `forms/actions/`; new uploadable types get their fields in
      `forms/uploads/`; no new per-action modal.
- [ ] Create/edit flows list only installed plugins with a registered form.
