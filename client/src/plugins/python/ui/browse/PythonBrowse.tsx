import type React from "react";

import prettyBytes from "pretty-bytes";

import {
  BrowseTable,
  StatusBadges,
  useBrowseListState,
} from "@app/components/BrowseShell";
import { Snippet } from "@app/components/Snippet";
import { useContentTypeListQuery } from "@app/queries/content";
import type { IBrowseContext } from "@plugin-sdk/ui";

import { pipInstall } from "../helpers";

/** PyPI style: each project's files grouped under it, newest release first. */
export const PythonPackages: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    filters: [{ param: "name__contains", label: "Project" }] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "python.python",
    params: {
      ...list.params,
      repository_version: versionHref,
      ordering: ["name", "-version"],
      fields: [
        "pulp_href",
        "name",
        "version",
        "filename",
        "packagetype",
        "requires_python",
        "size",
      ],
    },
  });
  const hrefs = (data?.results ?? []).map((p) => p.pulp_href ?? "");
  const provenance = useContentTypeListQuery({
    pulpType: "python.provenance",
    params: { package__in: hrefs, limit: hrefs.length, fields: ["package"] },
    options: { enabled: hrefs.length > 0 },
  });
  const attested = new Set(provenance.data?.results.map((p) => p.package));
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
      header={baseUrl ? <Snippet code={pipInstall(baseUrl)} /> : undefined}
      groupBy={(p) => p.name ?? ""}
      rowHref={(p) => p.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "Project", width: 20, cell: (p) => p.name },
        { title: "Version", width: 10, cell: (p) => p.version },
        {
          title: "File",
          isTruncated: true,
          width: 30,
          cell: (p) => p.filename,
        },
        { title: "Type", width: 10, cell: (p) => p.packagetype || "—" },
        {
          title: "Requires Python",
          width: 10,
          cell: (p) => p.requires_python || "—",
        },
        {
          title: "Size",
          width: 10,
          cell: (p) => (p.size ? prettyBytes(p.size) : "—"),
        },
        {
          title: "Status",
          width: 10,
          cell: (p) => (
            <StatusBadges
              statuses={[attested.has(p.pulp_href ?? "") && "attested"]}
            />
          ),
        },
      ]}
    />
  );
};

/**
 * Yanked releases (PEP 592). A yank names a release only by project and version, and the
 * endpoint can't filter by either, so it is listed here rather than as a badge.
 */
export const PythonYanks: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState();
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "python.python_yank",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "name_normalized", "version", "yanked_reason"],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Yanked releases"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No yanked releases"
      rowHref={(yank) => yank.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "Project", width: 30, cell: (y) => y.name_normalized },
        { title: "Version", width: 20, cell: (y) => y.version },
        {
          title: "Reason",
          isTruncated: true,
          width: 50,
          cell: (y) => y.yanked_reason || "—",
        },
      ]}
    />
  );
};
