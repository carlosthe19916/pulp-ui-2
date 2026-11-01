/**
 * Compile-time checks of `definePersistentState` and `usePersistentState` (run by `tsc`, never
 * executed): each `@ts-expect-error` marks a definition that must not compile.
 */
import { expectTypeOf } from "vitest";
import { z } from "zod";

import { defineSortState, PAGINATION_STATE } from "@app/utils/listState";

import {
  definePersistentState,
  type PersistentStateSetter,
  usePersistentState,
} from "./usePersistentState";

const FILTERS = definePersistentState({
  key: "filters",
  schema: z.object({ name: z.string(), types: z.array(z.string()) }),
  defaultValue: { name: "", types: [] },
});

// A nested object can't be flattened into query params.
definePersistentState({
  key: "nested",
  // @ts-expect-error a field must be a scalar or a list of scalars
  schema: z.object({ range: z.object({ from: z.number() }) }),
  // @ts-expect-error so its default can't be one either
  defaultValue: { range: { from: 0 } },
});

definePersistentState({
  key: "mismatch",
  schema: z.object({ page: z.coerce.number() }),
  // @ts-expect-error the default must match the schema's output
  defaultValue: { page: "1" },
});

definePersistentState({
  key: "missing",
  schema: z.object({ page: z.coerce.number(), perPage: z.coerce.number() }),
  // @ts-expect-error the default needs every field
  defaultValue: { page: 1 },
});

defineSortState({
  columnKeys: ["name", "url"],
  // @ts-expect-error the default sort must be one of the column keys
  defaultValue: { sortBy: "policy", direction: "asc" },
});

// @ts-expect-error a page size the lists don't offer
PAGINATION_STATE.defaultValue = { page: 1, perPage: 15 };

export const useTypeChecks = () => {
  const [filters, setFilters] = usePersistentState({
    ...FILTERS,
    storage: "url",
  });
  expectTypeOf(filters).toEqualTypeOf<{ name: string; types: string[] }>();
  expectTypeOf(setFilters).toEqualTypeOf<
    PersistentStateSetter<{ name: string; types: string[] }>
  >();

  const [pagination] = usePersistentState({
    ...PAGINATION_STATE,
    storage: "session",
  });
  expectTypeOf(pagination.perPage).toEqualTypeOf<10 | 20>();

  // @ts-expect-error storage is one of the four places
  usePersistentState({ ...FILTERS, storage: "cookie" });
};
