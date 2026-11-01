import type React from "react";
import { useEffect, useState } from "react";

import { Page, SkipToContent } from "@patternfly/react-core";

import { useLocalStorage } from "@app/hooks/useStorage";

import { DOCK_ID, DockApp } from "./DockApp";
import { HeaderApp, MOBILE_DOCK_TOGGLE_ID } from "./HeaderApp";
import { useIsMobile } from "./useIsMobile";

interface IDefaultLayoutProps {
  children?: React.ReactNode;
}

/** PatternFly's docked nav layout: https://www.patternfly.org/components/navigation/react-demos#docked-nav */
export const DefaultLayout: React.FC<IDefaultLayoutProps> = ({ children }) => {
  const pageId = "main-content-page-layout-docked-nav";
  const PageSkipToContent = (
    <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>
  );

  const isMobile = useIsMobile();
  // On desktop the dock starts expanded and remembers the user's toggle.
  const [isDockPinned, setIsDockPinned] = useLocalStorage<boolean>({
    key: "dock-expanded-preference",
    defaultValue: true,
  });
  // Opened for a moment (mobile, or a nav group clicked in the collapsed dock): floats
  // over the page and closes again once the user picks a page or clicks away.
  const [isDockOpen, setIsDockOpen] = useState(false);
  const isDockFloating = isDockOpen && (isMobile || !isDockPinned);
  const isDockExpanded = isMobile ? isDockOpen : isDockPinned || isDockOpen;
  const isDockOverlay = !isMobile && isDockFloating;

  const closeDock = () => setIsDockOpen(false);

  useEffect(() => {
    if (!isDockFloating) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInside = [DOCK_ID, MOBILE_DOCK_TOGGLE_ID].some((id) =>
        document.getElementById(id)?.contains(target),
      );
      if (!isInside) {
        closeDock();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDock();
      }
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDockFloating]);

  const onToggleDock = () => {
    if (isMobile) {
      setIsDockOpen(!isDockOpen);
      return;
    }
    closeDock();
    setIsDockPinned(!isDockExpanded);
  };

  const onOpenDock = () => setIsDockOpen(true);

  const onNavSelect = () => {
    if (isDockFloating) {
      closeDock();
    }
  };

  return (
    <Page
      variant="docked"
      isDockExpanded={isDockExpanded}
      isDockOverlay={isDockOverlay}
      masthead={
        <HeaderApp
          isDockExpanded={isDockExpanded}
          onToggleDock={onToggleDock}
        />
      }
      dockContent={
        <DockApp
          isDockExpanded={isDockExpanded}
          isHidden={isMobile && !isDockExpanded}
          onToggleDock={onToggleDock}
          onOpenDock={onOpenDock}
          onNavSelect={onNavSelect}
        />
      }
      skipToContent={PageSkipToContent}
      mainContainerId={pageId}
    >
      {children}
    </Page>
  );
};
