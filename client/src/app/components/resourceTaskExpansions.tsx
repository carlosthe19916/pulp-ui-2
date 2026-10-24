import type { ExpandableContent } from "@patternfly/react-data-view";

import { ResourceTaskTable } from "@app/components/ResourceTaskTable";
import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";
import type { IResourceEntity } from "@app/hooks/useResourceTasks";

/**
 * Compound-expand task sub-table for rows with 2+ in-flight tasks. Requires
 * `<DataViewTable indexBy="id">` with each row's `id` set to its `pulp_href`.
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
