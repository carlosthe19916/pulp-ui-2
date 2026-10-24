import type { ExpandableContent } from "@patternfly/react-data-view";

import { ResourceTaskTable } from "@app/components/ResourceTaskTable";
import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";
import type { IResourceEntity } from "@app/hooks/useResourceTasks";

/**
 * Compound-expand content for a list page's task-status column: rows with 2+
 * in-flight tasks get a toggle on the Status cell that expands a paginated task
 * sub-table; rows with 0–1 tasks stay plain. Compose it with other columns'
 * expanded rows into the table's `expandedRows` (requires `<DataViewTable
 * indexBy="id">` with each row's `id` set to its `pulp_href`).
 */
export interface IResourceTaskExpansionsOptions<T extends IResourceEntity> {
  entities: T[];
  getActiveCount: (prn?: string | null) => number;
  statusColumnIndex: number;
}

export const resourceTaskExpansions = <T extends IResourceEntity>({
  entities,
  getActiveCount,
  statusColumnIndex,
}: IResourceTaskExpansionsOptions<T>): ExpandableContent[] =>
  entities.flatMap((entity) => {
    const prn = entity.prn;
    if (!prn || getActiveCount(prn) < 2) return [];
    return [
      {
        rowId: entity.pulp_href ?? "",
        columnId: statusColumnIndex,
        content: (
          <RevealCellOnExpand>
            {() => <ResourceTaskTable prn={prn} />}
          </RevealCellOnExpand>
        ),
      },
    ];
  });
