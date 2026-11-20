/**
 * Emit two files from the OpenAPI spec:
 * - `src/app/client/pulpTypes.gen.ts`: for each plugin collection (`<entity>/<app>/<slug>/`),
 *   the generated request and list types its operations use, keyed by the `<app>/<slug>`
 *   apiPath. Plugin definitions find their form body and list types there.
 * - `src/app/client/pulpEndpoints.gen.ts`: the endpoints relative to `api/v3/`, the plugin
 *   collections and the actions appended to an href, which `queries/utils/pulpApi.ts` types
 *   its URL builders against (and plugin definitions their `apiPath`).
 *
 * Paths are kept relative to `api/v3/`, the part that is the same whether or not the server
 * has DOMAIN_ENABLED; the domain segment is added at runtime. The spec must be dumped with
 * DOMAIN_ENABLED: only then are domain-scoped endpoints (`{pulp_domain}/api/v3/…`) told
 * apart from the ones outside any domain (`status/`, `livez/`, `docs/…`).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const spec = JSON.parse(
  readFileSync(join(root, "openapi/pulp.json"), "utf8"),
);

const V3_PREFIX = /^\/api\/pulp\/(\{pulp_domain\}\/)?api\/v3\//;
const PLUGIN_COLLECTION = /^([^/{}]+)\/([^/{}]+\/[^/{}]+)\/(.*)$/;
const HREF_PATH = /^\{\w+_href\}(.*)$/;
const METHODS = ["get", "post", "put", "patch", "delete"];

// How @hey-api/openapi-ts names an operation's types: PascalCase of the operationId.
const typeName = (operationId) =>
  operationId
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

/** `[method, operationId]` of each operation of a path item. */
const operationsOf = (item) =>
  METHODS.filter((method) => item[method]?.operationId).map((method) => [
    method,
    item[method].operationId,
  ]);

const listPrefix = (operationId) =>
  operationId?.endsWith("_list") ? operationId.slice(0, -"list".length) : undefined;

const byKey = ([a], [b]) => a.localeCompare(b);
const literal = (value) => JSON.stringify(value);
const union = (values) => [...values].sort().map(literal).join(" | ") || "never";
const importBlock = (names) =>
  `import type {\n${[...names].sort().map((name) => `  ${name},`).join("\n")}\n} from "./types.gen";`;

/** v3 endpoints, relative to `api/v3/`: inside a domain (endpoint -> path item) and outside. */
const collectEndpoints = () => {
  const scoped = new Map();
  const outside = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    const prefix = V3_PREFIX.exec(path);
    if (!prefix) continue;
    const endpoint = path.slice(prefix[0].length);
    if (prefix[1]) scoped.set(endpoint, item);
    else outside.push(endpoint);
  }
  if (scoped.size === 0) {
    throw new Error(
      "generate-pulp-types: openapi/pulp.json has no domain-scoped paths; dump it from a Pulp with DOMAIN_ENABLED.",
    );
  }
  return { scoped, outside };
};

/**
 * Plugin collections (`<collection>/<app>/<slug>/<action>`): collection -> apiPath ->
 * `{ actions, item }`, where `item` is the collection endpoint itself (action `""`).
 */
const collectCollections = (scoped) => {
  const collections = {};
  for (const [endpoint, item] of scoped) {
    const match = PLUGIN_COLLECTION.exec(endpoint);
    if (!match) continue;
    const [, collection, apiPath, action] = match;
    const entry = ((collections[collection] ??= {})[apiPath] ??= {
      actions: new Set(),
    });
    entry.actions.add(action);
    if (action === "") entry.item = item;
  }
  return collections;
};

/**
 * Href actions by resource kind. An operation on `{x_href}<action>` belongs to the list whose
 * operationId is the longest prefix of its own (`repositories_file_file_` for
 * `repositories_file_file_sync`). A kind is that list's top-level collection
 * (`repositories`), so its actions are the union over all its plugin types. Lists under an
 * href name a nested kind (`{repository_href}versions/` -> `repositories/versions`) for the
 * actions on their items (`repair/` on a version).
 */
const collectHrefActions = (scoped) => {
  const hrefPaths = Object.entries(spec.paths).filter(([path]) =>
    HREF_PATH.test(path),
  );
  const longestFirst = (lists) =>
    lists.sort((a, b) => b.prefix.length - a.prefix.length);
  // A list's own operations (`groups_users_list` on `{group_href}users/`) are actions of its
  // parent, not of itself.
  const kindIn = (lists) => (operationId, path) =>
    lists.find((list) => list.path !== path && operationId.startsWith(list.prefix))
      ?.kind;

  const domainLists = longestFirst(
    [...scoped].flatMap(([endpoint, item]) => {
      const prefix = listPrefix(item.get?.operationId);
      return prefix ? [{ prefix, path: endpoint, kind: endpoint.split("/")[0] }] : [];
    }),
  );
  const parentKind = kindIn(domainLists);
  const nestedLists = hrefPaths.flatMap(([path, item]) => {
    const prefix = listPrefix(item.get?.operationId);
    const action = HREF_PATH.exec(path)[1];
    const parent = prefix && action && parentKind(item.get.operationId, path);
    return parent
      ? [{ prefix, path, kind: `${parent}/${action.replace(/\/$/, "")}` }]
      : [];
  });
  const kindOf = kindIn(longestFirst([...domainLists, ...nestedLists]));

  const actions = {};
  for (const [path, item] of hrefPaths) {
    const action = HREF_PATH.exec(path)[1];
    if (!action) continue;
    for (const [, operationId] of operationsOf(item)) {
      const kind = kindOf(operationId, path);
      if (kind) (actions[kind] ??= new Set()).add(action);
    }
  }
  return actions;
};

