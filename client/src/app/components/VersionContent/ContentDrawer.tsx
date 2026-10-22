import type React from "react";

import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
} from "@patternfly/react-core";

import { ContentDrawerPanel } from "./ContentDrawerPanel";

interface IContentDrawerProps {
  selectedHref: string | null;
  onClose: () => void;
  children: React.ReactNode;
}

/** Inline side drawer showing the selected content unit's detail next to a list. */
export const ContentDrawer: React.FC<IContentDrawerProps> = ({
  selectedHref,
  onClose,
  children,
}) => (
  <Drawer isExpanded={selectedHref != null} isInline>
    <DrawerContent
      panelContent={
        <ContentDrawerPanel href={selectedHref} onClose={onClose} />
      }
    >
      <DrawerContentBody>{children}</DrawerContentBody>
    </DrawerContent>
  </Drawer>
);
