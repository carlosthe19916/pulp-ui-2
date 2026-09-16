import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  CodeBlock,
  CodeBlockCode,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  PageSection,
  Progress,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useNotifications } from "@app/context/useNotifications";
import {
  useSuspenseTaskDetailQuery,
  useTaskCancelMutation,
} from "@app/queries/tasks";
import { extractTaskId } from "@app/utils/taskHref";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

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

interface ITaskDetailProps {
  taskId: string;
}

export const TaskDetail: React.FC<ITaskDetailProps> = ({ taskId }) => {
  const { data: task } = useSuspenseTaskDetailQuery(taskId);
  const cancelMutation = useTaskCancelMutation();
  const { addNotification } = useNotifications();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const isRunning = task.state === "running" || task.state === "waiting";

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(taskId);
      addNotification({
        title: "Task cancel requested",
        variant: "info",
      });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to cancel task"),
        variant: "danger",
      });
    }
    setIsCancelModalOpen(false);
  };

  const taskName = task.name.includes(".")
    ? (task.name.split(".").pop() ?? task.name)
    : task.name;

  return (
    <>
      <DocumentTitle title={taskName} />
      <PageHeader
        title={taskName}
        label={
          <Label color={stateColors[task.state ?? ""] ?? "grey"}>
            {task.state}
          </Label>
        }
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/tasks">Tasks</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{taskName}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              isRunning && {
                key: "cancel",
                dropdownItemProps: {
                  children: "Cancel Task",
                  isDanger: true,
                  onClick: () => setIsCancelModalOpen(true),
                },
              },
            ]}
          />
        }
      />

      <PageSection>
        <Stack hasGutter>
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
                  {formatDateTime(task.pulp_created) ?? "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Started</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatDateTime(task.started_at) ?? "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Finished</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatDateTime(task.finished_at) ?? "—"}
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

      <ConfirmActionModal
        isOpen={isCancelModalOpen}
        title="Cancel Task"
        body="Are you sure you want to cancel this task?"
        isConfirming={cancelMutation.isPending}
        confirmLabel="Cancel Task"
        cancelLabel="Close"
        confirmVariant="danger"
        onConfirm={() => void handleCancel()}
        onCancel={() => setIsCancelModalOpen(false)}
      />
    </>
  );
};
