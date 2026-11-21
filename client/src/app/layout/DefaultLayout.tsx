import type React from "react";
import { lazy, Suspense, useState } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  Page,
  SkipToContent,
} from "@patternfly/react-core";

import { ENV } from "@app/env";
import { useLocalStorage } from "@app/hooks/useStorage";

import {
  type AssistantDisplayMode,
  isAssistantDisplayMode,
} from "./assistantDisplayMode";
import { HeaderApp } from "./HeaderApp";
import { SidebarApp } from "./SidebarApp";
import {
  TASK_DRAWER_ID,
  TASK_DRAWER_TOGGLE_ID,
  TaskDrawer,
} from "./TaskDrawer";
import { TaskFinishRefresher } from "./TaskFinishRefresher";

// The assistant's code loads only when a provider is configured.
const AiAssistant = lazy(() =>
  import("@ai").then((module) => ({ default: module.AiAssistant })),
);

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

  const isAiEnabled = ENV.AI_ENABLED === "true";
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [storedAssistantMode, setAssistantMode] =
    useLocalStorage<AssistantDisplayMode>({
      key: "ai-assistant-display-mode",
      defaultValue: "default",
    });
  const assistantMode = isAssistantDisplayMode(storedAssistantMode)
    ? storedAssistantMode
    : "default";
  // The drawer panel the assistant renders into in drawer mode.
  const [assistantPanel, setAssistantPanel] = useState<HTMLDivElement | null>(
    null,
  );

  const closeTaskDrawer = () => {
    setIsTaskDrawerExpanded(false);
    document.getElementById(TASK_DRAWER_TOGGLE_ID)?.focus();
  };

  const page = (
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

  if (!isAiEnabled) {
    return page;
  }

  // With AI on, the page always sits in an inline drawer (PatternFly's "inline drawer" chatbot
  // pattern), so opening the assistant there resizes the page instead of remounting it.
  return (
    <>
      <Drawer
        isInline
        isExpanded={isAssistantOpen && assistantMode === "drawer"}
      >
        <DrawerContent
          panelContent={
            <DrawerPanelContent>
              <div ref={setAssistantPanel} />
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody>{page}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
      {/* Outside the Page, whose main area would be the chat window's positioning context. */}
      <Suspense fallback={null}>
        <AiAssistant
          isOpen={isAssistantOpen}
          onOpenChange={setIsAssistantOpen}
          displayMode={assistantMode}
          onDisplayModeChange={setAssistantMode}
          drawerPanel={assistantPanel}
        />
      </Suspense>
    </>
  );
};
