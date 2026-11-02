import type React from "react";

import { Flex, FlexItem, Icon } from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import MinusCircleIcon from "@patternfly/react-icons/dist/esm/icons/minus-circle-icon";

export type StatusLevel = "success" | "warning" | "danger" | "neutral";

interface IStatusTextProps {
  status: StatusLevel;
  children: React.ReactNode;
}

const ICONS: Record<StatusLevel, React.ReactNode> = {
  success: <CheckCircleIcon />,
  warning: <ExclamationTriangleIcon />,
  danger: <ExclamationCircleIcon />,
  neutral: <MinusCircleIcon />,
};

/** A state with its icon, so it never relies on color alone. */
export const StatusText: React.FC<IStatusTextProps> = ({
  status,
  children,
}) => (
  <Flex
    spaceItems={{ default: "spaceItemsSm" }}
    alignItems={{ default: "alignItemsCenter" }}
    flexWrap={{ default: "nowrap" }}
  >
    <FlexItem>
      <Icon status={status === "neutral" ? undefined : status}>
        {ICONS[status]}
      </Icon>
    </FlexItem>
    <FlexItem>{children}</FlexItem>
  </Flex>
);
