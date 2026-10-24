import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
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
  PageSection,
  Progress,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { TaskStateLabel } from "@app/components/TaskStateLabel";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  isCancelable,
  isTerminalTaskState,
  useSuspenseTaskDetailQuery,
  useTaskCancelMutation,
  useTaskDeleteMutation,
  useTaskProfileArtifactsQuery,
} from "@app/queries/tasks";
import type { TaskWithError } from "@app/queries/utils/openapiErrorTypes";
import { extractTaskId, shortTaskName } from "@app/utils/taskHref";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

const COLUMNS = { default: "1Col", md: "2Col" } as const;

interface ITaskDetailProps {
  taskHref: string;
}

export const TaskDetail: React.FC<ITaskDetailProps> = ({ taskHref }) => {
  const { name: pulpDomain } = useSelectedDomain();
  const { data: task } = useSuspenseTaskDetailQuery({ href: taskHref });
  const taskError = (task as TaskWithError).error;
  const cancelMutation = useTaskCancelMutation();
  const { addNotification } = useNotifications();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const { disabledProps } = useObjectPermissions({ href: taskHref });
  const { data: profile } = useTaskProfileArtifactsQuery({ href: taskHref });
  const profileUrls = Object.entries(profile?.urls ?? {});
  const deleteMutation = useTaskDeleteMutation({
    onSuccess: async () => {
      addNotification({ title: "Task deleted", variant: "success" });
      await navigate({
        to: "/monitoring/$pulpDomain/tasks",
        params: { pulpDomain },
      });
    },
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: "Failed to delete task",
        }),
        variant: "danger",
      }),
  });

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(task.pulp_href ?? "");
      addNotification({
        title: "Task cancel requested",
        variant: "info",
      });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: "Failed to cancel task",
        }),
        variant: "danger",
      });
    }
    setIsCancelModalOpen(false);
  };

  const taskName = shortTaskName(task.name);

  return (
    <>
      <DocumentTitle title={taskName} />
      <PageHeader
        title={taskName}
        label={<TaskStateLabel state={task.state} />}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/monitoring/$pulpDomain/tasks" params={{ pulpDomain }}>
                Tasks
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{taskName}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              isCancelable(task.state) && {
                key: "cancel",
                dropdownItemProps: {
                  children: "Cancel Task",
                  onClick: () => setIsCancelModalOpen(true),
                  ...disabledProps("change"),
                },
              },
              isTerminalTaskState(task.state) && {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete task",
                  onClick: () => setIsDeleteOpen(true),
                  ...disabledProps("delete"),
                },
              },
            ]}
          />
        }
      />

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <DescriptionList columnModifier={COLUMNS}>
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
                <DescriptionListTerm>Parent Task</DescriptionListTerm>
                <DescriptionListDescription>
                  {task.parent_task ? (
                    <Link
                      to="/monitoring/$pulpDomain/tasks/$taskId"
                      params={{
                        pulpDomain,
                        taskId: extractTaskId(task.parent_task),
                      }}
                    >
                      {extractTaskId(task.parent_task)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              {task.task_group && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Task group</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link
                      to="/monitoring/$pulpDomain/task-groups/$taskGroupId"
                      params={{
                        pulpDomain,
                        taskGroupId: extractTaskId(task.task_group),
                      }}
                    >
                      {extractTaskId(task.task_group)}
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
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

          {task.state === "failed" && (taskError || task.result != null) && (
            <StackItem>
              <Content component={ContentVariants.h2}>Error</Content>
              {taskError?.description && (
                <Content component={ContentVariants.p}>
                  {taskError.description}
                </Content>
              )}
              <CodeBlock>
                <CodeBlockCode>
                  {taskError?.traceback ||
                    (taskError && !taskError.description
                      ? JSON.stringify(taskError, null, 2)
                      : "") ||
                    (typeof task.result === "string"
                      ? task.result
                      : JSON.stringify(task.result, null, 2))}
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

          {profileUrls.length > 0 && (
            <StackItem>
              <Content component={ContentVariants.h2}>
                Profile artifacts
              </Content>
              <Content component="ul">
                {profileUrls.map(([name, url]) => (
                  <Content component="li" key={name}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {name}
                    </a>
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
                      <Link
                        to="/monitoring/$pulpDomain/tasks/$taskId"
                        params={{ pulpDomain, taskId: childId }}
                      >
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
      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete task"
        body="Delete this task's record? This action cannot be undone."
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(taskHref, {
            onSuccess: () => setIsDeleteOpen(false),
          })
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
