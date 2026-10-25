import type React from "react";
import { useEffect, useState } from "react";

import { Page, SkipToContent } from "@patternfly/react-core";

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
  const [isDockExpanded, setIsDockExpanded] = useState(false);
  // Opened by clicking a nav group in the collapsed dock: floats over the page
  // and closes again once the user picks a page or clicks away.
  const [isDockOverlay, setIsDockOverlay] = useState(false);
  const isDockFloating = isDockExpanded && (isDockOverlay || isMobile);

  const closeDock = () => {
    setIsDockExpanded(false);
    setIsDockOverlay(false);
  };

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
    if (isDockExpanded) {
      closeDock();
    } else {
      setIsDockExpanded(true);
    }
  };

  const onOpenDock = () => {
    setIsDockExpanded(true);
    setIsDockOverlay(true);
  };

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