// --- pulpTypes.gen.ts ---

const writePulpTypes = (collections) => {
  // Detail paths are bare href params (`/{rpm_uln_remote_href}`), so the partial update is
  // found by its operationId: the collection's list operation with `_partial_update`.
  const operationIds = new Set(
    Object.values(spec.paths).flatMap((item) =>
      operationsOf(item).map(([, operationId]) => operationId),
    ),
  );
  const patchOperation = (listOperationId) => {
    const id = listOperationId?.replace(/_list$/, "_partial_update");
    return id && operationIds.has(id) ? id : undefined;
  };

  const imports = new Set();
  const membersOf = (collection, item) => {
    if (collection === "content") {
      const list = item.get?.operationId;
      if (!list) return undefined;
      imports.add(`${typeName(list)}Data`).add(`${typeName(list)}Response`);
      return [`list: ${typeName(list)}Data`, `page: ${typeName(list)}Response`];
    }
    const members = [];
    const create = item.post?.operationId;
    const patch = patchOperation(item.get?.operationId);
    if (create) {
      imports.add(`${typeName(create)}Data`);
      members.push(`create: ${typeName(create)}Data["body"]`);
    }
    if (patch) {
      imports.add(`${typeName(patch)}Data`);
      members.push(`update: NonNullable<${typeName(patch)}Data["body"]>`);
    }
    return members;
  };

  const block = (name, collection, doc) => {
    const rows = Object.entries(collections[collection] ?? {})
      .sort(byKey)
      .flatMap(([apiPath, { item }]) => {
        const members = item && membersOf(collection, item);
        return members ? [`  ${literal(apiPath)}: { ${members.join("; ")} };`] : [];
      });
    return `/** ${doc} */\nexport interface ${name} {\n${rows.join("\n")}\n}\n`;
  };

  const blocks = [
    block("RemoteEndpoints", "remotes", "Remote collections by apiPath: create and update bodies."),
    block("RepositoryEndpoints", "repositories", "Repository collections by apiPath: create and update bodies."),
    block("DistributionEndpoints", "distributions", "Distribution collections by apiPath: create and update bodies."),
    block("PublicationEndpoints", "publications", "Publication collections by apiPath: the create body."),
    block("ContentEndpoints", "content", "Content collections by apiPath: list params and page."),
    block("AcsEndpoints", "acs", "Alternate content source collections by apiPath: create and update bodies."),
    block("ContentGuardEndpoints", "contentguards", "Content guard collections by apiPath: create and update bodies."),
  ];

  const target = join(root, "src/app/client/pulpTypes.gen.ts");
  writeFileSync(
    target,
    `// Generated by scripts/generate-pulp-types.mjs from openapi/pulp.json. Do not edit.
${importBlock(imports)}

${blocks.join("\n")}`,
  );
  console.log(`generate-pulp-types: wrote ${target}`);
};

// --- pulpEndpoints.gen.ts ---

const writePulpEndpoints = ({ scoped, outside, collections, hrefActions }) => {
  const imports = new Set();
  const endpointRows = [...scoped].sort(byKey).map(([endpoint, item]) => {
    const members = operationsOf(item).map(([method, operationId]) => {
      const name = typeName(operationId);
      imports.add(`${name}Data`).add(`${name}Responses`);
      return `${method}: { data: ${name}Data; responses: ${name}Responses }`;
    });
    return `  ${literal(endpoint)}: { ${members.join("; ")} };`;
  });

  const collectionRows = Object.entries(collections)
    .sort(byKey)
    .map(([collection, byApiPath]) => {
      const rows = Object.entries(byApiPath)
        .sort(byKey)
        .map(([apiPath, { actions }]) => `    ${literal(apiPath)}: ${union(actions)};`);
      return `  ${literal(collection)}: {\n${rows.join("\n")}\n  };`;
    });

  const hrefActionRows = Object.entries(hrefActions)
    .sort(byKey)
    .map(([kind, actions]) => `  ${literal(kind)}: ${union(actions)};`);

  const target = join(root, "src/app/client/pulpEndpoints.gen.ts");
  writeFileSync(
    target,
    `// Generated by scripts/generate-pulp-types.mjs from openapi/pulp.json. Do not edit.
${importBlock(imports)}

/**
 * Domain-scoped endpoints, relative to \`api/v3/\` (the domain segment, when enabled, is
 * added at runtime), with each method's operation types.
 */
export interface PulpEndpoints {
${endpointRows.join("\n")}
}

export type PulpEndpoint = keyof PulpEndpoints;

/** Endpoints outside any domain, relative to \`api/v3/\`. */
export type PulpRootEndpoint = ${union(outside)};

/**
 * Plugin collections (\`<collection>/<apiPath>/<action>\`): for each apiPath, the actions
 * under it (\`""\` is the collection itself).
 */
export interface PulpCollections {
${collectionRows.join("\n")}
}

export type PulpCollection = keyof PulpCollections;

/** The \`<app>/<slug>\` apiPaths of a plugin collection. */
export type PulpCollectionApiPath<C extends PulpCollection> =
  keyof PulpCollections[C] & string;

/**
 * The actions an href takes (\`{href}sync/\`), by resource kind: the top-level collection, so
 * the union over all its plugin types.
 */
export interface PulpHrefActions {
${hrefActionRows.join("\n")}
}

export type PulpHrefKind = keyof PulpHrefActions;
`,
  );
  console.log(`generate-pulp-types: wrote ${target}`);
};

const { scoped, outside } = collectEndpoints();
const collections = collectCollections(scoped);
writePulpTypes(collections);
writePulpEndpoints({
  scoped,
  outside,
  collections,
  hrefActions: collectHrefActions(scoped),
});
