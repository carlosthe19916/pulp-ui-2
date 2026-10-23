import type React from "react";

import { Snippet } from "@app/components/Snippet";
import { useContentTypeListQuery } from "@app/queries/content";

import { gemInstall } from "./helpers";
import { BrowseTable } from "./BrowseTable";
import { StatusBadges } from "./StatusBadges";
import type { IBrowseContext } from "./types";
import { useBrowseListState } from "./useBrowseListState";

/** rubygems.org style: each gem with its versions and platforms, newest first. */
export const GemGems: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    filters: [
      { param: "name", label: "Gem", placeholder: "Exact gem name" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "gem.gem",
    // No `fields`: pulp_gem's list answers 500 to any field selection.
    params: {
      ...list.params,
      repository_version: versionHref,
      ordering: ["name", "-version"],
    },
  });
  const { baseUrl } = served;

  return (
    <BrowseTable
      ariaLabel="Gems"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No gems"
      header={baseUrl ? <Snippet code={gemInstall(baseUrl)} /> : undefined}
      groupBy={(g) => g.name ?? ""}
      rowHref={(g) => g.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "Gem", width: 25, cell: (g) => g.name },
        { title: "Version", cell: (g) => g.version },
        { title: "Platform", cell: (g) => g.platform || "—" },
        { title: "Requires Ruby", cell: (g) => g.required_ruby_version || "—" },
        {
          title: "Status",
          cell: (g) => (
            <StatusBadges statuses={[!!g.prerelease && "prerelease"]} />
          ),
        },
      ]}
    />
  );
};
