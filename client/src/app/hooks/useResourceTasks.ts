import { useEffect, useMemo, useRef } from "react";

import { useTasksByPrnQueries } from "@app/queries/tasks";

/** The async (202 + task) operations surfaced per list row. */
export type EntityTaskKind = "delete" | "update" | "sync" | "modify";

/**
 * Surfaced row op for a Pulp task name, else null: `…general_delete`/`…general_update`,
 * any plugin's `…synchronize`, and a content change (`…add_and_remove`, container
 * `…recursive_add_content`/`…recursive_remove_content`).
 */
export const entityTaskKindFromName = (
  name?: string | null,
): EntityTaskKind | null => {
  const taskName = name ?? "";
  if (taskName.includes("general_delete")) return "delete";
  if (taskName.includes("general_update")) return "update";
  if (taskName.includes("synchroniz")) return "sync";
  if (
    taskName.includes("add_and_remove") ||
    taskName.includes("recursive_add") ||
    taskName.includes("recursive_remove")
  ) {
    return "modify";
  }
  return null;
};

export interface IResourceEntity {
  prn?: string | null;
  name?: string | null;
  pulp_href?: string | null;
}

/** A single active task surfaced for a row (the probe's sample task). */
export interface IActiveResourceTask {
  kind: EntityTaskKind;
  taskHref: string;
  state: string;
}

/** A row whose in-flight task count just dropped (a task settled). */
export interface IResourceTaskSettled<T> {
  entity: T;
}

interface IRowTasks {
  /** Exact number of in-progress tasks for the row (from the probe's `count`). */
  count: number;
  /** The sample active task, when its name maps to a surfaced kind. */
  task?: IActiveResourceTask;
}

/**
 * Per-row in-flight task status from the live tasks endpoint (joined by
 * reserved-resource PRN), so it survives reloads. Each row probes `limit: 1` and
 * reads the paginated `count` — enough for 0 / 1 / 2+ and the single-task label,
 * without fetching the list. Fires `onSettled` when a row's count drops; the
 * caller decides what to do (e.g. refetch).
 */
export const useResourceTasks = <T extends IResourceEntity>({
  entities,
  onSettled,
}: {
  entities: T[];
  /** Called for a row when its active-task count drops (a task settled). */
  onSettled: (event: IResourceTaskSettled<T>) => void;
}) => {
  const prns = useMemo(
    () =>
      entities
        .map((entity) => entity.prn)
        .filter((prn): prn is string => !!prn),
    [entities],
  );
  const probesByPrn = useTasksByPrnQueries({ prns });

  // prn → { count, sample task }
  const activeByPrn = useMemo(() => {
    const map = new Map<string, IRowTasks>();
    for (const prn of prns) {
      const probe = probesByPrn.get(prn);
      if (!probe) continue;
      const kind = entityTaskKindFromName(probe.task?.name);
      const task: IActiveResourceTask | undefined =
        probe.task?.pulp_href && kind
          ? {
              kind,
              taskHref: probe.task.pulp_href,
              state: probe.task.state ?? "",
            }
          : undefined;
      map.set(prn, { count: probe.count, task });
    }
    return map;
  }, [probesByPrn, prns]);

  // Keep the latest callback current without making it an effect dependency.
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const prevCountByPrnRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const prev = prevCountByPrnRef.current;

    // Skip the O(N) diff when nothing is or was in flight.
    const hasActiveNow = [...activeByPrn.values()].some((v) => v.count > 0);
    const hadActiveBefore = [...prev.values()].some((count) => count > 0);
    if (!hasActiveNow && !hadActiveBefore) {
      return;
    }

    const entityByPrn = new Map(
      entities
        .filter((entity): entity is T & { prn: string } => !!entity.prn)
        .map((entity) => [entity.prn, entity] as const),
    );
    const next = new Map<string, number>();
    activeByPrn.forEach(({ count }, prn) => {
      next.set(prn, count);
      if (count < (prev.get(prn) ?? 0)) {
        const entity = entityByPrn.get(prn);
        if (entity) onSettledRef.current({ entity });
      }
    });
    prevCountByPrnRef.current = next;
  }, [activeByPrn, entities]);

  return {
    /** In-progress task count for the row. */
    getActiveCount: (prn?: string | null): number =>
      (prn ? activeByPrn.get(prn)?.count : 0) ?? 0,
    /** Kind of the probed task (≤1), for the single-task label. */
    getTaskKinds: (prn?: string | null): EntityTaskKind[] => {
      const task = prn ? activeByPrn.get(prn)?.task : undefined;
      return task ? [task.kind] : [];
    },
    /** The probed active task (≤1), sibling of `getTaskKinds`. */
    getTasks: (prn?: string | null): IActiveResourceTask[] => {
      const task = prn ? activeByPrn.get(prn)?.task : undefined;
      return task ? [task] : [];
    },
  };
};
