import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

import {
  BrowseTable,
  defineBrowseListState,
  useBrowseListState,
} from "@app/components/BrowseShell";
import { Snippet } from "@app/components/Snippet";
import { useContentTypeListQuery } from "@app/queries/content";
import type { IBrowseContext } from "@plugin-sdk/ui";

import { sourcesLine } from "../helpers";

interface ILabelsProps {
  items?: string[];
}

const Labels: React.FC<ILabelsProps> = ({ items }) =>
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

const DEB_RELEASES_LIST = defineBrowseListState({
  filters: [
    { param: "codename", label: "Codename", placeholder: "Exact codename" },
  ],
});

/** Dists as packages.ubuntu.com shows them: codename, suite, components, architectures. */
export const DebReleases: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(DEB_RELEASES_LIST);
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "deb.release",
    params: { ...list.params, repository_version: versionHref },
  });
  // Releases may leave `components`/`architectures` empty and carry them as
  // `deb.release_component` / `deb.release_architecture` units linked only by
  // distribution name (no `__in` filter), so the release's detail panel reads those.
  const { baseUrl } = served;
  const first = data?.results[0];

  return (
    <BrowseTable
      ariaLabel="Releases"
      list={list}
      rows={data?.results ?? []}
      count={data?.count}
      isLoading={isLoading}
      error={error}
      emptyTitle="No releases"
      header={
        baseUrl && first ? (
          <Snippet
            code={sourcesLine({
              baseUrl,
              codename: first.codename,
              components: first.components,
            })}
          />
        ) : undefined
      }
      rowHref={(release) => release.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "Codename", width: 15, cell: (r) => r.codename },
        { title: "Suite", width: 15, cell: (r) => r.suite },
        { title: "Origin", width: 15, cell: (r) => r.origin || "—" },
        { title: "Version", width: 15, cell: (r) => r.version || "—" },
        {
          title: "Components",
          width: 20,
          cell: (r) => <Labels items={r.components} />,
        },
        {
          title: "Architectures",
          width: 20,
          cell: (r) => <Labels items={r.architectures} />,
        },
      ]}
    />
  );
};

const DEB_PACKAGES_LIST = defineBrowseListState({
  sort: {
    columnKeys: ["package", "version", "architecture"],
    defaultValue: { sortBy: "package", direction: "asc" },
  },
  filters: [
    { param: "package__icontains", label: "Package" },
    {
      param: "architecture",
      label: "Architecture",
      placeholder: "Exact architecture",
    },
  ],
});

export const DebPackages: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(DEB_PACKAGES_LIST);
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
      count={data?.count}
      isLoading={isLoading}
      error={error}
      emptyTitle="No packages"
      rowHref={(pkg) => pkg.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Package",
          sort: list.sortProps("package"),
          width: 25,
          cell: (p) => p.package,
        },
        {
          title: "Version",
          sort: list.sortProps("version"),
          width: 15,
          cell: (p) => p.version,
        },
        {
          title: "Architecture",
          sort: list.sortProps("architecture"),
          width: 15,
          cell: (p) => p.architecture,
        },
        { title: "Section", width: 10, cell: (p) => p.section || "—" },
        { title: "Priority", width: 10, cell: (p) => p.priority || "—" },
        {
          title: "Maintainer",
          isTruncated: true,
          width: 25,
          cell: (p) => p.maintainer || "—",
        },
      ]}
    />
  );
};

const DEB_SOURCE_PACKAGES_LIST = defineBrowseListState({
  sort: {
    columnKeys: ["source", "version"],
    defaultValue: { sortBy: "source", direction: "asc" },
  },
  filters: [
    { param: "source", label: "Source", placeholder: "Exact source name" },
  ],
});

/** Launchpad-style source packages with the binaries built from them. */
export const DebSourcePackages: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(DEB_SOURCE_PACKAGES_LIST);
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
      count={data?.count}
      isLoading={isLoading}
      error={error}
      emptyTitle="No source packages"
      rowHref={(source) => source.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Source",
          sort: list.sortProps("source"),
          width: 25,
          cell: (s) => s.source,
        },
        {
          title: "Version",
          sort: list.sortProps("version"),
          width: 15,
          cell: (s) => s.version,
        },
        { title: "Format", width: 10, cell: (s) => s.format || "—" },
        {
          title: "Binaries",
          width: 25,
          isTruncated: true,
          cell: (s) => s.binary || "—",
        },
        {
          title: "Maintainer",
          isTruncated: true,
          width: 25,
          cell: (s) => s.maintainer || "—",
        },
      ]}
    />
  );
};
