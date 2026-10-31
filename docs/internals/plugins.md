# Plugins

How the UI models Pulp's plugins. The rules are in
[`.rulesync/rules/plugins.md`](../../.rulesync/rules/plugins.md); this page explains the moving
parts.

## Two layers per plugin

Each plugin is a folder, `client/src/plugins/<id>/`:

- `definition.ts` declares **facts** with `definePlugin`: which packages mean it is installed,
  its types per entity (keyed by `pulp_type`, each with its collection `apiPath`), repository
  capabilities (what it syncs from and publishes to, how content changes, scans, actions), its
  content types and its ACS endpoint. It imports no UI, so anything can read it.
- `ui/index.ts` declares the **presentation** with `definePluginUi({ definition, ui })`: labels,
  forms, content panels, Browse sections, the repository tab, client setup, action labels and
  fields, upload fields, content search, the plugin's own pages, a remote's create
  alternatives and the archive import. The plugin's pages, modals and queries live under
  `ui/` too.

The split is "would this change if the UI were redesigned?": facts don't, presentation does.

## How the compiler keeps a plugin complete

```
openapi/pulp.json ──npm run generate──▶ pulpTypes.gen.ts   (collection path → body/list types)
                                              │
definition.ts ── definePlugin<const D> ───────┤  apiPath ∈ generated paths; own types only
                                              ▼
ui/index.ts ──── PluginUi<D> ─────────────────▶ one entry per declared type, every piece required
```

- `pulpTypes.gen.ts` maps each collection's `<app>/<slug>` to its create and update body (and,
  for content, its list params and page). It is generated with the client.
- `definePlugin` is `<const D>`, so a definition's `pulp_type`s and `apiPath`s stay literal
  types. A mistyped `apiPath`, or a repository syncing from another plugin's remote type, fails
  to compile.
- `PluginUi<D>` maps each declared type to its required pieces. Opting out is a value
  (`GENERIC` for "the host's generic view", `null` for "none"), so nothing is left out silently.
  Conditional pieces follow the definition: `upload` only for uploadable content, `actions`
  exactly the declared keys, a `search.param` that the list endpoint accepts.
- Forms take their body type from the definition (`remoteForm(rpm.remote["rpm.uln"])`), so the
  form kit's coverage check ("every API field rendered or omitted") applies per type.
- `PLUGIN_UI` (`plugins/registry.ts`) is typed by the plugin ids of `PLUGIN_DEFINITIONS`: a new
  definition without its UI fails to compile.
- `plugin-sdk/plugin.typecheck.ts` holds the `@ts-expect-error` cases proving each check.

## Registries

- `@catalog` (`plugins/catalog.ts`) lists `PLUGIN_DEFINITIONS` and exposes the pure lookups
  built by `createCatalog`: `getPulpType`, `getAvailableTypes`, `getContentType`,
  `resolvePulpTypeByApiPath`, … It also derives types: per-entity unions (`RemoteType`,
  `ContentType`, …) and `ContentTypeApiPaths`, from which `queries/contentTypes.ts` derives the
  typed content-list map.
- `@plugins` (`plugins/registry.ts`) walks every plugin's UI once and answers what hosts ask:
  `getEntityForm`, `getContentPanel` (falling back to the generic panel), `getRepositoryBrowse`,
  `getRepositoryTab`, `getRepositoryActions` (definition endpoint and UI merged),
  `getClientSetup`, `getContentSearch`, `getUploadFields`, `getPluginPages`.

## Boundaries

ESLint (`eslint.config.mjs`) enforces the dependency direction:

```
plugin-sdk  ◀──  plugins/<id>/definition.ts  ◀──  plugins/<id>/ui  ◀──  registries  ◀──  hosts
                                                       │
                                     app building blocks (forms kit, ContentPanelLayout,
                                     BrowseShell, queries, components)
```

- A definition imports only `@plugin-sdk/definition` and generated types, never another plugin.
- A plugin's UI builds on the SDK and the app's shared building blocks; it never imports
  `@plugins`, a host or another plugin (relative escapes included).
- `plugin-sdk/**` never imports a plugin or a registry directly. Its UI contracts reuse the
  building blocks' types, so the SDK sits on top of the app's shared components.
- Hosts (`app/**`, `routes/**`) never import a plugin's files, only the registries.
- A plugin's own page keeps its route file (file-based routing), which renders
  `pluginPage("<to>")`: the page the plugin registered, found through `@plugins`.

Panels, Browse views, tabs, pages and modals are loaded with `lazyViews`, so registering every plugin doesn't put
their views in the main bundle; forms are small data and load with the registry.
