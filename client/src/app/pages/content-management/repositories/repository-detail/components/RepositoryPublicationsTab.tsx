import type React from "react";

import { Label, PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { usePublicationsListQuery } from "@app/queries/publications";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { PAGINATION_STATE } from "@app/utils/listState";
import { formatDateTime } from "@app/utils/utils";

interface IRepositoryPublicationsTabProps {
  repositoryHref: string;
}

export const RepositoryPublicationsTab: React.FC<
  IRepositoryPublicationsTabProps
> = ({ repositoryHref }) => {
  const [pagination, setPagination] = usePersistentState({
    ...PAGINATION_STATE,
    storage: "url",
  });
  const { data, isLoading, error } = usePublicationsListQuery({
    params: {
      repository: repositoryHref,
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering: "-pulp_created",
    },
  });

  const publications = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Publication", props: { width: 30 } },
    { cell: "Type", props: { width: 15 } },
    { cell: "Repository Version", props: { width: 35 } },
    { cell: "Created", props: { width: 20 } },
  ];

  const rows: DataViewTr[] = publications.map((pub) => {
    const pubId = pub.pulp_href ? extractIdFromHref(pub.pulp_href) : "";
    const pulpType = resolvePulpType(pub.pulp_href);
    return {
      id: pub.pulp_href,
      row: [
        {
          cell: pub.pulp_href ? `Publication ${pubId}` : "—",
          props: { dataLabel: "Publication" },
        },
        {
          cell: pulpType ? <Label color="blue">{pulpType}</Label> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: (
            <ResourceHrefLink
              kind="repositoryVersion"
              href={pub.repository_version}
            />
          ),
          props: { dataLabel: "Repository Version", modifier: "truncate" },
        },
        {
          cell: formatDateTime(pub.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: publications.length === 0,
    emptyState: <TableEmptyState title="No publications for this repository" />,
  });

  return (
    <DataView activeState={activeState}>
      <DataViewTable
        aria-label="Repository publications table"
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
