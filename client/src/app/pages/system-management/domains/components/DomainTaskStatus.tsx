import type React from "react";

import {
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Spinner,
} from "@patternfly/react-core";

import type { DomainTaskKind } from "../context/DomainTaskTrackerContext";

const TASK_LABEL: Record<DomainTaskKind, string> = {
  delete: "Deleting",
  update: "Updating",
};

/**
 * Inline "in progress" indicator for a row whose domain has a running task —
 * a small spinner next to muted text (à la tackle2-ui's IconWithLabel).
 */
export const DomainTaskStatus: React.FC<{ kind: DomainTaskKind }> = ({
  kind,
}) => {
  const label = `${TASK_LABEL[kind]}…`;
  return (
    <Flex
      flexWrap={{ default: "nowrap" }}
      spaceItems={{ default: "spaceItemsSm" }}
      alignItems={{ default: "alignItemsCenter" }}
    >
      <FlexItem>
        <Spinner size="md" aria-label={label} />
      </FlexItem>
      <FlexItem>
        <Content component={ContentVariants.small}>{label}</Content>
      </FlexItem>
    </Flex>
  );
};
