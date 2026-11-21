import type React from "react";

import { Alert } from "@patternfly/react-core";

import { isForbiddenError } from "@app/utils/isHttpError";

interface IToolReadErrorProps {
  error: unknown;
  /** What the read does, completing "You don't have permission to …". */
  action: string;
  /** What failed to load, completing "Could not load …". */
  subject: string;
}

/** The alert a tool's card shows when its read fails. */
export const ToolReadError: React.FC<IToolReadErrorProps> = ({
  error,
  action,
  subject,
}) => (
  <Alert
    variant="danger"
    isInline
    isPlain
    title={
      isForbiddenError(error)
        ? `You don't have permission to ${action}`
        : `Could not load ${subject}`
    }
  />
);
