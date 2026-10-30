import type { EdgeModel, NodeModel } from "@patternfly/react-topology";

import type {
  DistributionResponse,
  GenericRemoteResponse,
  PublicationResponse,
  RepositoryResponse,
} from "@app/client";
import { parseRepositoryVersionHref } from "@app/queries/utils/pulpHref";

/** A typed publication: only plugin serializers list the distributions serving it. */
export interface ITopologyPublication extends PublicationResponse {
  distributions?: string[];
}

export type TopologyNodeKind =
  "remote" | "repository" | "version" | "publication" | "distribution";

export interface ITopologyNodeData {
  kind: TopologyNodeKind;
  href: string;
  secondaryLabel: string;
  isRunning?: boolean;
  isGuarded?: boolean;
  /** A "+N more" placeholder for the rows past the page shown. */
  isMore?: boolean;
}

export interface ITopologyNode extends NodeModel {
  data: ITopologyNodeData;
}

export interface IRepositoryGraph {
  nodes: ITopologyNode[];
  edges: EdgeModel[];
  /** A distribution serves the repository or one of its drawn publications. */
  isServed: boolean;
  /** Only the repository and its versions: nothing worth drawing. */
  isTrivial: boolean;
}

export const TOPOLOGY_NODE_SIZE = 60;

const KIND_LABEL: Record<TopologyNodeKind, string> = {
  remote: "Remote",
  repository: "Repository",
  version: "Version",
  publication: "Publication",
  distribution: "Distribution",
};

interface IBuildRepositoryGraphOptions {
  repository: RepositoryResponse;
  remote?: Pick<GenericRemoteResponse, "pulp_href" | "name">;
  publications: ITopologyPublication[];
  /** Serving the repository directly, then serving one of `publications`. */
  distributions: DistributionResponse[];
  /** Totals behind the shown pages, for the "+N more" nodes. */
  publicationCount?: number;
  directDistributionCount?: number;
  isRunning?: boolean;
}

const versionNumber = (href: string) =>
  parseRepositoryVersionHref(href)?.number ?? "?";

/**
 * The repository's serving graph: remote → repository → versions → publications →
 * distributions. Only versions a publication points at (and the latest) get a node.
 */
export const buildRepositoryGraph = ({
  repository,
  remote,
  publications,
  distributions,
  publicationCount = publications.length,
  directDistributionCount,
  isRunning = false,
}: IBuildRepositoryGraphOptions): IRepositoryGraph => {
  const repoHref = repository.pulp_href ?? "";
  const nodes = new Map<string, ITopologyNode>();
  const edges = new Map<string, EdgeModel>();

  const addNode = ({
    id,
    kind,
    label,
    data,
  }: {
    id: string;
    kind: TopologyNodeKind;
    label: string;
    data?: Partial<ITopologyNodeData>;
  }) => {
    if (nodes.has(id)) return;
    nodes.set(id, {
      id,
      type: "node",
      label,
      width: TOPOLOGY_NODE_SIZE,
      height: TOPOLOGY_NODE_SIZE,
      data: { kind, href: id, secondaryLabel: KIND_LABEL[kind], ...data },
    });
  };
  const addEdge = ({ source, target }: { source: string; target: string }) => {
    const id = `${source}->${target}`;
    edges.set(id, { id, type: "edge", source, target });
  };
  const addMore = ({
    kind,
    count,
  }: {
    kind: TopologyNodeKind;
    count: number;
  }) => {
    if (count <= 0) return;
    const id = `${repoHref}#more-${kind}`;
    addNode({
      id,
      kind,
      label: `+${count} more`,
      data: { href: "", isMore: true },
    });
    addEdge({ source: repoHref, target: id });
  };
  const addVersion = (href: string) => {
    addNode({
      id: href,
      kind: "version",
      label: `Version ${versionNumber(href)}`,
      data:
        href === repository.latest_version_href
          ? { secondaryLabel: "Latest version" }
          : undefined,
    });
    addEdge({ source: repoHref, target: href });
  };

  addNode({
    id: repoHref,
    kind: "repository",
    label: repository.name,
    data: { isRunning },
  });

  if (remote?.pulp_href) {
    addNode({ id: remote.pulp_href, kind: "remote", label: remote.name });
    addEdge({ source: remote.pulp_href, target: repoHref });
  }

  if (repository.latest_version_href) {
    addVersion(repository.latest_version_href);
  }

  // Only served publications and the newest one: unserved history is noise.
  const drawnPublications = publications.filter(
    (publication, index) =>
      index === 0 || (publication.distributions?.length ?? 0) > 0,
  );
  const publicationByDistribution = new Map<string, string>();
  for (const publication of drawnPublications) {
    const { pulp_href: href, repository_version: versionHref } = publication;
    if (!href || !versionHref) continue;
    addVersion(versionHref);
    addNode({
      id: href,
      kind: "publication",
      label: `Publication of v${versionNumber(versionHref)}`,
    });
    addEdge({ source: versionHref, target: href });
    for (const distributionHref of publication.distributions ?? []) {
      publicationByDistribution.set(distributionHref, href);
    }
  }
  // Hidden publications hang off the repository: their versions aren't drawn.
  addMore({
    kind: "publication",
    count: publicationCount - drawnPublications.length,
  });

  let directShown = 0;
  for (const distribution of distributions) {
    const href = distribution.pulp_href;
    if (!href) continue;
    const isDirect = distribution.repository === repoHref;
    const source = isDirect ? repoHref : publicationByDistribution.get(href);
    if (!source) continue;
    if (isDirect) directShown += 1;
    addNode({
      id: href,
      kind: "distribution",
      label: distribution.name,
      data: {
        secondaryLabel: distribution.base_path,
        isGuarded: !!distribution.content_guard,
      },
    });
    addEdge({ source, target: href });
  }
  addMore({
    kind: "distribution",
    count: (directDistributionCount ?? directShown) - directShown,
  });

  const nodeList = [...nodes.values()];
  return {
    nodes: nodeList,
    edges: [...edges.values()],
    isServed: nodeList.some(({ data }) => data.kind === "distribution"),
    isTrivial: nodeList.every(
      ({ data }) => data.kind === "repository" || data.kind === "version",
    ),
  };
};
