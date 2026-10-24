import type React from "react";

import prettyBytes from "pretty-bytes";

import type { RepoTypeEnum } from "@app/client";
import { useContentTypeListQuery } from "@app/queries/content";
import { formatDateTime } from "@app/utils/utils";

import { BrowseTable } from "./BrowseTable";
import type { IBrowseContext } from "./browseTypes";
import { useBrowseListState } from "./useBrowseListState";

/** Hub "Files and versions" for one repo type: each repo's files under it. */
const RepoTypeFiles: React.FC<IBrowseContext & { repoType: RepoTypeEnum }> = ({
  repoType,
  versionHref,
  selectedHref,
  onSelect,
  writes,
}) => {
  const list = useBrowseListState({
    sort: {
      keys: ["repo_id", "relative_path", "size", "last_modified"] as const,
      initial: { sortBy: "repo_id", direction: "asc" },
    },
    filters: [
      {
        param: "repo_id",
        label: "Repository",
        placeholder: "Exact repo id, e.g. org/model",
      },
      { param: "revision", label: "Revision", placeholder: "Exact revision" },
    ] as const,
  });
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "hugging_face.hugging-face",
    params: {
      ...list.params,
      repository_version: versionHref,
      repo_type: repoType,
    },
  });

  return (
    <BrowseTable
      ariaLabel={`Hugging Face ${repoType}`}
      list={list}
      rows={data?.results ?? []}
      count={data?.count ?? 0}
      isLoading={isLoading}
      error={error}
      emptyTitle={`No ${repoType}`}
      groupBy={(file) => file.repo_id}
      rowHref={(file) => file.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Repository",
          sort: list.sortProps("repo_id"),
          width: 25,
          cell: (f) => f.repo_id,
        },
        {
          title: "Revision",
          isTruncated: true,
          cell: (f) => f.revision || "—",
        },
        {
          title: "File",
          sort: list.sortProps("relative_path"),
          isTruncated: true,
          width: 35,
          cell: (f) => f.relative_path,
        },
        {
          title: "Size",
          sort: list.sortProps("size"),
          cell: (f) => (f.size ? prettyBytes(f.size) : "—"),
        },
        {
          title: "Modified",
          sort: list.sortProps("last_modified"),
          cell: (f) => formatDateTime(f.last_modified) ?? "—",
        },
      ]}
    />
  );
};

export const HuggingFaceModels: React.FC<IBrowseContext> = (context) => (
  <RepoTypeFiles {...context} repoType="models" />
);

export const HuggingFaceDatasets: React.FC<IBrowseContext> = (context) => (
  <RepoTypeFiles {...context} repoType="datasets" />
);

export const HuggingFaceSpaces: React.FC<IBrowseContext> = (context) => (
  <RepoTypeFiles {...context} repoType="spaces" />
);
