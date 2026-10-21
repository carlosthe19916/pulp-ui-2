import type { PerPageOptions } from "@patternfly/react-core";

/**
 * Per-page choices for lists that fire a per-row task probe (`useResourceTasks`:
 * domains, repositories, remotes, distributions). Capping at 20 bounds the probe
 * fan-out — without it PatternFly's default menu offers 100, which is 100 polling
 * `tasks/?limit=1` requests per refetch.
 */
export const PROBE_LIST_PER_PAGE_OPTIONS: PerPageOptions[] = [
  { title: "10", value: 10 },
  { title: "20", value: 20 },
];
