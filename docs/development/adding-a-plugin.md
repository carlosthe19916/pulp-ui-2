# Adding a plugin

A new Pulp plugin needs catalog data and, optionally, presentation. No new routes or nav
entries.

1. **Catalog entry.** Add `client/src/catalog/plugins/<plugin>.ts` exporting an
   `IPluginDefinition` (copy `file.ts`) and append it to `pluginDefinitions` in
   `client/src/catalog/index.ts`.
   - `app.isAvailable`: use `whenInstalled(<component>, <package>)`.
   - `rest`: the repository `pulp_type` and `<app>/<slug>` path, as in the OpenAPI spec.
   - `entities`: only the entity types the plugin implements. Start from the shared groups in
     `base-fields.ts` and add the plugin's fields. Field types are in `field-types.ts`.
   - `content`: every content type with its `apiPath`; add `uploadable` only if the API has an
     upload or create endpoint for it.
2. **Check the catalog test** (`catalog.test.ts`) still passes: `npm test`.
3. **Optional presentation**, each a UI registry keyed by `pulp_type`:
   - a content detail panel in `PluginContentPanel`;
   - Browse sections in `RepositoryContent/browseRegistry.ts`;
   - extra repository tabs in `repository-detail/components/pluginTabs.ts`.

   Without these, content renders with the generic panel and the repository shows only
   "All content".

4. **e2e**: extend the relevant spec in `e2e/tests/` if the local backend has the plugin.

Verify every endpoint, field and filter against `client/openapi/pulp.json` (see "API
endpoints" in [AGENTS.md](../../AGENTS.md)). Refresh the spec from a backend that has the
plugin installed, then `npm run generate`.
