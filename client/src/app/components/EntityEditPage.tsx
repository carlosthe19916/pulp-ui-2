import type React from "react";

import type { EntityType } from "@catalog";

import {
  Breadcrumb,
  BreadcrumbItem,
  Label,
  PageSection,
} from "@patternfly/react-core";

import { EditDuringTaskAlert } from "@app/components/EditDuringTaskAlert";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { EntityFormPage, type ISubmitHelpers } from "@app/forms";
import type { IRunningTask } from "@app/hooks/useRunningTask";
import type { IMutationErrorMessage } from "@app/utils/utils";
import { getEntityForm } from "@plugins";

interface IEntityEditPageProps {
  entityType: EntityType;
  pulpType: string;
  /** The edited object, as the detail query returned it. */
  editedObject: object;
  name: string;
  /** `useObjectPermissions({ href }).can("change")`. */
  canChange: boolean;
  /** The task running on the object; Pulp queues the save behind it. */
  running?: IRunningTask;
  listLink: React.ReactNode;
  detailLink: React.ReactNode;
  submitError: IMutationErrorMessage | null;
  isSubmitting: boolean;
  onSubmit: (body: Record<string, unknown>, helpers: ISubmitHelpers) => void;
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * An edit page's frame around its plugin form: permission gate, running-task notice,
 * plugin label and breadcrumb. Controlled: the page owns the mutation, toasts and navigation.
 */
export const EntityEditPage: React.FC<IEntityEditPageProps> = ({
  entityType,
  pulpType,
  editedObject,
  name,
  canChange,
  running,
  listLink,
  detailLink,
  submitError,
  isSubmitting,
  onSubmit,
  onSaved,
  onCancel,
}) => {
  const entry = getEntityForm({ entity: entityType, pulpType, mode: "edit" });

  // The route loader only resolves for types with an edit form.
  if (!entry) return null;

  // The page is reachable by URL, so it checks for itself what the list's Edit action does.
  if (!canChange) {
    return (
      <PageSection>
        <UnauthorizedState
          description={`You don't have permission to change ${entityType} "${name}".`}
        />
      </PageSection>
    );
  }

  return (
    <EntityFormPage
      form={entry.form}
      mode="edit"
      entity={editedObject}
      label={<Label color="blue">plugin: {pulpType}</Label>}
      notice={
        running && (
          <EditDuringTaskAlert entityLabel={entityType} running={running} />
        )
      }
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbItem>{listLink}</BreadcrumbItem>
          <BreadcrumbItem>{detailLink}</BreadcrumbItem>
          <BreadcrumbItem isActive>Edit</BreadcrumbItem>
        </Breadcrumb>
      }
      submitError={submitError}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
};
