---
paths:
  - client/src/catalog/**
  - client/src/app/pages/**
  - client/src/app/components/**
---

# Catalog and per-plugin UI

The catalog (`client/src/catalog`, `@catalog`) is the single place plugin differences are
declared: each plugin is one `plugins/<plugin>.ts` definition (its `pulp_type`s, endpoint paths,
entity form fields, capabilities and actions), and generic pages read it.

## Data only

- Only `.ts` files; no React, JSX, icons, columns, CSS or layout.
- The only `@app` import is `import type { … } from "@app/client"` (generated types).
- Allowed: endpoint paths, `pulp_type`s, form field definitions (labels and help text are
  field metadata), capability flags (`contentChanges`, `archiveImport`,
  `compatibleRemoteTypes`, …), action definitions (`actions`), upload mechanism and fields.
- A new plugin is a `plugins/<plugin>.ts` file plus an entry in `pluginDefinitions`; no new
  routes or nav items.

## Per-type presentation

- Lives in UI registries keyed by `pulp_type`: `PANEL_BY_TYPE` (content detail panels),
  `BROWSE_BY_REPOSITORY_TYPE` (repository Browse sections), `TAB_BY_REPOSITORY_TYPE` (extra
  repository tabs).
- Each registry has a generic fallback (`BaseContent`, All content only, no extra tabs), so a
  lookup never branches on the plugin:

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
  `entities.repository.actions`; no per-action modal.
- Create/edit offer only installed plugins (`getAvailablePlugins` / `useCreatablePlugins`).

## Checklist

Pass/fail rubric for `/eval`.

- [ ] `client/src/catalog/**` holds no `.tsx`, no React import, and no presentation config;
      its only `@app` import is `import type` from `@app/client`.
- [ ] New per-type presentation is added to a `pulp_type`-keyed registry, with the generic
      fallback intact — not to the catalog.
- [ ] Changed pages/components read plugin capabilities from the catalog or a registry; no new
      `pulpType === "<plugin>.<type>"` comparisons or plugin `switch` chains.
- [ ] New plugin actions are catalog `actions` rendered by the shared action modal; no new
      per-action modal.
- [ ] Create/edit flows list only installed plugins.
