import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

import type { DebReleaseResponse } from "@app/client";
import { Snippet } from "@app/components/Snippet";
import {
  useContentTypeAllQuery,
  useContentTypeListQuery,
} from "@app/queries/content";

import { sourcesLine, valuesByDistribution } from "./helpers";
import { BrowseTable } from "./BrowseTable";
import type { IBrowseContext } from "./types";
import { useBrowseListState } from "./useBrowseListState";

const Labels: React.FC<{ items?: string[] }> = ({ items }) =>
  items?.length ? (
    <LabelGroup numLabels={6}>
      {items.map((item) => (
        <Label key={item} isCompact variant="outline">
          {item}
        </Label>
      ))}
    </LabelGroup>
  ) : (
    "—"
  );

/** Dists as packages.ubuntu.com shows them: codename, suite, components, architectures. */
export const DebReleases: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
}) => {
  const list = useBrowseListState({
    filters: [
      { param: "codename", label: "Codename", placeholder: "Exact codename" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "deb.release",
    params: { ...list.params, repository_version: versionHref },
  });
  // Releases may leave `components`/`architectures` empty; the release's component and
  // architecture content carry them, linked by distribution name.
  // TODO: drop this fallback once pulp_deb fills the release's own lists (see DebReleaseContent).
  const components = useContentTypeAllQuery({
    pulpType: "deb.release_component",
    params: {
      repository_version: versionHref,
      fields: ["component", "distribution"],
    },
  });
  const architectures = useContentTypeAllQuery({
    pulpType: "deb.release_architecture",
    params: {
      repository_version: versionHref,
      fields: ["architecture", "distribution"],
    },
  });
  const componentsByRelease = valuesByDistribution({
    rows: components.data?.results ?? [],
    value: (c) => c.component,
  });
  const architecturesByRelease = valuesByDistribution({
    rows: architectures.data?.results ?? [],
    value: (a) => a.architecture,
  });
  const componentsOf = (release: DebReleaseResponse) =>
    release.components?.length
      ? release.components
      : (componentsByRelease.get(release.distribution) ?? []);
  const architecturesOf = (release: DebReleaseResponse) =>
    release.architectures?.length
      ? release.architectures
      : (architecturesByRelease.get(release.distribution) ?? []);

  const { baseUrl } = served;
  const first = data?.results[0];

  return (
    <BrowseTable
      ariaLabel="Releases"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No releases"
      header={
        baseUrl && first ? (
          <Snippet
            code={sourcesLine({
              baseUrl,
              codename: first.codename,
              components: componentsOf(first),
            })}
          />
        ) : undefined
      }
      rowHref={(release) => release.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      columns={[
        { title: "Codename", cell: (r) => r.codename },
        { title: "Suite", cell: (r) => r.suite },
        { title: "Origin", cell: (r) => r.origin || "—" },
        { title: "Version", cell: (r) => r.version || "—" },
        {
          title: "Components",
          cell: (r) => <Labels items={componentsOf(r)} />,
        },
        {
          title: "Architectures",
          cell: (r) => <Labels items={architecturesOf(r)} />,
        },
      ]}
    />
  );
};

export const DebPackages: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["package", "version", "architecture"] as const,
      initial: { sortBy: "package", direction: "asc" },
    },
    filters: [
      { param: "package__icontains", label: "Package" },
      {
        param: "architecture",
        label: "Architecture",
        placeholder: "Exact architecture",
      },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "deb.package",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: [
        "pulp_href",
        "package",
        "version",
        "architecture",
        "section",
        "priority",
        "maintainer",
      ],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Packages"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No packages"
      rowHref={(pkg) => pkg.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      columns={[
        {
          title: "Package",
          sort: list.sortProps("package"),
          cell: (p) => p.package,
        },
        {
          title: "Version",
          sort: list.sortProps("version"),
          cell: (p) => p.version,
        },
        {
          title: "Architecture",
          sort: list.sortProps("architecture"),
          cell: (p) => p.architecture,
        },
        { title: "Section", cell: (p) => p.section || "—" },
        { title: "Priority", cell: (p) => p.priority || "—" },
        {
          title: "Maintainer",
          isTruncated: true,
          cell: (p) => p.maintainer || "—",
        },
      ]}
    />
  );
};

/** Launchpad-style source packages with the binaries built from them. */
export const DebSourcePackages: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["source", "version"] as const,
      initial: { sortBy: "source", direction: "asc" },
    },
    filters: [
      { param: "source", label: "Source", placeholder: "Exact source name" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "deb.source_package",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: [
        "pulp_href",
        "source",
        "version",
        "format",
        "maintainer",
        "binary",
      ],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Source packages"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No source packages"
      rowHref={(source) => source.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      columns={[
        {
          title: "Source",
          sort: list.sortProps("source"),
          cell: (s) => s.source,
        },
        {
          title: "Version",
          sort: list.sortProps("version"),
          cell: (s) => s.version,
        },
        { title: "Format", cell: (s) => s.format || "—" },
        { title: "Binaries", isTruncated: true, cell: (s) => s.binary || "—" },
        {
          title: "Maintainer",
          isTruncated: true,
          cell: (s) => s.maintainer || "—",
        },
      ]}
    />
  );
};
