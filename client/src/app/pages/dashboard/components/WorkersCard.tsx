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
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { useWorkersListQuery } from "@app/queries/workers";
import { extractTaskDomain, extractTaskId } from "@app/utils/taskHref";

const LIMIT = 20;

/** Online workers with the task each one runs, and how many went missing. */
export const WorkersCard: React.FC = () => {
  const { data: online } = useWorkersListQuery({
    params: { limit: LIMIT, offset: 0, online: true, ordering: "name" },
  });
  const { data: missing } = useWorkersListQuery({
    params: { limit: 1, offset: 0, missing: true },
  });
  const workers = online?.results ?? [];
  const missingCount = missing?.count ?? 0;

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
          {(online?.count ?? 0) > LIMIT && (
            <StackItem>
              {online?.count} online; showing the first {LIMIT}.
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
