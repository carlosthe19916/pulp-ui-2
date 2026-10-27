import type React from "react";

import { EmptyState, EmptyStateBody } from "@patternfly/react-core";
import LockIcon from "@patternfly/react-icons/dist/esm/icons/lock-icon";

export const UnauthorizedState: React.FC = () => {
  return (
    <EmptyState
      titleText="403: Access denied"
      headingLevel="h4"
      icon={LockIcon}
    >
      <EmptyStateBody>
        You do not have permission to view this page. Contact your administrator
        if you believe this is an error.
      </EmptyStateBody>
    </EmptyState>
  );
};
