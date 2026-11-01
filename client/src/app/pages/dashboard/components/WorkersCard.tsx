import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  PaginationVariant,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { ListPagination } from "@app/components/ListPagination";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useWorkersListQuery } from "@app/queries/workers";
import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";

import { WORKERS_CARD_STATE } from "./workersCardState";

/** Online workers with the task each one runs, and how many went missing. */
export const WorkersCard: React.FC = () => {
  const [pagination, setPagination] = usePersistentState({
    ...WORKERS_CARD_STATE.pagination,
    storage: "state",
  });
  const { data: online } = useWorkersListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      online: true,
      ordering: "name",
    },
  });
  const { data: missing } = useWorkersListQuery({
    params: { limit: 1, offset: 0, missing: true },
  });
  const workers = online?.results ?? [];
  const missingCount = missing?.count ?? 0;
  const onlineCount = online?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workers</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          {missingCount > 0 && (
            <StackItem>
              <Label color="orange" isCompact>
                {missingCount} missing
              </Label>
            </StackItem>
          )}
          <StackItem>
            {workers.length === 0 ? (
              <Content component={ContentVariants.p}>No online workers</Content>
            ) : (
              <DescriptionList isCompact>
                {workers.map((worker) => (
                  <DescriptionListGroup key={worker.pulp_href}>
                    <DescriptionListTerm>{worker.name}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {worker.current_task ? (
                        <Link
                          to="/monitoring/$pulpDomain/tasks/$taskId"
                          params={{
                            pulpDomain: extractTaskDomain(worker.current_task),
                            taskId: extractTaskId(worker.current_task),
                          }}
                        >
                          Running a task
                        </Link>
                      ) : (
                        <Label color="green" isCompact>
                          Idle
                        </Label>
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ))}
              </DescriptionList>
            )}
          </StackItem>
          {/* 10 is the smallest page size: below it every worker fits on one page. */}
          {onlineCount > 10 && (
            <StackItem>
              <ListPagination
                variant={PaginationVariant.bottom}
                itemCount={onlineCount}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
