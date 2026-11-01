import { createFileRoute } from "@tanstack/react-router";

import { WorkerList } from "@app/pages/monitoring/workers/worker-list/WorkerList";
import { WORKER_LIST_STATE } from "@app/pages/monitoring/workers/worker-list/workerListState";
import { listSearch } from "@app/utils/listState";

const { validateSearch, search } = listSearch(WORKER_LIST_STATE);

export const Route = createFileRoute("/_authenticated/monitoring/workers/")({
  validateSearch,
  search,
  component: WorkerList,
});
