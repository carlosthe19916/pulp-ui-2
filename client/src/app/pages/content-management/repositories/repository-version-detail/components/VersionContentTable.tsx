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
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useContentListQuery } from "@app/queries/content";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

interface IVersionContentTableProps {
  versionHref: string;
}

/** Best-effort human identifier for a content unit across plugins. */
const contentIdentifier = (unit: Record<string, unknown>): string => {
  const relativePath = unit.relative_path;
  if (typeof relativePath === "string" && relativePath) return relativePath;
  const name = unit.name;
  if (typeof name === "string" && name) return name;
  const href = unit.pulp_href;
  return typeof href === "string" ? extractIdFromHref(href) : "—";
};

export const VersionContentTable: React.FC<IVersionContentTableProps> = ({
  versionHref,
}) => {
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data, isLoading, error } = useContentListQuery({
    params: {
      repository_version: versionHref,
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });

  const content = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Type" },
    { cell: "Identifier" },
    { cell: "Created" },
  ];

  const rows: DataViewTr[] = content.map((unit) => {
    const record = unit as Record<string, unknown>;
    const href = typeof record.pulp_href === "string" ? record.pulp_href : "";
    const pulpType = resolvePulpType(href);
    return {
      id: href,
      row: [
        {
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: contentIdentifier(record),
          props: { dataLabel: "Identifier", modifier: "truncate" },
        },
        {
          cell:
            typeof record.pulp_created === "string"
              ? (formatDateTime(record.pulp_created) ?? "—")
              : "—",
          props: { dataLabel: "Created" },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: content.length === 0,
    emptyState: <TableEmptyState title="No content in this version" />,
  });

  return (
    <DataView activeState={activeState}>
      <DataViewTable
        aria-label="Version content table"
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
