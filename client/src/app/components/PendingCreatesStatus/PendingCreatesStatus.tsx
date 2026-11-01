import type React from "react";

import {
  Content,
  ContentVariants,
  Flex,
  Spinner,
} from "@patternfly/react-core";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  type PendingCreateEntityType,
  useTrackedTasksStore,
} from "@app/stores/useTrackedTasksStore";
import { getEntityLabel } from "@app/utils/entityLabel";

interface IPendingCreatesStatusProps {
  entityType: PendingCreateEntityType;
}

/**
 * Toolbar spinner + live count of in-flight async creates for an entity type; renders
 * nothing when idle.
 */
export const PendingCreatesStatus: React.FC<IPendingCreatesStatusProps> = ({
  entityType,
}) => {
  const domain = useSelectedDomain();
  // Scoped to this list's type and domain; `TaskTracker` drops each create once it settles.
  const pendingCount = useTrackedTasksStore(
    (state) =>
      state.tasks.filter(
        (task) =>
          task.kind === "create" &&
          task.entityType === entityType &&
          task.domainName === domain.name,
      ).length,
  );
  if (pendingCount === 0) return null;

  const noun = getEntityLabel(entityType).toLowerCase();
  const label = pendingCount === 1 ? noun : `${noun}s`;

  return (
    <Flex
      spaceItems={{ default: "spaceItemsSm" }}
      alignItems={{ default: "alignItemsCenter" }}
      flexWrap={{ default: "nowrap" }}
      role="status"
      aria-live="polite"
    >
      {/* Decorative: the text conveys the state. */}
      <Spinner size="md" aria-hidden />
      <Content component={ContentVariants.small}>
        Creating {pendingCount} {label}…
      </Content>
    </Flex>
  );
};
