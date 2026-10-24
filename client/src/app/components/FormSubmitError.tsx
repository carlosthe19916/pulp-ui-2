import type React from "react";

import { Alert, FormAlert } from "@patternfly/react-core";

import type { IMutationErrorMessage } from "@app/utils/utils";

interface IFormSubmitErrorProps {
  /** The submission error to show, or null to render nothing. */
  error: IMutationErrorMessage | null;
}

/**
 * Top-of-form alert for a modal form's submission failure, rendered as the first child of
 * a `<Form>` (see `.rulesync/rules/forms.md`).
 */
export const FormSubmitError: React.FC<IFormSubmitErrorProps> = ({ error }) => {
  if (!error) return null;
  return (
    <FormAlert>
      <Alert variant="danger" isInline aria-live="polite" title={error.title}>
        {error.description}
      </Alert>
    </FormAlert>
  );
};
