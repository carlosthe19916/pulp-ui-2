import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
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
import { TasksTable } from "@app/components/TasksTable";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  useSuspenseTaskGroupDetailQuery,
  useTaskGroupCancelMutation,
} from "@app/queries/task-groups";
import type { TaskState } from "@app/queries/tasks";
import { getMutationErrorMessage } from "@app/utils/utils";

const COUNTS = [
  "waiting",
  "running",
  "completed",
  "failed",
  "canceled",
  "canceling",
  "skipped",
] as const satisfies readonly TaskState[];

interface ITaskGroupDetailProps {
  href: string;
}

/** A task group (e.g. a replication): its counts, progress and tasks. */
export const TaskGroupDetail: React.FC<ITaskGroupDetailProps> = ({ href }) => {
  const { name: pulpDomain } = useSelectedDomain();
  const { addNotification } = useNotifications();
  const { data: group } = useSuspenseTaskGroupDetailQuery({ href });
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const cancelMutation = useTaskGroupCancelMutation({
    onSuccess: () =>
      addNotification({
        title: "Task group cancel requested",
        variant: "info",
      }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: "Failed to cancel task group",
        }),
        variant: "danger",
      }),
  });
  const isActive = (group.waiting ?? 0) + (group.running ?? 0) > 0;
  const title = group.description || "Task group";

  return (
    <>
      <DocumentTitle title={title} />
      <PageHeader
        title={title}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/monitoring/$pulpDomain/tasks" params={{ pulpDomain }}>
                Tasks
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{title}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              isActive && {
                key: "cancel",
                dropdownItemProps: {
                  children: "Cancel unfinished tasks",
                  onClick: () => setIsCancelOpen(true),
                },
              },
            ]}
          />
        }
      />
      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <DescriptionList
              isCompact
              isHorizontal
              columnModifier={{ md: "3Col" }}
            >
              {COUNTS.map((key) => (
                <DescriptionListGroup key={key}>
                  <DescriptionListTerm>
                    {key[0].toUpperCase() + key.slice(1)}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {group[key] ?? 0}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </StackItem>
          {(group.group_progress_reports ?? []).map((report) => (
            <StackItem key={report.code ?? report.message}>
              <Progress
                title={report.message}
                value={
                  report.total ? ((report.done ?? 0) / report.total) * 100 : 0
                }
                label={`${report.done ?? 0} / ${report.total ?? 0}`}
              />
            </StackItem>
          ))}
          <StackItem>
            <Content component={ContentVariants.h2}>Tasks</Content>
            <TasksTable lockedParams={{ task_group: href }} />
          </StackItem>
        </Stack>
      </PageSection>
      <ConfirmActionModal
        isOpen={isCancelOpen}
        title="Cancel task group"
        body="Cancel every task of this group that hasn't finished?"
        confirmLabel="Cancel tasks"
        cancelLabel="Close"
        confirmVariant="primary"
        isConfirming={cancelMutation.isPending}
        onConfirm={() =>
          cancelMutation.mutate(href, {
            onSuccess: () => setIsCancelOpen(false),
          })
        }
        onCancel={() => setIsCancelOpen(false)}
      />
    </>
  );
};
