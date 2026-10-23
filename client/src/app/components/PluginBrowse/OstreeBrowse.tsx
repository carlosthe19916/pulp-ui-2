import type React from "react";

import { Snippet } from "@app/components/Snippet";
import { useContentTypeListQuery } from "@app/queries/content";

import { BrowseTable } from "./BrowseTable";
import type { IBrowseContext } from "./types";
import { useBrowseListState } from "./useBrowseListState";

/** `ostree refs` style: branches and the commit each points at; history opens in the drawer. */
export const OstreeBranches: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["name"] as const,
      initial: { sortBy: "name", direction: "asc" },
    },
    filters: [{ param: "name__icontains", label: "Branch" }] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "ostree.refs",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "name", "checksum"],
    },
  });
  const { baseUrl } = served;

  return (
    <BrowseTable
      ariaLabel="Branches"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No branches"
      header={
        baseUrl ? (
          <Snippet code={`ostree remote add <name> ${baseUrl}`} />
        ) : undefined
      }
      rowHref={(ref) => ref.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Branch",
          sort: list.sortProps("name"),
          width: 50,
          cell: (ref) => ref.name,
        },
        { title: "Commit", isTruncated: true, cell: (ref) => ref.checksum },
      ]}
    />
  );
};
