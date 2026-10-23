import type React from "react";

import { Snippet } from "@app/components/Snippet";
import { useContentTypeListQuery } from "@app/queries/content";

import { npmInstall } from "./helpers";
import { BrowseTable } from "./BrowseTable";
import type { IBrowseContext } from "./types";
import { useBrowseListState } from "./useBrowseListState";

/** npmjs style: each package with its versions, newest first. */
export const NpmPackages: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    filters: [
      { param: "name", label: "Package", placeholder: "Exact package name" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "npm.package",
    params: {
      ...list.params,
      repository_version: versionHref,
      ordering: ["name", "-version"],
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
      header={baseUrl ? <Snippet code={npmInstall(baseUrl)} /> : undefined}
      groupBy={(p) => p.name ?? ""}
      rowHref={(p) => p.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "Package", width: 30, cell: (p) => p.name },
        { title: "Version", cell: (p) => p.version },
        { title: "Tarball", isTruncated: true, cell: (p) => p.relative_path },
      ]}
    />
  );
};
