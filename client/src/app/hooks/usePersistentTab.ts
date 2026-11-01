import { useCallback } from "react";

import { z } from "zod";

import {
  definePersistentState,
  type PersistentStorage,
  usePersistentState,
} from "./usePersistentState";

/** A tab group's active tab (ADR 0013); declare it at module scope with `defineTabState`. */
export interface ITabStateDefinition<K extends string> {
  /** The query param, `tab` unless a screen has a second group (`section`). */
  param: string;
  /** The group's keys; `undefined` when they're only known at runtime (pass `available`). */
  tabs: readonly K[] | undefined;
  defaultValue: K;
  state: ReturnType<typeof definePersistentState>;
}

export const defineTabState = <K extends string = string>({
  param = "tab",
  tabs,
  defaultValue,
}: {
  param?: string;
  tabs?: readonly [K, ...K[]];
  defaultValue: NoInfer<K>;
}): ITabStateDefinition<K> => ({
  param,
  tabs,
  defaultValue,
  state: definePersistentState({
    key: param,
    schema: z.object({ [param]: tabs ? z.enum(tabs) : z.string() }),
    defaultValue: { [param]: defaultValue },
  }),
});

interface IUsePersistentTabOptions<
  K extends string,
> extends ITabStateDefinition<K> {
  storage: PersistentStorage;
  /** The tabs rendered now, for runtime keys or tabs shown conditionally. */
  available?: readonly K[];
}

/**
 * The active tab, kept where `storage` says (ADR 0013). `setTab` is type-checked; `selectTab`
 * takes PatternFly's `onSelect` key and ignores keys the group doesn't have.
 */
export const usePersistentTab = <K extends string>({
  param,
  tabs,
  defaultValue,
  state,
  storage,
  available,
}: IUsePersistentTabOptions<K>) => {
  const [value, setValue] = usePersistentState({ ...state, storage });
  const known = available ?? tabs;
  const isKnown = (key: string): key is K =>
    !known || (known as readonly string[]).includes(key);

  const stored = String(value[param]);
  const tab: K = isKnown(stored) ? stored : (known?.[0] ?? defaultValue);

  const setTab = useCallback(
    (next: K) => setValue({ [param]: next }),
    [setValue, param],
  );
  const selectTab = (key: string | number) => {
    const next = String(key);
    if (isKnown(next)) setTab(next);
  };

  return { tab, setTab, selectTab };
};
