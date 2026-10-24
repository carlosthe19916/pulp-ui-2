import type React from "react";

import {
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Spinner,
} from "@patternfly/react-core";

import type { EntityTaskKind } from "@app/hooks/useResourceTasks";

const TASK_LABEL: Record<EntityTaskKind, string> = {
  delete: "Deleting",
  update: "Updating",
  sync: "Syncing",
  modify: "Changing content",
};

interface IEntityTaskStatusProps {
  kind?: EntityTaskKind;
}

/** Inline spinner + label shown in a row while its entity's single task runs. */
export const EntityTaskStatus: React.FC<IEntityTaskStatusProps> = ({
  kind,
}) => {
  const label = kind ? `${TASK_LABEL[kind]}…` : "In progress…";
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
