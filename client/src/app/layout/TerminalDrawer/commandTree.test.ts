import { describe, expect, it } from "vitest";

import type { IApiSpec } from "@app/queries/apiSpec";

import { buildCommandTree, cliWord } from "./commandTree";

const list = (parameters: { name: string; description?: string }[] = []) => ({
  get: {
    parameters: parameters.map((parameter) => ({ ...parameter, in: "query" })),
  },
});

const spec: IApiSpec = {
  paths: {
    "/api/pulp/{pulp_domain}/api/v3/repositories/rpm/rpm/": list([
      { name: "name", description: "Filter by name. More text." },
      { name: "limit" },
      { name: "pulp_domain" },
    ]),
    "/api/pulp/{pulp_domain}/api/v3/content/rpm/packages/": list([
      { name: "name" },
    ]),
    "/api/pulp/{pulp_domain}/api/v3/repositories/hugging_face/hugging-face/":
      list(),
    "/api/pulp/{pulp_domain}/api/v3/tasks/": list([{ name: "state" }]),
    "/api/pulp/{pulp_domain}/api/v3/rpm/prune/": { post: {} },
    "{rpm_rpm_repository_href}versions/": list(),
  },
};

describe("buildCommandTree", () => {
  const tree = buildCommandTree(spec);

  it("turns plugin collections into <plugin> <entity> with a type", () => {
    const endpoint = tree.get("rpm")?.get("repository")?.get("rpm");
    expect(endpoint?.path).toBe("repositories/rpm/rpm/");
    expect(endpoint?.flags).toEqual([
      { name: "name", description: "Filter by name.", choices: undefined },
    ]);
    expect(tree.get("rpm")?.get("content")?.has("packages")).toBe(true);
  });

  it("covers plugins pulp-cli has no plugin for", () => {
    expect(
      tree.get("hugging-face")?.get("repository")?.has("hugging-face"),
    ).toBe(true);
  });

  it("turns top-level collections into core groups", () => {
    expect(tree.get("task")?.get("")?.get("")?.path).toBe("tasks/");
  });

  it("leaves out writes and object paths", () => {
    expect(tree.has("prune")).toBe(false);
    expect([...tree.keys()].sort()).toEqual(["hugging-face", "rpm", "task"]);
  });
});

describe("cliWord", () => {
  it.each([
    ["repositories", "repository"],
    ["task-groups", "task-group"],
    ["hugging_face", "hugging-face"],
    ["content", "content"],
  ])("%s → %s", (segment, word) => {
    expect(cliWord(segment)).toBe(word);
  });
});
