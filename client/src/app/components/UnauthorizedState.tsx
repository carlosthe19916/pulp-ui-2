import type React from "react";

import { EmptyState, EmptyStateBody } from "@patternfly/react-core";
import LockIcon from "@patternfly/react-icons/dist/esm/icons/lock-icon";

export const UnauthorizedState: React.FC = () => {
  return (
    <EmptyState
      titleText="Access permissions needed"
      headingLevel="h4"
      icon={LockIcon}
    >
      <EmptyStateBody>
        To view this, ask your administrator to adjust your permissions.
      </EmptyStateBody>
    </EmptyState>
  );
};
