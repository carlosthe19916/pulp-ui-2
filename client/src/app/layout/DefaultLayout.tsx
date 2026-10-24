import type React from "react";

import { Page, SkipToContent } from "@patternfly/react-core";

import { HeaderApp } from "./HeaderApp";
import { SidebarApp } from "./SidebarApp";

interface IDefaultLayoutProps {
  children?: React.ReactNode;
}

export const DefaultLayout: React.FC<IDefaultLayoutProps> = ({ children }) => {
  const pageId = "main-content-page-layout-horizontal-nav";
  const PageSkipToContent = (
    <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>
  );

  return (
    <Page
      masthead={<HeaderApp />}
      sidebar={<SidebarApp />}
      isManagedSidebar
      defaultManagedSidebarIsOpen
      skipToContent={PageSkipToContent}
      mainContainerId={pageId}
    >
      {children}
    </Page>
  );
};
