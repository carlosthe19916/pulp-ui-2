import type { CommandTree, IEndpoint } from "./commandTree";
import { parseArgs, tokenize } from "./tokenize";

export interface ICommandContext {
  /** CLI words of the installed plugins (rpm, file, hugging-face…), without core. */
  plugins: string[];
  /** The commands of a plugin, or of core for any other word. */
  treeFor: (group: string) => Promise<CommandTree>;
  /** A GET of `path` relative to `api/v3/` (or a pulp_href), as the signed-in user. */
  get: (path: string, params?: Record<string, string>) => Promise<unknown>;
}

const DEFAULT_LIMIT = "25";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const READ_ONLY_VERBS = new Set([
  "create",
  "update",
  "destroy",
  "delete",
  "sync",
  "modify",
  "publish",
  "upload",
  "label",
]);
const LIST_FLAGS = ["limit", "offset"];

const error = (message: string) => `${RED}Error: ${message}${RESET}`;
const json = (value: unknown) => JSON.stringify(value, null, 2);

/** Matches a typed type name to the endpoint's: `package` → `packages`. */
const pickType = (
  types: Map<string, IEndpoint>,
  group: string,
  wanted?: string,
) => {
  if (wanted) {
    const plurals = [
      wanted,
      `${wanted}s`,
      `${wanted}es`,
      wanted.replace(/y$/, "ies"),
    ];
    const name = [...types.keys()].find((type) => plurals.includes(type));
    return name ? types.get(name) : undefined;
  }
  return (
    // Like pulp-cli: the type named after the plugin, else packages (rpm, python, deb content).
    types.get(group) ??
    types.get("packages") ??
    (types.size === 1 ? [...types.values()][0] : undefined)
  );
};

const flagHelp = (endpoint: IEndpoint, extra: string[]) =>
  [
    ...extra,
    ...endpoint.flags.map(
      (flag) =>
        `  --${flag.name}${flag.choices ? ` [${flag.choices.join("|")}]` : " TEXT"}  ${DIM}${flag.description}${RESET}`,
    ),
  ].join("\n");

const listing = (title: string, items: string[]) =>
  `${title}\n${items.map((item) => `  ${item}`).join("\n")}`;

const topHelp = async (context: ICommandContext) => {
  const core = await context.treeFor("");
  return [
    "Usage: pulp [COMMAND] ... [--help]",
    "Read-only: it lists and shows, it doesn't change anything.",
    listing("Plugins:", context.plugins),
    listing("Core:", [...core.keys(), "status"].sort()),
    listing("Other:", [
      "api get PATH [--FILTER VALUE...]   any GET of the API",
      "clear",
    ]),
  ].join("\n\n");
};

/** Runs `pulp …` and returns what to print. */
export const runCommand = async (
  line: string,
  context: ICommandContext,
): Promise<string> => {
  const tokens = tokenize(line);
  if (tokens[0] === "pulp") tokens.shift();
  const { words, flags, help } = parseArgs(tokens);
  const [group, second, third, fourth] = words;

  try {
    if (!group || group === "help") return await topHelp(context);
    if (group === "status") return json(await context.get("status/"));
    if (group === "api") {
      if (second !== "get" || !third)
        return "Usage: pulp api get PATH [--FILTER VALUE...]";
      return json(await context.get(third, flags));
    }

    const tree = await context.treeFor(group);
    const entities = tree.get(group);
    if (!entities) return error(`No such command "${group}". Try pulp --help.`);

    // Core groups have no entity: `pulp task list`.
    const isCore = entities.has("");
    const entity = isCore ? "" : (second ?? "");
    const verb = isCore ? second : third;
    const prefix = `pulp ${group}${isCore ? "" : ` ${entity}`}`;

    if (!isCore && !entities.has(entity)) {
      return listing(
        `Usage: pulp ${group} COMMAND\n\nCommands:`,
        [...entities.keys()].sort(),
      );
    }
    const types = entities.get(entity) as Map<string, IEndpoint>;
    const typeChoices = [...types.keys()].filter(Boolean);
    const typeLine =
      typeChoices.length > 1 ? [`  --type [${typeChoices.join("|")}]`] : [];

    if (verb && READ_ONLY_VERBS.has(verb)) {
      return error(
        `"${verb}" changes Pulp; this terminal only reads. Use the UI for it.`,
      );
    }
    if (verb === "version" && entity === "repository") {
      return await repositoryVersions({
        context,
        types,
        group,
        flags,
        help,
        prefix,
        verb: fourth,
      });
    }
    if (!verb || (verb !== "list" && verb !== "show")) {
      return listing(`Usage: ${prefix} COMMAND [OPTIONS]\n\nCommands:`, [
        "list",
        "show",
        ...(entity === "repository" ? ["version list"] : []),
      ]);
    }

    const endpoint = pickType(types, group, flags.type);
    if (!endpoint) {
      return error(`Choose a type with --type: ${typeChoices.join(", ")}`);
    }
    const hasName = endpoint.flags.some((flag) => flag.name === "name");

    if (verb === "show") {
      if (help || (!flags.href && !flags.name)) {
        return `Usage: ${prefix} show ${hasName ? "--name NAME | " : ""}--href HREF\n\nOptions:\n${typeLine.join("\n")}`;
      }
      if (flags.href) return json(await context.get(flags.href));
      if (!hasName) return error("This command has no --name; use --href.");
      const page = (await context.get(endpoint.path, { name: flags.name })) as {
        results: unknown[];
      };
      return page.results[0]
        ? json(page.results[0])
        : error(`Nothing is named "${flags.name}".`);
    }

    if (help) {
      return `Usage: ${prefix} list [OPTIONS]\n\nOptions:\n${flagHelp(
        endpoint,
        [
          ...typeLine,
          "  --limit INTEGER  Rows to show (default 25)",
          "  --offset INTEGER  Rows to skip",
        ],
      )}`;
    }
    const { type: _type, ...filters } = flags;
    const known = new Set([
      ...endpoint.flags.map((flag) => flag.name),
      ...LIST_FLAGS,
    ]);
    const unknown = Object.keys(filters).find((name) => !known.has(name));
    if (unknown)
      return error(`No such option: --${unknown}. See ${prefix} list --help.`);
    const page = (await context.get(endpoint.path, {
      limit: DEFAULT_LIMIT,
      ...filters,
    })) as { count: number; results: unknown[] };
    const more =
      page.count > page.results.length
        ? `\n${DIM}${page.results.length} of ${page.count}; use --limit and --offset for more.${RESET}`
        : "";
    return json(page.results) + more;
  } catch (failure) {
    return error(describeFailure(failure));
  }
};

