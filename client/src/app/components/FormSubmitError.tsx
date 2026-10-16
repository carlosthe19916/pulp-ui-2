import { Alert, FormAlert } from "@patternfly/react-core";

import type { IMutationErrorMessage } from "@app/utils/utils";

interface IFormSubmitErrorProps {
  /** The submission error to show, or null to render nothing. */
  error: IMutationErrorMessage | null;
}

/**
 * Top-of-form submission-error alert. Rendered as the first child of a `<Form>`, it
 * shows a modal form's create/update/action failure inline (PatternFly Form error
 * guidelines) instead of a detached toast. See `evals/forms.md`.
 */
export const FormSubmitError = ({ error }: IFormSubmitErrorProps) => {
  if (!error) return null;
  return (
    <FormAlert>
      <Alert variant="danger" isInline aria-live="polite" title={error.title}>
        {error.description}
      </Alert>
    </FormAlert>
  );
};
