import type React from "react";

import { Link } from "@tanstack/react-router";

import { PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import {
  dataViewBodyStates,
  ListPagination,
  type DataViewTh,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useRepositoryVersionsListQuery } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { summaryTotal } from "@app/utils/contentSummary";
import { formatDateTime } from "@app/utils/utils";

interface IRepositoryVersionsTabProps {
  repositoryHref: string;
  id: string;
  pulpType: string;
  pulpDomain: string;
}

export const RepositoryVersionsTab: React.FC<IRepositoryVersionsTabProps> = ({
  repositoryHref,
  id,
  pulpType,
  pulpDomain,
}) => {
  const pagination = useDataViewPagination({ perPage: 10 });
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
    { cell: "Version" },
    { cell: "Content" },
    { cell: "Added" },
    { cell: "Removed" },
    { cell: "Created" },
  ];

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
          />
        }
      />
    </DataView>
  );
};
