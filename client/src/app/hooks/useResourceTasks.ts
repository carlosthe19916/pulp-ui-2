import { useEffect, useMemo, useRef } from "react";

import {
  entityTaskKindFromName,
  isTerminalTaskState,
  useEntityOpsTasksQueries,
  type EntityTaskKind,
} from "@app/queries/tasks";

interface IResourceEntity {
  prn?: string | null;
  name?: string | null;
}

/** A row's in-flight delete/update that has just finished. */
export interface IResourceTaskSettled<T> {
  entity: T;
  kind: EntityTaskKind;
  /** The terminal state when the task failed or was canceled; `undefined` on success. */
  state?: "failed" | "canceled";
}

interface IActiveTask {
  kind: EntityTaskKind;
  taskHref: string;
}

/**
 * Derives per-row delete/update status from the live tasks endpoint (joined to
 * rows by reserved-resource PRN), so the status survives browser reloads and
 * navigation with no persisted state. Deciding *what happens* when a task settles
 * — refetching the list, toasting a failure — is left to the caller via
 * `onSettled`, keeping this hook free of side-effect policy.
 *
 * Settlement is detected by tracking each row's specific in-flight task href: a
 * success drops out of the active-states query, while a failure/cancel is still
 * returned so its terminal state can be reported. Because detection is a
 * transition out of the active set, tasks that finished before mount (e.g. after
 * a reload) are never re-reported.
 */
export const useResourceTasks = <T extends IResourceEntity>({
  entities,
  onSettled,
}: {
  entities: T[];
  /** Called once when a row's in-flight task finishes (success or failure). */
  onSettled: (event: IResourceTaskSettled<T>) => void;
}) => {
  const prns = useMemo(
    () =>
      entities
        .map((entity) => entity.prn)
        .filter((prn): prn is string => !!prn),
    [entities],
  );
  const tasks = useEntityOpsTasksQueries(prns);

  // prn -> the in-flight delete/update task locking that entity's row.
  const activeByPrn = useMemo(() => {
    const prnSet = new Set(prns);
    const map = new Map<string, IActiveTask>();
    for (const task of tasks) {
      const kind = entityTaskKindFromName(task.name);
      if (!kind || isTerminalTaskState(task.state) || !task.pulp_href) continue;
      for (const resource of task.reserved_resources_record ?? []) {
        if (prnSet.has(resource) && !map.has(resource)) {
          map.set(resource, { kind, taskHref: task.pulp_href });
        }
      }
    }
    return map;
  }, [tasks, prns]);

  // Keep the latest callback current without making it an effect dependency.
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const prevActiveRef = useRef<Map<string, IActiveTask>>(new Map());

  useEffect(() => {
    const stateByHref = new Map(
      tasks
        .filter((task) => !!task.pulp_href)
        .map((task) => [task.pulp_href as string, task.state]),
    );
    const entityByPrn = new Map(
      entities
        .filter((entity): entity is T & { prn: string } => !!entity.prn)
        .map((entity) => [entity.prn, entity] as const),
    );

    prevActiveRef.current.forEach(({ kind, taskHref }, prn) => {
      if (activeByPrn.has(prn)) return; // still in flight
      const entity = entityByPrn.get(prn);
      if (!entity) return; // row already gone; nothing to report
      const finalState = stateByHref.get(taskHref);
      const state =
        finalState === "failed" || finalState === "canceled"
          ? finalState
          : undefined;
      onSettledRef.current({ entity, kind, state });
    });

    prevActiveRef.current = activeByPrn;
  }, [tasks, activeByPrn, entities]);

  return {
    getTaskKind: (prn?: string | null): EntityTaskKind | undefined =>
      prn ? activeByPrn.get(prn)?.kind : undefined,
  };
};
