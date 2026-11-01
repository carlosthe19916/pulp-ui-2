/**
 * Compile-time checks of `listSearch` through the Remotes route, run by `tsc` and never executed:
 * each `@ts-expect-error` is a link that must not compile.
 */
import { linkOptions } from "@tanstack/react-router";
import { z } from "zod";

import { defineListState } from "./listState";

const to = "/content-management/$pulpDomain/remotes";
const params = { pulpDomain: "default" };

linkOptions({ to, params });
linkOptions({
  to,
  params,
  search: {
    pulp_type: ["file.file", "rpm.rpm"],
    name: "fedora",
    sortBy: "url",
    direction: "desc",
    page: 2,
    perPage: 20,
  },
});

// @ts-expect-error not a remote type
linkOptions({ to, params, search: { pulp_type: ["file.bogus"] } });
// @ts-expect-error not a sortable column
linkOptions({ to, params, search: { sortBy: "pulp_created" } });
// @ts-expect-error a page size the list doesn't offer
linkOptions({ to, params, search: { perPage: 50 } });
// @ts-expect-error a page is a number
linkOptions({ to, params, search: { page: "2" } });
// @ts-expect-error a typo in a filter name
linkOptions({ to, params, search: { pulp_typ: ["file.file"] } });

// A malformed piece is reported where the list's state is written.
defineListState({
  // @ts-expect-error a piece needs a defaultValue
  filters: { key: "filters", schema: z.object({ name: z.string() }) },
});
