import type React from "react";

import {
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Spinner,
} from "@patternfly/react-core";

import type { RemoteTaskKind } from "../context/RemoteTaskTrackerContext";

const TASK_LABEL: Record<RemoteTaskKind, string> = {
  delete: "Deleting",
  update: "Updating",
};

/** Inline spinner + label shown in a row while its remote's task runs. */
export const RemoteTaskStatus: React.FC<{ kind: RemoteTaskKind }> = ({
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
