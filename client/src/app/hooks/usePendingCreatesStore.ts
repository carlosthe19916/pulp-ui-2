import { useCallback } from "react";

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
// Module-level so `useLocalStorage`'s setter (keyed on defaultValue) stays stable.
const NO_PENDING: IPendingCreate[] = [];

const isFresh = (entry: IPendingCreate) =>
  Date.now() - entry.createdAt < PENDING_CREATE_TTL_MS;

export interface IUsePendingCreatesStore {
  entries: IPendingCreate[];
  add: (entry: Omit<IPendingCreate, "createdAt">) => void;
  remove: (taskHref: string) => void;
}

/**
 * localStorage-backed list of pending async creates; survives a reload and syncs across
 * tabs.
 */
export const usePendingCreatesStore = (): IUsePendingCreatesStore => {
  const [stored, setStored] = useLocalStorage<IPendingCreate[]>({
    key: PENDING_CREATES_KEY,
    defaultValue: NO_PENDING,
  });

  // TTL-pruned so a never-completing task can't accumulate forever.
  const entries = stored.filter(isFresh);

  // Stable identities: `usePendingCreates` lists `remove` as an effect dependency.
  // Each write also prunes expired entries from storage.
  const add = useCallback(
    (entry: Omit<IPendingCreate, "createdAt">) => {
      setStored((prev) => {
        const fresh = prev.filter(isFresh);
        return fresh.some((existing) => existing.taskHref === entry.taskHref)
          ? fresh
          : [...fresh, { ...entry, createdAt: Date.now() }];
      });
    },
    [setStored],
  );

  const remove = useCallback(
    (taskHref: string) => {
      setStored((prev) =>
        prev.filter(
          (existing) => existing.taskHref !== taskHref && isFresh(existing),
        ),
      );
    },
    [setStored],
  );

  return { entries, add, remove };
};
