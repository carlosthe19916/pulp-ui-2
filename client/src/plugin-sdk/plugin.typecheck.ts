/**
 * Compile-time checks of `definePlugin` and `definePluginUi` (run by `tsc`, never executed):
 * each `@ts-expect-error` marks a plugin that must not compile.
 */
import { definePlugin } from "./definition";
import { definePluginUi, GENERIC, type ITypeUi, type PluginUi } from "./ui";

const form = {} as ITypeUi["form"];

const widget = definePlugin({
  id: "widget",
  packages: ["widget"],
  remote: { "widget.widget": { apiPath: "file/file" } },
  repository: {
    "widget.widget": {
      apiPath: "file/file",
      compatibleRemoteTypes: ["widget.widget"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      actions: { prune: { path: "prune/", target: "repository" } },
    },
  },
  content: {
    "widget.unit": { apiPath: "file/files", upload: "upload" },
    "widget.part": { apiPath: "rpm/packages" },
  },
});

const ui = {
  label: "Widget",
  remote: { "widget.widget": { form } },
  repository: {
    "widget.widget": {
      form,
      browse: GENERIC,
      tab: null,
      actions: { prune: { label: "Prune", fields: [] } },
    },
  },
  content: {
    "widget.unit": {
      panel: GENERIC,
      search: { param: "relative_path__contains", label: "path" },
      upload: [],
    },
    "widget.part": { panel: GENERIC, search: null },
  },
} satisfies PluginUi<typeof widget>;

// Complete: every declared type has its pieces.
export const complete = definePluginUi({ definition: widget, ui });

// An apiPath the API doesn't have.
definePlugin({
  id: "typo",
  packages: [],
  // @ts-expect-error "file/fiel" isn't a remote collection.
  remote: { "typo.typo": { apiPath: "file/fiel" } },
});

// A repository syncing from another plugin's remote type.
definePlugin({
  id: "foreign",
  packages: [],
  remote: { "foreign.foreign": { apiPath: "file/file" } },
  repository: {
    "foreign.foreign": {
      apiPath: "file/file",
      // @ts-expect-error "rpm.rpm" isn't one of this plugin's remote types.
      compatibleRemoteTypes: ["rpm.rpm"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
    },
  },
});

// A declared type without its UI.
definePluginUi({
  definition: widget,
  ui: {
    ...ui,
    // @ts-expect-error "widget.widget" has no remote UI.
    remote: {},
  },
});

// A declared action without its label and fields.
definePluginUi({
  definition: widget,
  ui: {
    ...ui,
    repository: {
      "widget.widget": {
        ...ui.repository["widget.widget"],
        // @ts-expect-error the "prune" action has no UI.
        actions: {},
      },
    },
  },
});

// An uploadable type without its upload fields; a read-only one with them.
definePluginUi({
  definition: widget,
  ui: {
    ...ui,
    content: {
      // @ts-expect-error "widget.unit" is uploadable, so it needs `upload`.
      "widget.unit": { panel: GENERIC, search: null },
      // @ts-expect-error "widget.part" is read-only, so it can't have `upload`.
      "widget.part": { panel: GENERIC, search: null, upload: [] },
    },
  },
});

// A search on a param the list endpoint doesn't have.
definePluginUi({
  definition: widget,
  ui: {
    ...ui,
    content: {
      ...ui.content,
      "widget.part": {
        panel: GENERIC,
        // @ts-expect-error rpm/packages has no `relative_path__contains` filter.
        search: { param: "relative_path__contains", label: "path" },
      },
    },
  },
});

// GENERIC only where a generic view exists: a tab has none.
definePluginUi({
  definition: widget,
  ui: {
    ...ui,
    repository: {
      "widget.widget": {
        ...ui.repository["widget.widget"],
        // @ts-expect-error a repository tab is a component or null.
        tab: GENERIC,
      },
    },
  },
});

const Modal = () => null;

// A remote type with another way to be created, and a repository that imports archives.
const importer = definePlugin({
  id: "importer",
  packages: [],
  remote: {
    "importer.importer": {
      apiPath: "file/file",
      createFrom: { config: { path: "from_config/" } },
    },
  },
  repository: {
    "importer.importer": {
      apiPath: "file/file",
      compatibleRemoteTypes: ["importer.importer"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: true,
    },
  },
});

const importerUi = {
  label: "Importer",
  remote: {
    "importer.importer": {
      form,
      createFrom: { config: { label: "From config", Modal } },
    },
  },
  repository: {
    "importer.importer": {
      form,
      browse: GENERIC,
      tab: null,
      archiveImport: { label: "Import archive", Modal },
    },
  },
} satisfies PluginUi<typeof importer>;

export const completeImporter = definePluginUi({
  definition: importer,
  ui: importerUi,
});

// A declared create-from endpoint or archive import without its UI.
definePluginUi({
  definition: importer,
  ui: {
    ...importerUi,
    // @ts-expect-error "config" has no create-from UI.
    remote: { "importer.importer": { form } },
  },
});
definePluginUi({
  definition: importer,
  ui: {
    ...importerUi,
    repository: {
      // @ts-expect-error an archive-importing repository needs its import UI.
      "importer.importer": { form, browse: GENERIC, tab: null },
    },
  },
});

// Create-from or archive-import UI the definition doesn't declare.
definePluginUi({
  definition: widget,
  ui: {
    ...ui,
    remote: {
      "widget.widget": {
        form,
        // @ts-expect-error "widget.widget" declares no create-from endpoint.
        createFrom: { config: { label: "From config", Modal } },
      },
    },
  },
});
definePluginUi({
  definition: widget,
  ui: {
    ...ui,
    repository: {
      "widget.widget": {
        ...ui.repository["widget.widget"],
        // @ts-expect-error "widget.widget" doesn't import archives.
        archiveImport: { label: "Import archive", Modal },
      },
    },
  },
});
