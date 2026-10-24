import type React from "react";

import prettyBytes from "pretty-bytes";

import { Snippet } from "@app/components/Snippet";
import {
  useContentTypeAllQuery,
  useContentTypeListQuery,
} from "@app/queries/content";

import { normalizeProjectName, pipInstall } from "./browseHelpers";
import { BrowseTable } from "./BrowseTable";
import type { IBrowseContext } from "./browseTypes";
import { StatusBadges } from "./StatusBadges";
import { useBrowseListState } from "./useBrowseListState";

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
  const yanks = useContentTypeAllQuery({
    pulpType: "python.python_yank",
    params: {
      repository_version: versionHref,
      fields: ["name_normalized", "version"],
    },
  });
  const yanked = new Set(
    yanks.data?.results.map((y) => `${y.name_normalized}@${y.version}`),
  );
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
        { title: "Version", cell: (p) => p.version },
        {
          title: "File",
          isTruncated: true,
          width: 35,
          cell: (p) => p.filename,
        },
        { title: "Type", cell: (p) => p.packagetype || "—" },
        { title: "Requires Python", cell: (p) => p.requires_python || "—" },
        { title: "Size", cell: (p) => (p.size ? prettyBytes(p.size) : "—") },
        {
          title: "Status",
          cell: (p) => (
            <StatusBadges
              statuses={[
                yanked.has(
                  `${normalizeProjectName(p.name ?? "")}@${p.version}`,
                ) && "yanked",
                attested.has(p.pulp_href ?? "") && "attested",
              ]}
            />
          ),
        },
      ]}
    />
  );
};
