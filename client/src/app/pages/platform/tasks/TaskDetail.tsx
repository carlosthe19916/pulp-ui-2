import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  CodeBlock,
  CodeBlockCode,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Progress,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { RENDER_DATETIME_FORMAT } from "@app/Constants";
import { useNotifications } from "@app/context/useNotifications";
import { useTaskCancelMutation, useTaskDetailQuery } from "@app/queries/tasks";
import { buildTaskHref, extractTaskId } from "@app/utils/taskHref";

const stateColors: Record<
  string,
  "green" | "blue" | "red" | "orange" | "grey" | "teal"
> = {
  completed: "green",
  running: "blue",
  failed: "red",
  canceled: "orange",
  canceling: "orange",
  waiting: "teal",
  skipped: "grey",
};

interface TaskDetailProps {
  taskId: string;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
  const taskHref = buildTaskHref(taskId);
  const { data: task, isLoading } = useTaskDetailQuery(taskHref);
  const cancelMutation = useTaskCancelMutation();
  const { addNotification } = useNotifications();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const isRunning = task?.state === "running" || task?.state === "waiting";

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(taskHref);
      addNotification({
        title: "Task cancel requested",
        variant: "info",
      });
    } catch {
      addNotification({
        title: "Failed to cancel task",
        variant: "danger",
      });
    }
    setIsCancelModalOpen(false);
  };

  if (isLoading || !task) {
    return (
      <PageSection>
        <Spinner aria-label="Loading task" />
      </PageSection>
    );
  }

  const taskName = task.name.split(".").pop() ?? task.name;

  return (
    <>
      <PageSection>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to="/tasks">Tasks</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{taskName}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Content component={ContentVariants.h1}>
              {taskName}{" "}
              <Label color={stateColors[task.state ?? ""] ?? "grey"}>
                {task.state}
              </Label>
            </Content>
          </StackItem>

          {isRunning && (
            <StackItem>
              <Button
                variant="danger"
                onClick={() => setIsCancelModalOpen(true)}
              >
                Cancel Task
              </Button>
            </StackItem>
          )}

          <StackItem>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Full Name</DescriptionListTerm>
                <DescriptionListDescription>
                  {task.name}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>State</DescriptionListTerm>
                <DescriptionListDescription>
                  {task.state}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>
                  {task.pulp_created
                    ? dayjs(task.pulp_created).format(RENDER_DATETIME_FORMAT)
                    : "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Started</DescriptionListTerm>
                <DescriptionListDescription>
                  {task.started_at
                    ? dayjs(task.started_at).format(RENDER_DATETIME_FORMAT)
                    : "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Finished</DescriptionListTerm>
                <DescriptionListDescription>
                  {task.finished_at
                    ? dayjs(task.finished_at).format(RENDER_DATETIME_FORMAT)
                    : "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Logging CID</DescriptionListTerm>
                <DescriptionListDescription>
                  {task.logging_cid}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </StackItem>

          {task.progress_reports && task.progress_reports.length > 0 && (
            <StackItem>
              <Content component={ContentVariants.h2}>Progress Reports</Content>
              <Stack hasGutter>
                {task.progress_reports.map((report) => (
                  <StackItem
                    key={`${report.code ?? "report"}-${report.message ?? ""}-${report.state ?? ""}`}
                  >
                    <Content component={ContentVariants.p}>
                      {report.message}
                    </Content>
                    {report.total != null && report.total > 0 && (
                      <Progress
                        value={((report.done ?? 0) / report.total) * 100}
                        title={`${report.done ?? 0} / ${report.total}`}
                        label={`${report.done ?? 0} / ${report.total}`}
                      />
                    )}
                  </StackItem>
                ))}
              </Stack>
            </StackItem>
          )}

          {task.state === "failed" && task.result != null && (
            <StackItem>
              <Content component={ContentVariants.h2}>Error</Content>
              <CodeBlock>
                <CodeBlockCode>
                  {typeof task.result === "string"
                    ? task.result
                    : JSON.stringify(task.result, null, 2)}
                </CodeBlockCode>
              </CodeBlock>
            </StackItem>
          )}

          {task.created_resources && task.created_resources.length > 0 && (
            <StackItem>
              <Content component={ContentVariants.h2}>
                Created Resources
              </Content>
              <Content component="ul">
                {task.created_resources.map((href) => (
                  <Content component="li" key={href}>
                    {href}
                  </Content>
                ))}
              </Content>
            </StackItem>
          )}

          {task.child_tasks && task.child_tasks.length > 0 && (
            <StackItem>
              <Content component={ContentVariants.h2}>Child Tasks</Content>
              <Content component="ul">
                {task.child_tasks.map((href) => {
                  const childId = extractTaskId(href);
                  return (
                    <Content component="li" key={href}>
                      <Link to="/tasks/$taskId" params={{ taskId: childId }}>
                        {childId}
                      </Link>
                    </Content>
                  );
                })}
              </Content>
            </StackItem>
          )}
        </Stack>
      </PageSection>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        variant="small"
      >
        <ModalHeader title="Cancel Task" />
        <ModalBody>Are you sure you want to cancel this task?</ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            onClick={() => void handleCancel()}
            isLoading={cancelMutation.isPending}
          >
            Cancel Task
          </Button>
          <Button variant="link" onClick={() => setIsCancelModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
