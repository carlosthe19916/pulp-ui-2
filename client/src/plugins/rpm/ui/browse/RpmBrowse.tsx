import type React from "react";

import prettyBytes from "pretty-bytes";

import { Label } from "@patternfly/react-core";

import {
  BrowseTable,
  defineBrowseListState,
  useBrowseListState,
} from "@app/components/BrowseShell";
import { Snippet } from "@app/components/Snippet";
import { useContentTypeListQuery } from "@app/queries/content";
import { nevra } from "@app/utils/pluginContentFormat";
import { formatDateTime } from "@app/utils/utils";
import type { IBrowseContext } from "@plugin-sdk/ui";

import { severityColor } from "./helpers";

const RPM_PACKAGES_LIST = defineBrowseListState({
  sort: {
    columnKeys: ["name", "arch"],
    defaultValue: { sortBy: "name", direction: "asc" },
  },
  filters: [
    { param: "name__contains", label: "Name" },
    { param: "arch", label: "Arch", placeholder: "Exact arch, e.g. x86_64" },
  ],
});

export const RpmPackages: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(RPM_PACKAGES_LIST);
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
      count={data?.count}
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
      writes={writes}
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
          width: 35,
          cell: (pkg) => pkg.summary || "—",
        },
        {
          title: "Arch",
          sort: list.sortProps("arch"),
          width: 15,
          cell: (pkg) => pkg.arch,
        },
        {
          title: "Size",
          width: 15,
          cell: (pkg) =>
            pkg.size_package ? prettyBytes(pkg.size_package) : "—",
        },
      ]}
    />
  );
};

const RPM_ADVISORIES_LIST = defineBrowseListState({
  sort: {
    columnKeys: ["id", "issued_date", "severity", "type"],
    defaultValue: { sortBy: "issued_date", direction: "desc" },
  },
  filters: [
    { param: "id", label: "ID", placeholder: "Exact ID" },
    {
      param: "type",
      label: "Type",
      placeholder: "security, bugfix, enhancement",
    },
    { param: "severity", label: "Severity", placeholder: "Exact severity" },
  ],
});

/** Satellite "Errata": newest first, with type and severity. */
export const RpmAdvisories: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(RPM_ADVISORIES_LIST);
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
      count={data?.count}
      isLoading={isLoading}
      error={error}
      emptyTitle="No advisories"
      rowHref={(advisory) => advisory.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
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
          width: 15,
          cell: (a) => a.type || "—",
        },
        {
          title: "Severity",
          sort: list.sortProps("severity"),
          width: 15,
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
          width: 15,
          cell: (a) => formatDateTime(a.issued_date) ?? "—",
        },
      ]}
    />
  );
};

const RPM_MODULE_STREAMS_LIST = defineBrowseListState({
  sort: {
    columnKeys: ["name", "version"],
    defaultValue: { sortBy: "name", direction: "asc" },
  },
  filters: [
    { param: "name", label: "Module", placeholder: "Exact module name" },
  ],
});

export const RpmModuleStreams: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(RPM_MODULE_STREAMS_LIST);
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "rpm.modulemd",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "name", "stream", "version", "context", "arch"],
    },
  });
  // A version holds at most one defaults unit per module, so one per page module.
  const pageModules = [...new Set((data?.results ?? []).map((m) => m.name))];
  const defaults = useContentTypeListQuery({
    pulpType: "rpm.modulemd_defaults",
    params: {
      repository_version: versionHref,
      module__in: pageModules,
      limit: pageModules.length,
      fields: ["module", "stream"],
    },
    options: { enabled: pageModules.length > 0 },
  });
  const defaultStream = new Map(
    defaults.data?.results.map((d) => [d.module, d.stream]),
  );

  return (
    <BrowseTable
      ariaLabel="Module streams"
      list={list}
      rows={data?.results ?? []}
      count={data?.count}
      isLoading={isLoading}
      error={error}
      emptyTitle="No module streams"
      rowHref={(module) => module.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Module stream",
          sort: list.sortProps("name"),
          width: 40,
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
          width: 20,
          cell: (m) => m.version,
        },
        { title: "Context", width: 20, cell: (m) => m.context },
        { title: "Arch", width: 20, cell: (m) => m.arch },
      ]}
    />
  );
};

const RPM_PACKAGE_GROUPS_LIST = defineBrowseListState();

/** Comps groups (`dnf group list`); environments and categories stay in All content. */
export const RpmPackageGroups: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(RPM_PACKAGE_GROUPS_LIST);
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
      count={data?.count}
      isLoading={isLoading}
      error={error}
      emptyTitle="No package groups"
      rowHref={(group) => group.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "ID", width: 20, cell: (g) => g.id },
        { title: "Name", width: 25, cell: (g) => g.name || "—" },
        {
          title: "Packages",
          width: 10,
          cell: (g) => (Array.isArray(g.packages) ? g.packages.length : "—"),
        },
        {
          title: "Description",
          isTruncated: true,
          width: 45,
          cell: (g) => g.description || "—",
        },
      ]}
    />
  );
};
