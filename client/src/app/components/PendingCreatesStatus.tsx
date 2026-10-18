import type React from "react";

import {
  Content,
  ContentVariants,
  Flex,
  Spinner,
} from "@patternfly/react-core";

import { getEntityLabel } from "@catalog";
import { usePendingCreates } from "@app/hooks/usePendingCreates";
import type { PendingCreateEntityType } from "@app/hooks/usePendingCreatesStore";

/**
 * Inline "creating…" status for a list toolbar: a spinner + live count of
 * in-flight async creates for this entity type. Renders nothing when idle and
 * disappears once the creates settle (see `usePendingCreates`).
 */
export const PendingCreatesStatus: React.FC<{
  entityType: PendingCreateEntityType;
}> = ({ entityType }) => {
  const { pendingCount } = usePendingCreates({ entityType });
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
