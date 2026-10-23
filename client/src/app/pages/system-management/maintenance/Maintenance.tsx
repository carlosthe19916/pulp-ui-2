import type React from "react";
import { useState } from "react";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Content,
  ContentVariants,
  Gallery,
  PageSection,
} from "@patternfly/react-core";

import type { IEntityField } from "@catalog";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { TaskActionModal } from "@app/components/TaskActionModal";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  type MaintenanceOperation,
  useMaintenanceMutation,
} from "@app/queries/maintenance";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

interface IOperation {
  operation: MaintenanceOperation;
  title: string;
  description: string;
  submitLabel: string;
  fields: IEntityField[];
}

const OPERATIONS: IOperation[] = [
  {
    operation: "orphans/cleanup/",
    title: "Clean up orphans",
    description:
      "Deletes content in no repository version, and artifacts in no content, to free storage.",
    submitLabel: "Clean up",
    fields: [
      {
        key: "orphan_protection_time",
        label: "Protection time (minutes)",
        type: "number",
        helpText:
          "Keep orphans newer than this; protects uploads not yet added to a repository.",
      },
    ],
  },
  {
    operation: "repositories/reclaim_space/",
    title: "Reclaim space",
    description:
      "Deletes the files of on-demand content in the chosen repositories; Pulp downloads them again when requested.",
    submitLabel: "Reclaim",
    fields: [
      {
        key: "repo_hrefs",
        label: "Repositories",
        type: "asyncResource",
        resourceKind: "repository",
        multiple: true,
        required: true,
      },
    ],
  },
  {
    operation: "repair/",
    title: "Repair storage",
    description:
      "Re-downloads missing or corrupted artifacts of every repository in this domain.",
    submitLabel: "Repair",
    fields: [
      {
        key: "verify_checksums",
        label: "Verify checksums",
        type: "boolean",
        defaultValue: true,
        helpText: "Also detect corrupted files (slower).",
      },
    ],
  },
];

/** Domain-wide storage maintenance, each operation a task. */
export const Maintenance: React.FC = () => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const [active, setActive] = useState<IOperation | null>(null);
  const mutation = useMaintenanceMutation({
    onSuccess: (data, { operation }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `${OPERATIONS.find((item) => item.operation === operation)?.title ?? "Maintenance"} started`,
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to start the task",
        }),
      ),
  });
  const close = () => {
    clearSubmitError();
    setActive(null);
  };

  return (
    <>
      <DocumentTitle title="Maintenance" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Maintenance</Content>
        <Content component={ContentVariants.p}>
          Free and repair storage in this domain.
        </Content>
      </PageSection>
      <PageSection>
        <Gallery hasGutter minWidths={{ default: "300px" }}>
          {OPERATIONS.map((item) => (
            <Card key={item.operation}>
              <CardTitle>{item.title}</CardTitle>
              <CardBody>{item.description}</CardBody>
              <CardFooter>
                <Button variant="secondary" onClick={() => setActive(item)}>
                  {item.submitLabel}…
                </Button>
              </CardFooter>
            </Card>
          ))}
        </Gallery>
      </PageSection>
      {active && (
        <TaskActionModal
          title={active.title}
          description={active.description}
          submitLabel={active.submitLabel}
          fields={active.fields}
          isSubmitting={mutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            mutation.mutate(
              { operation: active.operation, body },
              { onSuccess: close },
            );
          }}
          onClose={close}
        />
      )}
    </>
  );
};
