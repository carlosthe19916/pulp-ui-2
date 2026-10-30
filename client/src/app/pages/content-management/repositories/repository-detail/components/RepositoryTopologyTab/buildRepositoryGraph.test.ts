import { describe, expect, it } from "vitest";

import type { DistributionResponse, RepositoryResponse } from "@app/client";

import { buildRepositoryGraph } from "./buildRepositoryGraph";

const REPO = "/pulp/default/api/v3/repositories/file/file/r1/";
const REMOTE = "/pulp/default/api/v3/remotes/file/file/m1/";
const V1 = `${REPO}versions/1/`;
const V2 = `${REPO}versions/2/`;
const PUB = "/pulp/default/api/v3/publications/file/file/p1/";
const DIST = "/pulp/default/api/v3/distributions/file/file/";

const repository: RepositoryResponse = {
  pulp_href: REPO,
  name: "repo",
  latest_version_href: V2,
};

const distribution = (
  id: string,
  fields: Partial<DistributionResponse> = {},
): DistributionResponse => ({
  pulp_href: `${DIST}${id}/`,
  name: id,
  base_path: id,
  ...fields,
});

const edgeIds = (graph: ReturnType<typeof buildRepositoryGraph>) =>
  graph.edges.map((edge) => edge.id).sort();

describe("buildRepositoryGraph", () => {
  it("draws only the repository and its latest version when nothing serves it", () => {
    const graph = buildRepositoryGraph({
      repository,
      publications: [],
      distributions: [],
    });

    expect(graph.nodes.map((node) => node.label)).toEqual([
      "repo",
      "Version 2",
    ]);
    expect(edgeIds(graph)).toEqual([`${REPO}->${V2}`]);
    expect(graph.isTrivial).toBe(true);
    expect(graph.isServed).toBe(false);
  });

  it("links the remote, an older version's publication and both kinds of distribution", () => {
    const graph = buildRepositoryGraph({
      repository,
      remote: { pulp_href: REMOTE, name: "upstream" },
      publications: [
        {
          pulp_href: PUB,
          repository_version: V1,
          distributions: [`${DIST}pub/`],
        },
      ],
      distributions: [
        distribution("direct", { repository: REPO, content_guard: "/guard/" }),
        distribution("pub"),
      ],
      directDistributionCount: 1,
    });

    expect(edgeIds(graph)).toEqual(
      [
        `${REMOTE}->${REPO}`,
        `${REPO}->${V2}`,
        `${REPO}->${V1}`,
        `${V1}->${PUB}`,
        `${REPO}->${DIST}direct/`,
        `${PUB}->${DIST}pub/`,
      ].sort(),
    );
    const direct = graph.nodes.find((node) => node.id === `${DIST}direct/`);
    expect(direct?.data).toMatchObject({
      kind: "distribution",
      secondaryLabel: "direct",
      isGuarded: true,
    });
  });

  it("drops distributions that serve neither the repository nor a shown publication", () => {
    const graph = buildRepositoryGraph({
      repository,
      publications: [],
      distributions: [distribution("other", { repository: "/elsewhere/" })],
    });

    expect(graph.nodes.some((node) => node.id === `${DIST}other/`)).toBe(false);
  });

  it("collapses the rows past the shown page into '+N more' nodes", () => {
    const graph = buildRepositoryGraph({
      repository,
      publications: [{ pulp_href: PUB, repository_version: V2 }],
      publicationCount: 3,
      distributions: [distribution("direct", { repository: REPO })],
      directDistributionCount: 5,
    });

    const more = graph.nodes.filter((node) => node.data.isMore);
    expect(more.map((node) => [node.data.kind, node.label])).toEqual([
      ["publication", "+2 more"],
      ["distribution", "+4 more"],
    ]);
  });

  it("draws served publications and the newest, collapsing unserved ones", () => {
    const pub = (n: number, distributions: string[] = []) => ({
      pulp_href: `${PUB}${n}/`,
      repository_version: `${REPO}versions/${n}/`,
      distributions,
    });
    const graph = buildRepositoryGraph({
      repository,
      publications: [pub(9), pub(8), pub(7, [`${DIST}old/`]), pub(6)],
      publicationCount: 4,
      distributions: [distribution("old")],
    });

    expect(
      graph.nodes
        .filter((node) => node.data.kind === "publication")
        .map((node) => node.label),
    ).toEqual(["Publication of v9", "Publication of v7", "+2 more"]);
    expect(graph.isServed).toBe(true);
  });

  it("reports a repository nothing serves that still has a publication to draw", () => {
    const graph = buildRepositoryGraph({
      repository,
      publications: [{ pulp_href: PUB, repository_version: V2 }],
      distributions: [],
    });

    expect(graph.isServed).toBe(false);
    expect(graph.isTrivial).toBe(false);
  });

  it("counts distributions past the page as serving the repository", () => {
    const graph = buildRepositoryGraph({
      repository,
      publications: [],
      distributions: [],
      directDistributionCount: 2,
    });

    expect(graph.isServed).toBe(true);
    expect(graph.isTrivial).toBe(false);
  });

  it("marks the repository while a task runs", () => {
    const graph = buildRepositoryGraph({
      repository,
      publications: [],
      distributions: [],
      isRunning: true,
    });

    expect(graph.nodes[0]?.data).toMatchObject({
      kind: "repository",
      isRunning: true,
    });
  });
});
