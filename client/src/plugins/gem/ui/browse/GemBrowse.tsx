import type React from "react";

import {
  BrowseTable,
  defineBrowseListState,
  StatusBadges,
  useBrowseListState,
} from "@app/components/BrowseShell";
import { Snippet } from "@app/components/Snippet";
import { useContentTypeListQuery } from "@app/queries/content";
import type { IBrowseContext } from "@plugin-sdk/ui";

import { gemInstall } from "../helpers";

const GEM_GEMS_LIST = defineBrowseListState({
  filters: [{ param: "name", label: "Gem", placeholder: "Exact gem name" }],
});

/** rubygems.org style: each gem with its versions and platforms, newest first. */
export const GemGems: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(GEM_GEMS_LIST);
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
        { title: "Version", width: 15, cell: (g) => g.version },
        { title: "Platform", width: 20, cell: (g) => g.platform || "—" },
        {
          title: "Requires Ruby",
          width: 20,
          cell: (g) => g.required_ruby_version || "—",
        },
        {
          title: "Status",
          width: 20,
          cell: (g) => (
            <StatusBadges statuses={[!!g.prerelease && "prerelease"]} />
          ),
        },
      ]}
    />
  );
};
