import type React from "react";

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
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { resolvePulpType } from "@app/queries/utils/pulpHref";

interface IRemoteRepositoriesTabProps {
  remoteHref: string;
}

export const RemoteRepositoriesTab: React.FC<IRemoteRepositoriesTabProps> = ({
  remoteHref,
}) => {
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data, isLoading, error } = useRepositoriesListQuery({
    params: {
      remote: remoteHref,
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });

  const repositories = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name" },
    { cell: "Type" },
    { cell: "Description" },
  ];

  const rows: DataViewTr[] = repositories.map((repository) => {
    const pulpType = resolvePulpType(repository.pulp_href);
    return {
      id: repository.pulp_href,
      row: [
        {
          cell: (
            <ResourceHrefLink
              kind="repository"
              href={repository.pulp_href}
              label={repository.name}
            />
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: repository.description || "—",
          props: { dataLabel: "Description", modifier: "truncate" },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: repositories.length === 0,
    emptyState: <TableEmptyState title="No repositories use this remote" />,
  });

  return (
    <DataView activeState={activeState}>
      <DataViewTable
        aria-label="Remote repositories table"
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
