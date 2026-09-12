import type React from "react";

import { Page, SkipToContent } from "@patternfly/react-core";

import { BrowseSidebar } from "./browse-sidebar";
import { HeaderApp } from "./header";

interface IBrowseLayoutProps {
  children?: React.ReactNode;
}

/** Consumer-first shell for browse routes (no admin resource nav). */
export const BrowseLayout: React.FC<IBrowseLayoutProps> = ({ children }) => {
  const pageId = "main-content-page-layout-browse";
  const PageSkipToContent = (
    <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>
  );

  return (
    <Page
      masthead={<HeaderApp />}
      sidebar={<BrowseSidebar />}
      isManagedSidebar
      defaultManagedSidebarIsOpen
      skipToContent={PageSkipToContent}
      mainContainerId={pageId}
    >
      {children}
    </Page>
  );
};
