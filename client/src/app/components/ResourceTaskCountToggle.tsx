import type React from "react";

import { Icon } from "@patternfly/react-core";
import TasksIcon from "@patternfly/react-icons/dist/esm/icons/tasks-icon";

/**
 * Collapsed content for a row's compound-expandable task cell: icon + active count.
 * Unstyled so PatternFly's compound-expand `Td` renders it as its link toggle.
 */
export const ResourceTaskCountToggle: React.FC<{ count: number }> = ({
  count,
}) => (
  <>
    <Icon isInline>
      <TasksIcon title="Tasks in progress" />
    </Icon>{" "}
    {count}
  </>
);
