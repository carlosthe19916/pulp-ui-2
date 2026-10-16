import type React from "react";

import type { ExpandableContent } from "@patternfly/react-data-view";

import { EntityTaskStatus } from "@app/components/EntityTaskStatus";
import { ResourceTaskCountToggle } from "@app/components/ResourceTaskCountToggle";
import { ResourceTaskTable } from "@app/components/ResourceTaskTable";
import {
  useResourceTasks,
  type IResourceEntity,
  type IResourceTaskSettled,
} from "@app/hooks/useResourceTasks";

/**
 * Shared wiring for a list page's compound-expandable task-status column
 * (RemoteList is the reference): a status-cell renderer (idle / one task / 2+
 * toggle) and the `expandedRows` for each 2+ row's paginated task table. The
 * caller owns the Status header at `statusColumnIndex`, gives each row's first
 * cell `id: rowIndex` (compound-expand matches it to `expandedRows[].rowId`), and
 * passes `isExpandable` + `expandedRows` to `<DataViewTable>`.
 */
interface IUseResourceTaskColumnOptions<T extends IResourceEntity> {
  entities: T[];
  /** Index of the status cell within each row — must match the column placement. */
  statusColumnIndex: number;
  /** Called when a row's active-task count drops; typically refetch the list. */
  onSettled: (event: IResourceTaskSettled<T>) => void;
}

export const useResourceTaskColumn = <T extends IResourceEntity>({
  entities,
  statusColumnIndex,
  onSettled,
}: IUseResourceTaskColumnOptions<T>): {
  renderStatusCell: (entity: T) => React.ReactNode;
  expandedRows: ExpandableContent[];
} => {
  const { getActiveCount, getTaskKinds } = useResourceTasks({
    entities,
    onSettled,
  });

  const expandedRows: ExpandableContent[] = [];
  entities.forEach((entity, rowIndex) => {
    if (entity.prn && getActiveCount(entity.prn) >= 2) {
      expandedRows.push({
        rowId: rowIndex,
        columnId: statusColumnIndex,
        content: <ResourceTaskTable prn={entity.prn} />,
      });
    }
  });

  const renderStatusCell = (entity: T): React.ReactNode => {
    const activeCount = getActiveCount(entity.prn);
    if (activeCount === 0) return "—";
    if (activeCount === 1) {
      return <EntityTaskStatus kind={getTaskKinds(entity.prn)[0]} />;
    }
    return <ResourceTaskCountToggle count={activeCount} />;
  };

  return {
    renderStatusCell,
    expandedRows,
  };
};
