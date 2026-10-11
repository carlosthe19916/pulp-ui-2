import type React from "react";

import {
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Spinner,
} from "@patternfly/react-core";

import type { RepositoryTaskKind } from "../context/RepositoryTaskTrackerContext";

const TASK_LABEL: Record<RepositoryTaskKind, string> = {
  delete: "Deleting",
  update: "Updating",
};

/** Inline spinner + label shown in a row while its repository's task runs. */
export const RepositoryTaskStatus: React.FC<{ kind: RepositoryTaskKind }> = ({
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
