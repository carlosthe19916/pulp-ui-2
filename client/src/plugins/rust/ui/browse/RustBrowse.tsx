import type React from "react";

import {
  BrowseTable,
  defineBrowseListState,
  useBrowseListState,
} from "@app/components/BrowseShell";
import { useContentTypeListQuery } from "@app/queries/content";
import type { IBrowseContext } from "@plugin-sdk/ui";

const RUST_CRATES_LIST = defineBrowseListState({
  filters: [{ param: "name", label: "Crate", placeholder: "Exact crate name" }],
});

/** crates.io style: each crate with its versions. Pulp orders `vers` as text, not semver. */
export const RustCrates: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(RUST_CRATES_LIST);
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "rust.rust",
    params: {
      ...list.params,
      repository_version: versionHref,
      ordering: ["name", "-vers"],
      fields: ["pulp_href", "name", "vers", "rust_version", "cksum"],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Crates"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No crates"
      groupBy={(c) => c.name}
      rowHref={(c) => c.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "Crate", width: 30, cell: (c) => c.name },
        { title: "Version", width: 20, cell: (c) => c.vers },
        {
          title: "Rust version",
          width: 15,
          cell: (c) => c.rust_version || "—",
        },
        {
          title: "Checksum",
          isTruncated: true,
          width: 35,
          cell: (c) => c.cksum,
        },
      ]}
    />
  );
};

const RUST_YANKS_LIST = defineBrowseListState();

/** Yanked versions: a yank names a crate version only, in this repository. */
export const RustYanks: React.FC<IBrowseContext> = ({
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState(RUST_YANKS_LIST);
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "rust.rust_yank",
    params: {
      ...list.params,
      repository_version: versionHref,
      fields: ["pulp_href", "name", "vers"],
    },
  });

  return (
    <BrowseTable
      ariaLabel="Yanked versions"
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle="No yanked versions"
      rowHref={(y) => y.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        { title: "Crate", width: 60, cell: (y) => y.name },
        { title: "Version", width: 40, cell: (y) => y.vers },
      ]}
    />
  );
};
