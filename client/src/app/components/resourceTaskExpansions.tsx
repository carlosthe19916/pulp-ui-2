import type { ExpandableContent } from "@patternfly/react-data-view";

import { compoundExpansions } from "@app/components/DataView";
import { ResourceTaskTable } from "@app/components/ResourceTaskTable";
import type { IResourceEntity } from "@app/hooks/useResourceTasks";

/**
 * Compound-expand content for a list page's task-status column: rows with 2+
 * in-flight tasks get a toggle on the Status cell that expands a paginated task
 * sub-table; rows with 0–1 tasks stay plain. A thin specialization of
 * `compoundExpansions` — compose it with other columns' expansions into the
 * table's `expandedRows` (requires `<DataViewTable indexBy="id">` with each row's
 * `id` set to its `pulp_href`).
 */
export const resourceTaskExpansions = <T extends IResourceEntity>({
  entities,
  getActiveCount,
  statusColumnIndex,
}: {
  entities: T[];
  getActiveCount: (prn?: string | null) => number;
  statusColumnIndex: number;
}): ExpandableContent[] =>
  compoundExpansions({
    entities,
    columnIndex: statusColumnIndex,
    rowId: (entity) => entity.pulp_href ?? "",
    render: (entity) =>
      entity.prn && getActiveCount(entity.prn) >= 2 ? (
        <ResourceTaskTable prn={entity.prn} />
      ) : null,
  });
