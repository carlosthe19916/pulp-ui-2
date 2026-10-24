import type React from "react";

import { PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import { ContentUrlLink } from "@app/components/ContentUrlLink";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";

interface IRepositoryDistributionsTabProps {
  repositoryHref: string;
}

export const RepositoryDistributionsTab: React.FC<
  IRepositoryDistributionsTabProps
> = ({ repositoryHref }) => {
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data, isLoading, error } = useDistributionsListQuery({
    params: {
      repository: repositoryHref,
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });

  const distributions = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name" },
    { cell: "Base Path" },
    { cell: "Base URL" },
    { cell: "Type" },
  ];

  const rows: DataViewTr[] = distributions.map((distribution) => {
    const pulpType = resolvePulpType(distribution.pulp_href);
    return {
      id: distribution.pulp_href,
      row: [
        {
          cell: distribution.name || "—",
          props: { dataLabel: "Name" },
        },
        {
          cell: distribution.base_path || "—",
          props: { dataLabel: "Base Path", modifier: "truncate" },
        },
        {
          cell: <ContentUrlLink distribution={distribution} />,
          props: { dataLabel: "Base URL", modifier: "truncate" },
        },
        {
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
          props: { dataLabel: "Type" },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: distributions.length === 0,
    emptyState: (
      <TableEmptyState title="No distributions for this repository" />
    ),
  });

  return (
    <DataView activeState={activeState}>
      <DataViewTable
        aria-label="Repository distributions table"
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
