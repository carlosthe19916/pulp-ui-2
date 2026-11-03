import type React from "react";
import { useState } from "react";

import { Page, SkipToContent } from "@patternfly/react-core";

import { useLocalStorage } from "@app/hooks/useStorage";

import { HeaderApp } from "./HeaderApp";
import { SidebarApp } from "./SidebarApp";
import {
  TASK_DRAWER_ID,
  TASK_DRAWER_TOGGLE_ID,
  TaskDrawer,
} from "./TaskDrawer";
import { TaskFinishRefresher } from "./TaskFinishRefresher";

interface IDefaultLayoutProps {
  children?: React.ReactNode;
}

/** PatternFly's masthead + sidebar layout: https://www.patternfly.org/components/navigation#expandable */
export const DefaultLayout: React.FC<IDefaultLayoutProps> = ({ children }) => {
  const pageId = "main-content-page-layout-expandable-nav";
  const PageSkipToContent = (
    <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>
  );

  const [isMobile, setIsMobile] = useState(false);
  // On desktop the sidebar starts open and remembers the user's toggle.
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] =
    useLocalStorage<boolean>({
      key: "sidebar-expanded-preference",
      defaultValue: true,
    });
  // On mobile the sidebar overlays the page, so it starts closed and closes after a pick.
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTaskDrawerExpanded, setIsTaskDrawerExpanded] = useState(false);

  const isSidebarOpen = isMobile ? isMobileSidebarOpen : isDesktopSidebarOpen;

  const onSidebarToggle = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

  const onNavSelect = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const closeTaskDrawer = () => {
    setIsTaskDrawerExpanded(false);
    document.getElementById(TASK_DRAWER_TOGGLE_ID)?.focus();
  };

  return (
    <Page
      masthead={
        <HeaderApp
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={onSidebarToggle}
          isTaskDrawerExpanded={isTaskDrawerExpanded}
          onToggleTaskDrawer={() =>
            setIsTaskDrawerExpanded(!isTaskDrawerExpanded)
          }
        />
      }
      sidebar={
        <SidebarApp isSidebarOpen={isSidebarOpen} onNavSelect={onNavSelect} />
      }
      onPageResize={(_event, { mobileView }) => setIsMobile(mobileView)}
      notificationDrawer={<TaskDrawer onClose={closeTaskDrawer} />}
      isNotificationDrawerExpanded={isTaskDrawerExpanded}
      onNotificationDrawerExpand={() =>
        document
          .querySelector<HTMLElement>(`#${TASK_DRAWER_ID} button`)
          ?.focus()
      }
      skipToContent={PageSkipToContent}
      mainContainerId={pageId}
    >
      {children}
      <TaskFinishRefresher />
    </Page>
  );
};
