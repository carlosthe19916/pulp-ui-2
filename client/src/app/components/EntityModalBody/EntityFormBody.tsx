import type React from "react";
import { type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { IEntityField } from "@catalog";

import { Button, Form, ModalBody, ModalFooter } from "@patternfly/react-core";

import { EntityFormFields } from "@app/components/EntityFormFields";
import { FormSubmitError } from "@app/components/FormSubmitError";
import type { ResourceFilterMap } from "@app/utils/resourceFilter";
import type { IMutationErrorMessage } from "@app/utils/utils";

const FORM_ID = "entity-form";

interface IEntityFormBodyProps {
  form: UseFormReturn<Record<string, unknown>>;
  fields: IEntityField[];
  isCreate: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  /** Create is blocked until a plugin type is resolved. */
  hasPlugin: boolean;
  onClose: () => void;
  typeSelector?: ReactNode;
  resourceFilter: ResourceFilterMap;
  /** Submission failure shown at the top of the form (see `.rulesync/rules/forms.md`). */
  submitError: IMutationErrorMessage | null;
}

/**
 * Body + footer for the plain (non-wizard) entity form. Takes an already-built
 * react-hook-form, so every family's modal renders the same body.
 */
export const EntityFormBody: React.FC<IEntityFormBodyProps> = ({
  form,
  fields,
  isCreate,
  onSubmit,
  isSubmitting,
  hasPlugin,
  onClose,
  typeSelector,
  resourceFilter,
  submitError,
}) => (
  <>
    <ModalBody>
      <Form
        id={FORM_ID}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <FormSubmitError error={submitError} />
        {typeSelector}
        <EntityFormFields
          fields={fields}
          control={form.control}
          idPrefix={FORM_ID}
          resourceFilter={resourceFilter}
        />
      </Form>
    </ModalBody>
    <ModalFooter>
      <Button
        variant="primary"
        type="submit"
        form={FORM_ID}
        isLoading={isSubmitting}
        isDisabled={isSubmitting || (isCreate && !hasPlugin)}
      >
        {isCreate ? "Create" : "Save"}
      </Button>
      <Button variant="link" onClick={onClose}>
        Cancel
      </Button>
    </ModalFooter>
  </>
);
