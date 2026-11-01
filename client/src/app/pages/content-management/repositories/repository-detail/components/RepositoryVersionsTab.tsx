import type React from "react";

import { Link } from "@tanstack/react-router";

import { PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { RepositoryVersionResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import type { VersionAction } from "@app/components/VersionActionModal";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useRepositoryVersionsListQuery } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { summaryTotal } from "@app/utils/contentSummary";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { PAGINATION_STATE } from "@app/utils/listState";
import { formatDateTime } from "@app/utils/utils";

interface IRepositoryVersionsTabProps {
  repositoryHref: string;
  id: string;
  pulpType: string;
  pulpDomain: string;
  /** Row actions; absent hides the kebab. */
  onVersionAction?: (request: {
    action: VersionAction;
    version: RepositoryVersionResponse;
  }) => void;
  latestHref?: string;
  canRestore?: boolean;
  /** Per-action disabled props (lock, permissions), merged into each row item. */
  actionProps?: (action: VersionAction) => object;
}

export const RepositoryVersionsTab: React.FC<IRepositoryVersionsTabProps> = ({
  repositoryHref,
  id,
  pulpType,
  pulpDomain,
  onVersionAction,
  latestHref,
  canRestore,
  actionProps,
}) => {
  const [pagination, setPagination] = usePersistentState({
    ...PAGINATION_STATE,
    storage: "url",
  });
  const { data, isLoading, error } = useRepositoryVersionsListQuery({
    repositoryHref,
    params: {
      ordering: "-number",
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });

  const versions = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Version", props: { width: 15 } },
    { cell: "Content", props: { width: 25 } },
    { cell: "Added", props: { width: 20 } },
    { cell: "Removed", props: { width: 20 } },
    { cell: "Created", props: { width: 20 } },
    ...(onVersionAction
      ? [{ cell: "", props: { screenReaderText: "Actions" } }]
      : []),
  ];

  const actionsFor = (version: RepositoryVersionResponse) => {
    const item = ({
      action,
      title,
    }: {
      action: VersionAction;
      title: string;
    }) => ({
      title,
      onClick: () => onVersionAction?.({ action, version }),
      ...actionProps?.(action),
    });
    const items = [];
    if (canRestore && version.pulp_href !== latestHref) {
      items.push(item({ action: "restore", title: "Restore as latest" }));
    }
    items.push(item({ action: "repair", title: "Repair" }));
    if (version.number !== 0) {
      items.push(item({ action: "delete", title: "Delete version" }));
    }
    return items;
  };

  const rows: DataViewTr[] = versions.map((version) => {
    const number = String(
      version.number ?? extractIdFromHref(version.pulp_href ?? ""),
    );
    return {
      id: version.pulp_href,
      row: [
        {
          cell: (
            <Link
              to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber"
              params={{
                pulpDomain,
                repositoryType: pulpType,
                repositoryId: id,
                versionNumber: number,
              }}
            >
              Version {number}
            </Link>
          ),
          props: { dataLabel: "Version" },
        },
        {
          cell: summaryTotal(version.content_summary?.present),
          props: { dataLabel: "Content" },
        },
        {
          cell: summaryTotal(version.content_summary?.added),
          props: { dataLabel: "Added" },
        },
        {
          cell: summaryTotal(version.content_summary?.removed),
          props: { dataLabel: "Removed" },
        },
        {
          cell: formatDateTime(version.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
        ...(onVersionAction
          ? [
              {
                cell: <ActionsColumn items={actionsFor(version)} />,
                props: { isActionCell: true },
              },
            ]
          : []),
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: versions.length === 0,
    emptyState: <TableEmptyState title="No versions found" />,
  });

  return (
    <DataView activeState={activeState}>
      <DataViewTable
        aria-label="Repository versions table"
        columns={columns}
        rows={rows}
        bodyStates={bodyStates}
      />
      <DataViewToolbar
        pagination={
          <ListPagination
            variant={PaginationVariant.bottom}
            itemCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        }
      />
    </DataView>
  );
};
