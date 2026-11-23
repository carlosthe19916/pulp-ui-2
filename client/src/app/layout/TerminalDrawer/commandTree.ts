import type { IApiSpec } from "@app/queries/apiSpec";

/** A filter a list command takes, from the endpoint's query parameters. */
export interface IFlag {
  name: string;
  description: string;
  choices?: string[];
}

/** One readable collection: `pulp <group> <entity> list --type <type>`. */
export interface IEndpoint {
  /** The list path relative to `api/v3/`, e.g. `repositories/rpm/rpm/`. */
  path: string;
  flags: IFlag[];
}

/** group (rpm, task…) → entity (repository, "" for core groups) → type → endpoint. */
export type CommandTree = Map<string, Map<string, Map<string, IEndpoint>>>;

const V3_PREFIX = /^\/api\/pulp\/(?:\{pulp_domain\}\/)?api\/v3\//;
// Every list takes these; the terminal adds its own paging flags.
const HIDDEN_PARAMS = new Set(["pulp_domain", "offset", "limit"]);

const SINGULAR: Record<string, string> = {
  repositories: "repository",
  repository_versions: "repository-version",
  access_policies: "access-policy",
  acs: "acs",
  content: "content",
  contentguards: "content-guard",
};

/** The CLI word for an API path segment: `task-groups` → `task-group`, `hugging_face` → `hugging-face`. */
export const cliWord = (segment: string): string =>
  SINGULAR[segment] ?? segment.replace(/_/g, "-").replace(/s$/, "");

const firstSentence = (text = "") =>
  text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=\.)\s/)[0]
    ?.slice(0, 100) ?? "";

const add = (
  tree: CommandTree,
  [group, entity, type]: [string, string, string],
  endpoint: IEndpoint,
) => {
  const entities = tree.get(group) ?? new Map();
  const types = entities.get(entity) ?? new Map();
  types.set(type, endpoint);
  entities.set(entity, types);
  tree.set(group, entities);
};

/**
 * The read commands of one component's spec. A plugin collection
 * (`repositories/rpm/rpm/`) becomes `rpm repository` with type `rpm`; a top-level one
 * (`tasks/`) becomes the group `task`.
 */
export const buildCommandTree = (spec: IApiSpec): CommandTree => {
  const tree: CommandTree = new Map();
  for (const [path, item] of Object.entries(spec.paths)) {
    const prefix = V3_PREFIX.exec(path);
    if (!prefix || !item.get) continue;
    const segments = path.slice(prefix[0].length).split("/").filter(Boolean);
    if (segments.some((segment) => segment.includes("{"))) continue;
    const flags = (item.get.parameters ?? [])
      .filter(
        (parameter) =>
          parameter.in === "query" && !HIDDEN_PARAMS.has(parameter.name),
      )
      .map((parameter) => ({
        name: parameter.name,
        description: firstSentence(parameter.description),
        choices: parameter.schema?.enum ?? parameter.schema?.items?.enum,
      }));
    const endpoint = { path: `${segments.join("/")}/`, flags };
    if (segments.length === 3) {
      const [collection, plugin, type] = segments as [string, string, string];
      add(
        tree,
        [cliWord(plugin), cliWord(collection), type.replace(/_/g, "-")],
        endpoint,
      );
    } else if (segments.length === 1) {
      add(tree, [cliWord(segments[0] as string), "", ""], endpoint);
    }
  }
  return tree;
};
