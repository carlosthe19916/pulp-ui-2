import type React from "react";

import prettyBytes from "pretty-bytes";

import { Label } from "@patternfly/react-core";

import { Snippet } from "@app/components/Snippet";
import {
  useContentTypeAllQuery,
  useContentTypeListQuery,
} from "@app/queries/content";
import { formatDateTime } from "@app/utils/utils";

import { nevra, severityColor } from "./helpers";
import { BrowseTable } from "./BrowseTable";
import type { IBrowseContext } from "./types";
import { useBrowseListState } from "./useBrowseListState";

export const RpmPackages: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["name", "arch"] as const,
      initial: { sortBy: "name", direction: "asc" },
    },
    filters: [
      { param: "name__contains", label: "Name" },
      { param: "arch", label: "Arch", placeholder: "Exact arch, e.g. x86_64" },
    ] as const,
  });
  // Package rows carry files and changelogs; list only what the table shows.
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "rpm.package",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: [
        "pulp_href",
        "name",
        "epoch",
        "version",
        "release",
        "arch",
        "summary",
        "size_package",
      ],
    },
  });
  const { baseUrl } = served;

  return (
    <BrowseTable
      ariaLabel="Packages"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No packages"
      header={
        baseUrl ? (
          <Snippet
            code={`dnf install --repofrompath=repo,${baseUrl} <package>`}
          />
        ) : undefined
      }
      rowHref={(pkg) => pkg.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      columns={[
        {
          title: "Package",
          sort: list.sortProps("name"),
          width: 35,
          cell: nevra,
        },
        {
          title: "Summary",
          isTruncated: true,
          cell: (pkg) => pkg.summary || "—",
        },
        {
          title: "Arch",
          sort: list.sortProps("arch"),
          cell: (pkg) => pkg.arch,
        },
        {
          title: "Size",
          cell: (pkg) =>
            pkg.size_package ? prettyBytes(pkg.size_package) : "—",
        },
      ]}
    />
  );
};

/** Satellite "Errata": newest first, with type and severity. */
export const RpmAdvisories: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["id", "issued_date", "severity", "type"] as const,
      initial: { sortBy: "issued_date", direction: "desc" },
    },
    filters: [
      { param: "id", label: "ID", placeholder: "Exact ID" },
      {
        param: "type",
        label: "Type",
        placeholder: "security, bugfix, enhancement",
      },
      { param: "severity", label: "Severity", placeholder: "Exact severity" },
    ] as const,
  });
  // `pkglist` and `description` can be large; the drawer loads the full advisory.
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "rpm.advisory",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "id", "title", "type", "severity", "issued_date"],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Advisories"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No advisories"
      rowHref={(advisory) => advisory.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      columns={[
        {
          title: "ID",
          sort: list.sortProps("id"),
          width: 20,
          cell: (a) => a.id,
        },
        {
          title: "Type",
          sort: list.sortProps("type"),
          cell: (a) => a.type || "—",
        },
        {
          title: "Severity",
          sort: list.sortProps("severity"),
          cell: (a) =>
            a.severity ? (
              <Label isCompact color={severityColor(a.severity)}>
                {a.severity}
              </Label>
            ) : (
              "—"
            ),
        },
        {
          title: "Title",
          isTruncated: true,
          width: 35,
          cell: (a) => a.title || "—",
        },
        {
          title: "Issued",
          sort: list.sortProps("issued_date"),
          cell: (a) => formatDateTime(a.issued_date) ?? "—",
        },
      ]}
    />
  );
};

export const RpmModuleStreams: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["name", "version"] as const,
      initial: { sortBy: "name", direction: "asc" },
    },
    filters: [
      { param: "name", label: "Module", placeholder: "Exact module name" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "rpm.modulemd",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "name", "stream", "version", "context", "arch"],
    },
  });
  const defaults = useContentTypeAllQuery({
    pulpType: "rpm.modulemd_defaults",
    params: { repository_version: versionHref, fields: ["module", "stream"] },
  });
  const defaultStream = new Map(
    defaults.data?.results.map((d) => [d.module, d.stream]),
  );

  return (
    <BrowseTable
      ariaLabel="Module streams"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No module streams"
      rowHref={(module) => module.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      columns={[
        {
          title: "Module stream",
          sort: list.sortProps("name"),
          cell: (m) => (
            <>
              {m.name}:{m.stream}{" "}
              {defaultStream.get(m.name) === m.stream ? (
                <Label isCompact color="blue">
                  default
                </Label>
              ) : null}
            </>
          ),
        },
        {
          title: "Version",
          sort: list.sortProps("version"),
          cell: (m) => m.version,
        },
        { title: "Context", cell: (m) => m.context },
        { title: "Arch", cell: (m) => m.arch },
      ]}
    />
  );
};

/** Comps groups (`dnf group list`); environments and categories stay in All content. */
export const RpmPackageGroups: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
}) => {
  const list = useBrowseListState();
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "rpm.packagegroup",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: [
        "pulp_href",
        "id",
        "name",
        "description",
        "packages",
        "user_visible",
      ],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Package groups"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No package groups"
      rowHref={(group) => group.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      columns={[
        { title: "ID", cell: (g) => g.id },
        { title: "Name", cell: (g) => g.name || "—" },
        {
          title: "Packages",
          cell: (g) => (Array.isArray(g.packages) ? g.packages.length : "—"),
        },
        {
          title: "Description",
          isTruncated: true,
          cell: (g) => g.description || "—",
        },
      ]}
    />
  );
};
