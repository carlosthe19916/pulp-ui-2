import type React from "react";

import type { EntityType } from "@catalog";

import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
} from "@patternfly/react-core";

import { TableEmptyState } from "@app/components/TableEmptyState";
import type { ICreateTypeSelect } from "@app/hooks/useCreateTypeSelect";
import { EntityFormPage, type ISubmitHelpers } from "@app/plugin-forms";
import type { IMutationErrorMessage } from "@app/utils/utils";

interface IEntityCreatePageProps {
  entityType: EntityType;
  /** From `useCreateTypeSelect`. */
  selection: ICreateTypeSelect;
  listLink: React.ReactNode;
  submitError: IMutationErrorMessage | null;
  isSubmitting: boolean;
  /** Runs the create POST against `apiPath`; call `saved()` from its success callback. */
  onSubmit: (
    body: Record<string, unknown>,
    helpers: ISubmitHelpers & { apiPath: string },
  ) => void;
  /** Where to go after creating, given the new object's href when the request returned it. */
  onSaved: (created: { pulpType: string; href?: string }) => void;
  onCancel: () => void;
}

/**
 * A create page's frame around the selected type's plugin form: Type select, breadcrumb and
 * the empty state when no type can be created. Controlled: the page owns the mutation,
 * toasts and navigation.
 */
export const EntityCreatePage: React.FC<IEntityCreatePageProps> = ({
  entityType,
  selection: { pulpType, entry, apiPath, typeSelect, initialValues },
  listLink,
  submitError,
  isSubmitting,
  onSubmit,
  onSaved,
  onCancel,
}) => {
  if (!pulpType || !entry || !apiPath) {
    return (
      <PageSection>
        <TableEmptyState title={`No ${entityType} type can be created`} />
      </PageSection>
    );
  }

  return (
    <EntityFormPage
      // A new type is a new form: its defaults, resolver and sections start over.
      key={pulpType}
      form={entry.form}
      mode="create"
      initialValues={initialValues}
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbItem>{listLink}</BreadcrumbItem>
          <BreadcrumbItem isActive>Create</BreadcrumbItem>
        </Breadcrumb>
      }
      typeSelect={typeSelect}
      submitError={submitError}
      isSubmitting={isSubmitting}
      onSubmit={(body, helpers) => onSubmit(body, { ...helpers, apiPath })}
      onSaved={(href) => onSaved({ pulpType, href })}
      onCancel={onCancel}
    />
  );
};
