import type React from "react";
import { Link } from "@tanstack/react-router";

import { Pagination, PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
} from "@patternfly/react-data-view";

import type { DistributionResponse } from "@app/client";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

type DistributionRow = DistributionResponse & {
  publication?: string | null;
  repository?: string | null;
};

const COLUMN_KEYS = ["name", "base_path", "publication"] as const;
type DistributionColumnKey = (typeof COLUMN_KEYS)[number];

interface IDistributionFilters {
  name: string;
}

interface IRepositoryDistributionsTabProps {
  repoHref: string;
}

export const RepositoryDistributionsTab: React.FC<
  IRepositoryDistributionsTabProps
> = ({ repoHref }) => {
  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDistributionFilters>({ initialFilters: { name: "" } });
  const debouncedName = useDebouncedValue(filters.name);

  const ordering = toOrderingParam(sortBy, direction) as
    "name" | "-name" | undefined;

  const { data, isLoading, error } = useDistributionsListQuery(
    {
      repository: repoHref,
      limit: perPage,
      offset: (page - 1) * perPage,
      ordering,
      name__icontains: debouncedName || undefined,
    },
    { enabled: !!repoHref },
  );

  const distributions = (data?.results ?? []) as DistributionRow[];
  const totalCount = data?.count ?? 0;

  const sortProps = (columnKey: DistributionColumnKey) =>
    buildThSort({
      columnKeys: COLUMN_KEYS,
      columnKey,
      sortBy,
      direction,
      onSort: (event, sortedKey, newDirection) => {
        onSort(event, sortedKey, newDirection);
        onSetPage(undefined, 1);
      },
    });

  const distributionColumns = [
    { cell: "Name", props: { sort: sortProps("name") } },
    "Base path",
    "Publication",
  ];

  const distributionRows: DataViewTr[] = distributions.map((dist) => {
    const href = dist.pulp_href;
    return {
      id: href,
      row: [
        {
          cell:
            href != null ? (
              <Link
                to="/content-management/distributions/$distId"
                params={{ distId: extractIdFromHref(href) }}
              >
                {dist.name}
              </Link>
            ) : (
              dist.name
            ),
          props: { dataLabel: "Name" },
        },
        { cell: dist.base_path || "—", props: { dataLabel: "Base path" } },
        {
          cell: <ResourceHrefLink kind="publication" href={dist.publication} />,
          props: { dataLabel: "Publication" },
        },
      ],
    };
  });

  const repoDistributionsStates = dataViewBodyStates({
    columnCount: distributionColumns.length,
    loading: isLoading,
    error,
    empty: distributions.length === 0,
    emptyState: (
      <TableEmptyState
        title="No distributions found"
        body="No distributions point at this repository."
        isFiltered={Boolean(debouncedName)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const pagination = (variant: PaginationVariant) => (
    <Pagination
      variant={variant}
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  return (
    <DataView activeState={repoDistributionsStates.activeState}>
      <DataViewToolbar
        clearAllFilters={clearAllFilters}
        filters={
          <DataViewFilters
            onChange={(_key, newFilters) => {
              onSetFilters(newFilters);
              onSetPage(undefined, 1);
            }}
            values={filters}
          >
            <DataViewTextFilter filterId="name" title="Name" />
          </DataViewFilters>
        }
        pagination={pagination(PaginationVariant.top)}
      />
      <DataViewTable
        aria-label="Repository distributions table"
        columns={distributionColumns}
        rows={distributionRows}
        bodyStates={repoDistributionsStates.bodyStates}
      />
      <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
    </DataView>
  );
};
