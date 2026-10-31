import type React from "react";

import { EmptyState, EmptyStateBody } from "@patternfly/react-core";
import LockIcon from "@patternfly/react-icons/dist/esm/icons/lock-icon";

interface IUnauthorizedStateProps {
  /** What the user can't do here; defaults to viewing the page. */
  description?: string;
}

export const UnauthorizedState: React.FC<IUnauthorizedStateProps> = ({
  description = "You do not have permission to view this page.",
}) => {
  return (
    <EmptyState
      titleText="403: Access denied"
      headingLevel="h4"
      icon={LockIcon}
    >
      <EmptyStateBody>
        {description} Contact your administrator if you believe this is an
        error.
      </EmptyStateBody>
    </EmptyState>
  );
};