const repositoryVersions = async ({
  context,
  types,
  group,
  flags,
  help,
  prefix,
  verb,
}: {
  context: ICommandContext;
  types: Map<string, IEndpoint>;
  group: string;
  flags: Record<string, string>;
  help: boolean;
  prefix: string;
  verb?: string;
}) => {
  if (help || verb !== "list" || !flags.repository) {
    return `Usage: ${prefix} version list --repository NAME [--type TYPE]`;
  }
  const endpoint = pickType(types, group, flags.type);
  if (!endpoint) return error("Choose a type with --type.");
  const found = (await context.get(endpoint.path, {
    name: flags.repository,
  })) as {
    results: { pulp_href?: string }[];
  };
  const href = found.results[0]?.pulp_href;
  if (!href) return error(`No repository is named "${flags.repository}".`);
  const page = (await context.get(`${href}versions/`, {
    limit: flags.limit ?? DEFAULT_LIMIT,
  })) as {
    results: unknown[];
  };
  return json(page.results);
};

/** Pulp's own message, like the CLI prints it. */
const describeFailure = (failure: unknown): string => {
  const response = (
    failure as { response?: { status?: number; data?: unknown } }
  ).response;
  if (response?.status === 403)
    return "You don't have permission to read this (403).";
  if (response?.status === 404) return "Not found (404).";
  if (response?.data)
    return `${response.status}: ${JSON.stringify(response.data)}`;
  return failure instanceof Error ? failure.message : String(failure);
};

/** Words that can follow `line` at the cursor, for Tab. */
export const complete = async (
  line: string,
  context: ICommandContext,
): Promise<string[]> => {
  const tokens = tokenize(line);
  if (tokens[0] === "pulp") tokens.shift();
  const typing = line.endsWith(" ") ? "" : (tokens.pop() ?? "");
  const { words } = parseArgs(tokens);
  const matches = (options: string[]) =>
    options.filter((option) => option.startsWith(typing));

  if (words.length === 0) {
    const core = await context.treeFor("");
    return matches(
      [
        "pulp",
        ...context.plugins,
        ...core.keys(),
        "status",
        "api",
        "help",
        "clear",
      ].filter((word) => word !== "pulp" || !line.trim()),
    );
  }
  const tree = await context.treeFor(words[0] as string);
  const entities = tree.get(words[0] as string);
  if (!entities) return [];
  const isCore = entities.has("");
  const level = words.length - (isCore ? 1 : 2);
  if (!isCore && words.length === 1)
    return matches([...entities.keys()].sort());
  if (level === 0)
    return matches([
      "list",
      "show",
      ...(words[1] === "repository" ? ["version"] : []),
    ]);
  if (typing.startsWith("--")) {
    const types = entities.get(isCore ? "" : (words[1] as string));
    const endpoint = types && pickType(types, words[0] as string);
    return matches([
      ...new Set([
        "--help",
        "--type",
        "--limit",
        "--offset",
        "--name",
        "--href",
        ...(endpoint?.flags.map((flag) => `--${flag.name}`) ?? []),
      ]),
    ]);
  }
  return [];
};
