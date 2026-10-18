import { useCallback, useEffect, useMemo } from "react";

import type { EntityType } from "@catalog";
import { useLocalStorage } from "@app/hooks/useStorage";

/** The async-create entity types this feature covers (both return 202 + task). */
export type PendingCreateEntityType = Extract<
  EntityType,
  "distribution" | "publication"
>;

/** A pending async create; `taskHref` alone resumes polling after a refresh. */
export interface IPendingCreate {
  taskHref: string;
  entityType: PendingCreateEntityType;
  domainName: string;
  name: string;
  createdAt: number;
}

const PENDING_CREATES_KEY = "pulp-ui/pending-creates";
/** Safety net: drop entries whose task never settled within a day. */
const PENDING_CREATE_TTL_MS = 24 * 60 * 60 * 1000;

export interface IUsePendingCreatesStore {
  entries: IPendingCreate[];
  add: (entry: Omit<IPendingCreate, "createdAt">) => void;
  remove: (taskHref: string) => void;
}

/**
 * localStorage-backed list of pending async creates. Survives a full reload and
 * syncs across tabs (via `useLocalStorage`). Reads are pruned by a TTL so a
 * never-completing task can't accumulate forever.
 */
export const usePendingCreatesStore = (): IUsePendingCreatesStore => {
  const [stored, setStored] = useLocalStorage<IPendingCreate[]>({
    key: PENDING_CREATES_KEY,
    defaultValue: [],
  });

  const entries = useMemo(
    () =>
      stored.filter(
        (entry) => Date.now() - entry.createdAt < PENDING_CREATE_TTL_MS,
      ),
    [stored],
  );

  // Persist the prune so stale rows don't linger in storage across reloads.
  useEffect(() => {
    if (entries.length !== stored.length) {
      setStored(entries);
    }
  }, [entries, stored.length, setStored]);

  const add = useCallback(
    (entry: Omit<IPendingCreate, "createdAt">) => {
      setStored((prev) =>
        prev.some((existing) => existing.taskHref === entry.taskHref)
          ? prev
          : [...prev, { ...entry, createdAt: Date.now() }],
      );
    },
    [setStored],
  );

  const remove = useCallback(
    (taskHref: string) => {
      setStored((prev) =>
        prev.filter((existing) => existing.taskHref !== taskHref),
      );
    },
    [setStored],
  );

  return { entries, add, remove };
};
