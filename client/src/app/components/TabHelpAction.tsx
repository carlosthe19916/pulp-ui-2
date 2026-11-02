import type React from "react";
import { useRef } from "react";

import { Popover, TabAction } from "@patternfly/react-core";
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";

interface ITabHelpActionProps {
  /** The tab's name, for the button's accessible label. */
  tabName: string;
  headerContent: React.ReactNode;
  bodyContent: React.ReactNode;
}

/** A help button beside a tab's title that opens a popover (PatternFly's Tabs help action). */
export const TabHelpAction: React.FC<ITabHelpActionProps> = ({
  tabName,
  headerContent,
  bodyContent,
}) => {
  const ref = useRef<HTMLElement>(null);
  return (
    <>
      <TabAction aria-label={`More information about ${tabName}`} ref={ref}>
        <HelpIcon />
      </TabAction>
      <Popover
        triggerRef={ref}
        headerContent={headerContent}
        bodyContent={bodyContent}
      />
    </>
  );
};
