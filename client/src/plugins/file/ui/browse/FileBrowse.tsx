import type React from "react";
import { useState } from "react";

import { Button, Flex, FlexItem } from "@patternfly/react-core";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";

import {
  BrowseTable,
  defineBrowseListState,
  PathBreadcrumb,
  pathSegments,
  useBrowseListState,
} from "@app/components/BrowseShell";
import { useContentTypeListQuery } from "@app/queries/content";
import type { IBrowseContext } from "@plugin-sdk/ui";

interface IPathCellProps {
  path: string;
  prefix: string;
  onNavigate: (prefix: string) => void;
}

/** A file's path below the current folder, with each sub-folder clickable. */
const PathCell: React.FC<IPathCellProps> = ({ path, prefix, onNavigate }) => {
  const segments = pathSegments(path.slice(prefix.length));
  return (
    <Flex
      spaceItems={{ default: "spaceItemsXs" }}
      flexWrap={{ default: "wrap" }}
    >
      {segments.map((segment, index) =>
        index < segments.length - 1 ? (
          <FlexItem key={segments.slice(0, index + 1).join("/")}>
            <Button
              variant="link"
              isInline
              onClick={(event) => {
                event.stopPropagation();
                onNavigate(
                  `${prefix}${segments.slice(0, index + 1).join("/")}/`,
                );
              }}
            >
              {segment}
            </Button>
            /
          </FlexItem>
        ) : (
          <FlexItem key={segments.slice(0, index + 1).join("/")}>
            {segment}
          </FlexItem>
        ),
      )}
    </Flex>
  );
};

const FILE_FILES_LIST = defineBrowseListState({
  sort: {
    columnKeys: ["relative_path"],
    defaultValue: { sortBy: "relative_path", direction: "asc" },
  },
  filters: [
    {
      param: "relative_path__icontains",
      label: "Path",
      placeholder: "Filter by path",
    },
  ],
});

/** S3-console style: files under a path prefix, folders navigable via the breadcrumb. */
export const FileFiles: React.FC<IBrowseContext> = ({
  versionHref,
  served,
  selectedHref,
  onSelect,
  writes,
}) => {
  const [prefix, setPrefix] = useState("");
  const list = useBrowseListState(FILE_FILES_LIST);
  const { data, isLoading, error } = useContentTypeListQuery({
    pulpType: "file.file",
    params: {
      ...list.params,
      repository_version: versionHref,
      relative_path__startswith: prefix || undefined,
      fields: ["pulp_href", "relative_path", "sha256"],
    },
  });
  const { baseUrl } = served;

  const navigate = (next: string) => {
    setPrefix(next);
    list.toFirstPage();
  };

  return (
    <BrowseTable
      ariaLabel="Files"
      list={list}
      rows={data?.results ?? []}
      count={data?.count}
      isLoading={isLoading}
      error={error}
      header={
        <PathBreadcrumb
          rootLabel="All files"
          prefix={prefix}
          onNavigate={navigate}
        />
      }
      emptyTitle="No files"
      rowHref={(file) => file.pulp_href}
      selectedHref={selectedHref}
      onSelect={onSelect}
      writes={writes}
      columns={[
        {
          title: "Path",
          sort: list.sortProps("relative_path"),
          width: 60,
          cell: (file) => (
            <PathCell
              path={file.relative_path}
              prefix={prefix}
              onNavigate={navigate}
            />
          ),
        },
        {
          title: "SHA256",
          isTruncated: true,
          width: 40,
          cell: (file) => file.sha256 ?? "—",
        },
        {
          title: "",
          screenReaderText: "Download",
          cell: (file) =>
            baseUrl ? (
              <Button
                component="a"
                variant="plain"
                aria-label={`Download ${file.relative_path}`}
                href={`${baseUrl}${file.relative_path}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event: React.MouseEvent) => event.stopPropagation()}
                icon={<DownloadIcon />}
              />
            ) : null,
        },
      ]}
    />
  );
};
