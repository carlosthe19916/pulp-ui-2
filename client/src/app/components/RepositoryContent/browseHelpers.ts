import type { ContainerManifestResponse } from "@app/client";

// --- Shared ---

/** Which rows start a new group (e.g. one package name above its versions). */
export const groupStarts = <T>({
  rows,
  groupBy,
}: {
  rows: T[];
  groupBy: (row: T) => string;
}): boolean[] =>
  rows.map(
    (row, index) => index === 0 || groupBy(rows[index - 1]) !== groupBy(row),
  );

/** `a/b/` → `["a", "b"]`; the prefix of segment i is `segments.slice(0, i + 1).join("/") + "/"`. */
export const pathSegments = (prefix: string): string[] =>
  prefix.split("/").filter(Boolean);

// --- Ansible ---

/** Fully qualified collection name, the identity Galaxy shows. */
export const fqcn = ({
  namespace,
  name,
}: {
  namespace?: string;
  name?: string;
}) => `${namespace}.${name}`;

// --- Container ---

/** An image index / manifest list points at one manifest per platform. */
export const isMultiArch = (
  manifest?: Pick<ContainerManifestResponse, "listed_manifests">,
) => (manifest?.listed_manifests.length ?? 0) > 0;

export const pullCommand = ({
  registryPath,
  tag,
}: {
  registryPath: string;
  tag: string;
}) => `podman pull ${registryPath}:${tag}`;

// --- RPM ---

const SEVERITY_COLOR: Record<string, "orange" | "yellow" | "blue" | "grey"> = {
  critical: "orange",
  important: "orange",
  moderate: "yellow",
  low: "blue",
};

export const severityColor = (severity?: string) =>
  SEVERITY_COLOR[(severity ?? "").toLowerCase()] ?? "grey";

// --- Debian ---

/** The `/etc/apt/sources.list` line for one release of the repository. */
export interface ISourcesLineParams {
  baseUrl: string;
  codename: string;
  components?: string[];
}

export const sourcesLine = ({
  baseUrl,
  codename,
  components,
}: ISourcesLineParams) =>
  `deb ${baseUrl} ${codename} ${(components ?? []).join(" ")}`.trim();

/** Values of the release content that names a distribution, keyed by that name. */
export const valuesByDistribution = <T extends { distribution: string }>({
  rows,
  value,
}: {
  rows: T[];
  value: (row: T) => string;
}): Map<string, string[]> => {
  const byDistribution = new Map<string, string[]>();
  for (const row of rows) {
    byDistribution.set(row.distribution, [
      ...(byDistribution.get(row.distribution) ?? []),
      value(row),
    ]);
  }
  return byDistribution;
};

// --- Python / npm / gems ---

/** PEP 503 project-name normalization, which yanks are keyed by. */
export const normalizeProjectName = (name: string) =>
  name.toLowerCase().replace(/[-_.]+/g, "-");

export const pipInstall = (baseUrl: string) =>
  `pip install --index-url ${baseUrl}simple/ <package>`;

export const npmInstall = (baseUrl: string) =>
  `npm install --registry ${baseUrl} <package>`;

export const gemInstall = (baseUrl: string) =>
  `gem install --source ${baseUrl} <gem>`;

// --- Maven ---

/** A SNAPSHOT's newest build (`1.0-SNAPSHOT` → `20261022.101500-4`), or "" for releases. */
export const snapshotBuild = ({
  version,
  release,
}: {
  version: string;
  release: string;
}) =>
  release && release !== version
    ? release.replace(version.replace(/-SNAPSHOT$/, "-"), "")
    : "";
