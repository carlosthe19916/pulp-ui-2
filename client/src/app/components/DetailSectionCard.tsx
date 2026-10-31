import type React from "react";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Icon,
} from "@patternfly/react-core";
import CogIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import KeyIcon from "@patternfly/react-icons/dist/esm/icons/key-icon";
import LockIcon from "@patternfly/react-icons/dist/esm/icons/lock-icon";
import NetworkIcon from "@patternfly/react-icons/dist/esm/icons/network-icon";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import ServerIcon from "@patternfly/react-icons/dist/esm/icons/server-icon";
import TachometerAltIcon from "@patternfly/react-icons/dist/esm/icons/tachometer-alt-icon";
import UserShieldIcon from "@patternfly/react-icons/dist/esm/icons/user-shield-icon";

// Icons for the shared form sections, by section id; plugin sections get the default.
const SECTION_ICONS: Record<string, React.ComponentType> = {
  essentials: CogIcon,
  auth: KeyIcon,
  tls: LockIcon,
  proxy: NetworkIcon,
  downloads: TachometerAltIcon,
  timeouts: OutlinedClockIcon,
  access: UserShieldIcon,
  serving: ServerIcon,
  metadata: InfoCircleIcon,
};

interface IDetailSectionCardProps {
  /** A form section id (or `serving` / `metadata`); picks the icon. */
  id: string;
  title: string;
  children: React.ReactNode;
}

/** One titled group of an object's settings on its Details tab. */
export const DetailSectionCard: React.FC<IDetailSectionCardProps> = ({
  id,
  title,
  children,
}) => {
  const IconComponent = SECTION_ICONS[id] ?? CubesIcon;
  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>
          <Flex
            spaceItems={{ default: "spaceItemsSm" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem>
              <Icon size="md" isInline>
                <IconComponent />
              </Icon>
            </FlexItem>
            <FlexItem>{title}</FlexItem>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
};
