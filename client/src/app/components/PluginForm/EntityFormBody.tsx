import { type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Button, Form, ModalBody, ModalFooter } from "@patternfly/react-core";

import type { IEntityField } from "@catalog";
import { EntityFormFields } from "@app/components/EntityFormFields";
import type { ResourceFilterMap } from "@app/components/PluginForm/resourceFilter";

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
}

/**
 * Presentational body + footer for the plain (non-wizard) entity form. It is form
 * -hook-agnostic: it takes an already-built react-hook-form plus the resolved
 * fields, so both the generic `EntityModal` and the per-family modals (which supply
 * a typed form hook, e.g. `useRepositoryForm`) render an identical body.
 */
export const EntityFormBody = ({
  form,
  fields,
  isCreate,
  onSubmit,
  isSubmitting,
  hasPlugin,
  onClose,
  typeSelector,
  resourceFilter,
}: IEntityFormBodyProps) => (
  <>
    <ModalBody>
      <Form
        id={FORM_ID}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
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
