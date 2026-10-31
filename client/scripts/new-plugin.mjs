/**
 * Scaffold a plugin module: `npm run plugin:new -- <id>` (the Pulp app label, e.g. `widget`).
 * Writes `src/plugins/<id>/definition.ts` and `ui/index.ts`, and registers both in
 * `plugins/catalog.ts` and `plugins/registry.ts`. The result compiles; from there, each type
 * added to the definition makes `tsc` ask for its UI.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plugins = join(root, "src/plugins");

const id = process.argv[2];
if (!id || !/^[a-z][a-z0-9_]*$/.test(id)) {
  console.error("Usage: npm run plugin:new -- <id>  (lowercase app label, e.g. widget)");
  process.exit(1);
}
const folder = join(plugins, id);
if (existsSync(folder)) {
  console.error(`plugins/${id} already exists.`);
  process.exit(1);
}

const variable = id.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const label = id
  .split("_")
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join(" ");

mkdirSync(join(folder, "ui"), { recursive: true });
writeFileSync(
  join(folder, "definition.ts"),
  `import { definePlugin } from "@plugin-sdk/definition";

/** ${label}: TODO one line on what the plugin manages. */
export const ${variable} = definePlugin({
  id: "${id}",
  // Component or package names in /status/ versions that mean it is installed.
  packages: ["${id}", "pulp-${id.replace(/_/g, "-")}"],
  // Add its types per entity, keyed by pulp_type, e.g.
  // remote: { "${id}.${id}": { apiPath: "${id}/${id}" } },
  // Each type you add makes tsc ask for its UI in ui/index.ts.
});
`,
);
writeFileSync(
  join(folder, "ui/index.ts"),
  `import { definePluginUi } from "@plugin-sdk/ui";

import { ${variable} } from "../definition";

export const ${variable}Ui = definePluginUi({
  definition: ${variable},
  ui: {
    label: "${label}",
  },
});
`,
);

/** Insert `importLine` after the last import matching `importAfter`, and `entry` as the last line of `block`. */
const register = ({ file, importLine, importAfter, entry, block }) => {
  const path = join(plugins, file);
  let source = readFileSync(path, "utf8");
  const imports = [...source.matchAll(importAfter)];
  const last = imports.at(-1);
  if (!last) throw new Error(`${file}: no import to follow`);
  const at = last.index + last[0].length;
  source = `${source.slice(0, at)}\n${importLine}${source.slice(at)}`;
  const start = source.indexOf(block.open);
  const end = source.indexOf(block.close, start);
  if (start < 0 || end < 0) throw new Error(`${file}: registry block not found`);
  // The entry goes on its own line, after the block's last one.
  const line = block.close.startsWith("\n") ? `\n  ${entry},` : `  ${entry},\n`;
  source = `${source.slice(0, end)}${line}${source.slice(end)}`;
  writeFileSync(path, source);
};

register({
  file: "catalog.ts",
  importLine: `import { ${variable} } from "./${id}/definition";`,
  importAfter: /^import \{ \w+ \} from "\.\/[\w-]+\/definition";$/gm,
  entry: variable,
  block: { open: "export const PLUGIN_DEFINITIONS = [", close: "] as const;" },
});
register({
  file: "registry.ts",
  importLine: `import { ${variable}Ui } from "./${id}/ui";`,
  importAfter: /^import \{ \w+ \} from "\.\/[\w-]+\/ui";$/gm,
  entry: `${id}: ${variable}Ui`,
  block: {
    open: "const PLUGIN_UI: { [I in PluginId]: IPluginModule<I> } = {",
    close: "\n};",
  },
});

console.log(`Created plugins/${id} and registered it. Next: add its types to definition.ts,
then run \`npx tsc --noEmit -p client/tsconfig.app.json\` from the repository root and fill in
what it asks for (see the add-plugin skill). Run \`npm run lint:fix\` to sort the new imports.`);
