import type React from "react";

import {
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Spinner,
} from "@patternfly/react-core";

import type { DistributionTaskKind } from "../context/DistributionTaskTrackerContext";

const TASK_LABEL: Record<DistributionTaskKind, string> = {
  delete: "Deleting",
  update: "Updating",
};

/** Inline spinner + label shown in a row while its distribution's task runs. */
export const DistributionTaskStatus: React.FC<{
  kind: DistributionTaskKind;
}> = ({ kind }) => {
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
