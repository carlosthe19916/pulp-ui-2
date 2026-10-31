# Plugins

How the UI models Pulp's plugins. The rules are in
[`.rulesync/rules/plugins.md`](../../.rulesync/rules/plugins.md); this page explains the moving
parts.

## Two layers per plugin

Each plugin is a folder, `client/src/plugins/<id>/`:

- `definition.ts` declares **facts** with `definePlugin`: which packages mean it is installed,
  its types per entity (keyed by `pulp_type`, each with its collection `apiPath`), repository
  capabilities (what it syncs from and publishes to, how content changes, actions; a version
  `scan/` action makes it scannable), its
  content types, its ACS endpoint and its content guard types. It imports no UI, so anything
  can read it.
- `ui/index.ts` declares the **presentation** with `definePluginUi({ definition, ui })`: labels,
  forms, content panels, Browse sections, the repository tab, client setup, action labels and
  fields, upload fields, content search, the plugin's own pages, a remote's create
  alternatives, the archive import, the ACS label and content guards' names, descriptions and
  fields. The plugin's pages, modals and queries live under `ui/` too.

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
  `getContentTypes`, `getScannableRepositoryTypes`, `resolvePulpTypeByApiPath`, … It also
  derives types: per-entity unions (`RemoteType`, `ContentType`, …) and `ContentTypeApiPaths`,
  from which `queries/contentTypes.ts` derives the typed content-list map.
- `@plugins` (`plugins/registry.ts`) walks every plugin's UI once, joined with its facts, and
  answers what hosts ask: `getEntityForm`, `getContentPanel`, `getRepositoryBrowse`,
  `getRepositoryTab`, `getRepositoryActions` (definition endpoint and UI merged),
  `getClientSetup`, `getContentSearch`, `getUploadFields`, `getCreateAlternatives`,
  `getArchiveImport`, `getAcsTypes`, `getContentGuardTypes`, `getPluginPage` and
  `getPluginPages`. The create pages' type picker comes from `useCreatableTypes` /
  `useCreateTypeSelect` (`@app/hooks`), built on these.
- List lookups take `{ installed }` (the `/status/` versions) and keep only the plugins that are
  installed; without it they return every plugin's entries.

## Boundaries

ESLint (`eslint.config.mjs`) enforces the dependency direction:

```
plugin-sdk  ◀──  plugins/<id>/definition.ts  ◀──  plugins/<id>/ui  ◀──  registries  ◀──  hosts
    ▲                                                  │                                   │
    └──────────────  app building blocks (forms kit, ContentPanelLayout, BrowseShell,  ◀───┘
                     queries, components)
```

- A definition imports only `@plugin-sdk/definition` and generated types, never another plugin.
- A plugin's UI builds on the SDK and the app's shared building blocks; it never imports
  `@plugins`, `@catalog`, a host or another plugin (relative escapes included). Its facts come
  from its own `definition.ts`.
- `plugins/catalog.ts` imports definitions only, never a plugin's UI, so `@catalog` stays pure.
- `plugin-sdk/**` never imports a plugin or a registry. Its UI contracts
  (`plugin-sdk/ui/contracts.ts`) own the types hosts and plugins share (`IContentPanelProps`,
  `IBrowseContext`, `IPluginBrowse`, `IServedAt`, …); the building blocks import them from
  `@plugin-sdk/ui`.
- Hosts (`app/**`, `routes/**`) never import a plugin's files, only the registries.
- A plugin's own page keeps its route file (file-based routing), which renders
  `pluginPage("<to>")`: the page the plugin registered, found through `@plugins`.

Panels, Browse views, tabs, pages and modals are loaded with `lazyViews` (one per module, its
names limited to the module's component exports), so registering every plugin doesn't put their
views in the main bundle; forms are small data and load with the registry.
