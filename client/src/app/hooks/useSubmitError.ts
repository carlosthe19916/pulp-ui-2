import { useCallback, useState } from "react";

import type { IMutationErrorMessage } from "@app/utils/utils";

export interface IUseSubmitErrorResult {
  /** The current submission error, or null when there is none. */
  submitError: IMutationErrorMessage | null;
  /** Record a submission failure (built with `getMutationErrorMessage`). */
  setSubmitError: (error: IMutationErrorMessage) => void;
  /** Clear the error — call at the start of each submit so a retry resets it. */
  clearSubmitError: () => void;
}

/**
 * Standard state seam for a modal form's submission error. The form hook sets the
 * error in its mutation `onError` (or `catch` for `mutateAsync` modals) and clears
 * it when a new submit starts; the form renders it in a top-of-form `FormSubmitError`
 * (see `evals/forms.md`) instead of a danger toast.
 */
export const useSubmitError = (): IUseSubmitErrorResult => {
  const [submitError, setSubmitError] = useState<IMutationErrorMessage | null>(
    null,
  );
  const clearSubmitError = useCallback(() => setSubmitError(null), []);
  return { submitError, setSubmitError, clearSubmitError };
};
