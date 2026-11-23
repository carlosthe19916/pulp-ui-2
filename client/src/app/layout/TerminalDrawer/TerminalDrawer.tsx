import type React from "react";
import { lazy, Suspense, useState } from "react";

import {
  Button,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Tab,
  Tabs,
  TabTitleText,
  Tooltip,
} from "@patternfly/react-core";
import RhUiMinusIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-minus-icon";
import RhUiRestoreWindowIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-restore-window-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import styles from "./TerminalDrawer.module.css";

// xterm.js loads only once someone opens the terminal.
const WebTerminal = lazy(() =>
  import("./WebTerminal").then((module) => ({ default: module.WebTerminal })),
);

/** As many terminals as OpenShift's web terminal allows. */
const MAX_TERMINALS = 8;
/** The height left when minimized, set in the stylesheet. */
const HEADER_HEIGHT = "var(--pulp-terminal-header-height)";
const DEFAULT_HEIGHT = 385;

interface ITerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * The page with a command line docked under it, following OpenShift's web terminal: an
 * inline bottom drawer with tabbed terminals, which can be minimized and resized.
 */
export const TerminalDrawer: React.FC<ITerminalDrawerProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const [terminals, setTerminals] = useState([1]);
  const [activeTerminal, setActiveTerminal] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const addTerminal = () => {
    const next = (terminals.at(-1) ?? 0) + 1;
    setTerminals([...terminals, next]);
    setActiveTerminal(next);
  };

  const closeTerminal = (closed: number) => {
    const remaining = terminals.filter((terminal) => terminal !== closed);
    if (remaining.length === 0) {
      // Closing the last one closes the drawer; it opens again with a fresh terminal.
      onClose();
      setTerminals([(terminals.at(-1) ?? 0) + 1]);
      setActiveTerminal((terminals.at(-1) ?? 0) + 1);
      return;
    }
    setTerminals(remaining);
    if (closed === activeTerminal) {
      setActiveTerminal(
        remaining[Math.max(0, terminals.indexOf(closed) - 1)] ?? remaining[0]!,
      );
    }
  };

  const panel = (
    <DrawerPanelContent
      className={styles.panel}
      isResizable
      onResize={(_event, size) => {
        setIsMinimized(size <= 48);
        setHeight(size);
      }}
      defaultSize={isMinimized ? "0px" : `${height}px`}
      minSize={HEADER_HEIGHT}
      resizeAriaLabel="Resize the command line terminal"
    >
      <DrawerHead className={styles.header}>
        <Flex
          grow={{ default: "grow" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem className={spacing.pxSm}>
            Pulp command line terminal
          </FlexItem>
          <FlexItem align={{ default: "alignRight" }}>
            <DrawerActions className={spacing.m_0}>
              <Tooltip
                content={isMinimized ? "Restore terminal" : "Minimize terminal"}
              >
                <Button
                  variant="plain"
                  aria-label={
                    isMinimized ? "Restore terminal" : "Minimize terminal"
                  }
                  icon={
                    isMinimized ? <RhUiRestoreWindowIcon /> : <RhUiMinusIcon />
                  }
                  onClick={() => setIsMinimized(!isMinimized)}
                />
              </Tooltip>
              <Tooltip content="Close terminal">
                <DrawerCloseButton
                  aria-label="Close terminal"
                  onClick={onClose}
                />
              </Tooltip>
            </DrawerActions>
          </FlexItem>
        </Flex>
      </DrawerHead>
      <Tabs
        className={styles.tabs}
        activeKey={activeTerminal}
        onSelect={(_event, key) => setActiveTerminal(Number(key))}
        isBox
        onAdd={terminals.length < MAX_TERMINALS ? addTerminal : undefined}
        addButtonAriaLabel="Add a terminal"
        onClose={(_event, key) => closeTerminal(Number(key))}
        aria-label="Terminals"
      >
        {terminals.map((terminal) => (
          <Tab
            key={terminal}
            eventKey={terminal}
            title={<TabTitleText>Terminal {terminal}</TabTitleText>}
            closeButtonAriaLabel={`Close terminal ${terminal}`}
            className={styles.tab}
          >
            {isOpen ? (
              <Suspense fallback={null}>
                <WebTerminal />
              </Suspense>
            ) : null}
          </Tab>
        ))}
      </Tabs>
    </DrawerPanelContent>
  );

  return (
    <Drawer
      isInline
      position="bottom"
      isExpanded={isOpen}
      className={styles.drawer}
    >
      <DrawerContent panelContent={panel}>
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};
