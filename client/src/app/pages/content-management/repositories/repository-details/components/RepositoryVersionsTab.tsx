import type React from "react";

import {
  DataView,
  DataViewTable,
  type DataViewTr,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useAllFileRepositoryVersionsListQuery } from "@app/queries/file-repositories";
import { formatDateTime } from "@app/utils/utils";

interface IRepositoryVersionsTabProps {
  repoId: string;
}

export const RepositoryVersionsTab: React.FC<IRepositoryVersionsTabProps> = ({
  repoId,
}) => {
  const {
    data: versionsData,
    isLoading: isVersionsLoading,
    error: versionsError,
  } = useAllFileRepositoryVersionsListQuery(repoId);

  const versions = versionsData?.results ?? [];

  const versionColumns = ["Version", "Created", "Content count"];

  const versionRows: DataViewTr[] = versions.map((version) => {
    const summary = version.content_summary;
    const contentCount = summary?.present
      ? Object.values(summary.present).reduce(
          (sum, entry) => sum + ((entry as { count?: number }).count ?? 0),
          0,
        )
      : "—";
    return {
      id: version.pulp_href,
      row: [
        { cell: version.number ?? "—", props: { dataLabel: "Version" } },
        {
          cell: formatDateTime(version.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
        { cell: contentCount, props: { dataLabel: "Content count" } },
      ],
    };
  });

  const versionsStates = dataViewBodyStates({
    columnCount: versionColumns.length,
    loading: isVersionsLoading,
    error: versionsError,
    empty: versions.length === 0,
    emptyState: <TableEmptyState title="No versions found" />,
  });

  return (
    <DataView activeState={versionsStates.activeState}>
      <DataViewTable
        aria-label="Repository versions table"
        columns={versionColumns}
        rows={versionRows}
        bodyStates={versionsStates.bodyStates}
      />
    </DataView>
  );
};
