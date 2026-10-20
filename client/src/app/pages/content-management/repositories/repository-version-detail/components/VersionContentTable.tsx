import type React from "react";

import { PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  type DataViewTr,
  type ExpandableContent,
} from "@patternfly/react-data-view";

import { ContentDetailPanel } from "@app/components/ContentDetailPanel";
import {
  compoundExpansions,
  dataViewBodyStates,
  ListPagination,
  type DataViewTh,
} from "@app/components/DataView";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useContentListQuery } from "@app/queries/content";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { contentIdentifier } from "@app/utils/contentIdentifier";
import { formatDateTime } from "@app/utils/utils";

interface IVersionContentTableProps {
  versionHref: string;
}

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

  const IDENTIFIER_COLUMN_INDEX = 1;
  const expandedRows: ExpandableContent[] = compoundExpansions({
    entities: content,
    columnIndex: IDENTIFIER_COLUMN_INDEX,
    rowId: (unit) => unit.pulp_href ?? "",
    render: (unit) => <ContentDetailPanel href={unit.pulp_href ?? ""} />,
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
        isExpandable={expandedRows.length > 0}
        expandedRows={expandedRows}
        indexBy="id"
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
