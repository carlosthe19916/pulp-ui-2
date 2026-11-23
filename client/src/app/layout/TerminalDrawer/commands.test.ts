import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IApiSpec } from "@app/queries/apiSpec";

import { complete, type ICommandContext, runCommand } from "./commands";
import { buildCommandTree } from "./commandTree";

const list = (names: string[] = []) => ({
  get: { parameters: names.map((name) => ({ name, in: "query" })) },
});

const prefix = "/api/pulp/{pulp_domain}/api/v3/";
const pluginTree = buildCommandTree({
  paths: {
    [`${prefix}repositories/rpm/rpm/`]: list(["name"]),
    [`${prefix}content/rpm/packages/`]: list(["name"]),
    [`${prefix}content/rpm/advisories/`]: list(["id"]),
  },
} satisfies IApiSpec);
const coreTree = buildCommandTree({
  paths: { [`${prefix}tasks/`]: list(["state"]) },
} satisfies IApiSpec);

const get = vi.fn();
const context: ICommandContext = {
  plugins: ["rpm"],
  treeFor: async (group) => (group === "rpm" ? pluginTree : coreTree),
  get,
};

// The output without ANSI colours.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
const run = async (line: string) =>
  (await runCommand(line, context)).replace(ANSI, "");

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ count: 1, results: [{ name: "seed-rpm" }] });
});

describe("runCommand", () => {
  it("lists with the filters, a default page and the JSON pulp-cli prints", async () => {
    expect(await run("pulp rpm repository list --name seed-rpm")).toBe(
      JSON.stringify([{ name: "seed-rpm" }], null, 2),
    );
    expect(get).toHaveBeenCalledWith("repositories/rpm/rpm/", {
      limit: "25",
      name: "seed-rpm",
    });
  });

  it("says how many more there are", async () => {
    get.mockResolvedValue({ count: 40, results: [{ name: "a" }] });
    expect(await run("pulp rpm repository list")).toContain(
      "1 of 40; use --limit and --offset for more.",
    );
  });

  it("defaults content to packages and accepts a singular --type", async () => {
    await run("pulp rpm content list");
    expect(get).toHaveBeenLastCalledWith("content/rpm/packages/", {
      limit: "25",
    });
    await run("pulp rpm content list --type advisory");
    expect(get).toHaveBeenLastCalledWith("content/rpm/advisories/", {
      limit: "25",
    });
  });

  it("shows one object by name", async () => {
    expect(await run("pulp rpm repository show --name seed-rpm")).toBe(
      JSON.stringify({ name: "seed-rpm" }, null, 2),
    );
  });

  it("runs core commands without an entity", async () => {
    await run("pulp task list --state failed");
    expect(get).toHaveBeenCalledWith("tasks/", {
      limit: "25",
      state: "failed",
    });
  });

  it("refuses unknown options and changes", async () => {
    expect(await run("pulp rpm repository list --bogus x")).toBe(
      "Error: No such option: --bogus. See pulp rpm repository list --help.",
    );
    expect(await run("pulp rpm repository create --name x")).toBe(
      'Error: "create" changes Pulp; this terminal only reads. Use the UI for it.',
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("prints Pulp's error, like the CLI", async () => {
    get.mockRejectedValue({ response: { status: 403 } });
    expect(await run("pulp task list")).toBe(
      "Error: You don't have permission to read this (403).",
    );
  });

  it("explains a command with --help", async () => {
    expect(await run("pulp rpm repository list --help")).toContain(
      "--name TEXT",
    );
  });
});

describe("complete", () => {
  it("completes plugins, entities, verbs and flags", async () => {
    expect(await complete("pulp r", context)).toEqual(["rpm"]);
    expect(await complete("pulp rpm ", context)).toEqual([
      "content",
      "repository",
    ]);
    expect(await complete("pulp rpm repository l", context)).toEqual(["list"]);
    expect(await complete("pulp rpm repository list --na", context)).toEqual([
      "--name",
    ]);
  });
});
