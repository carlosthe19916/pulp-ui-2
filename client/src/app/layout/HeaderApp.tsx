import type React from "react";

import {
  Masthead,
  MastheadBrand,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
} from "@patternfly/react-core";

import { BrandLogo } from "./BrandLogo";

export const MOBILE_DOCK_TOGGLE_ID = "mobile-masthead-toggle";

interface IHeaderAppProps {
  isDockExpanded: boolean;
  onToggleDock: () => void;
}

/** Masthead for mobile viewports, where the page hides the dock behind this toggle. */
export const HeaderApp: React.FC<IHeaderAppProps> = ({
  isDockExpanded,
  onToggleDock,
}) => (
  <Masthead display={{ default: "inline" }}>
    <MastheadMain>
      <MastheadToggle>
        <PageToggleButton
          id={MOBILE_DOCK_TOGGLE_ID}
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isDockExpanded}
          onSidebarToggle={onToggleDock}
          isHamburgerButton
        />
      </MastheadToggle>
      <MastheadBrand>
        <MastheadLogo>
          <BrandLogo />
        </MastheadLogo>
      </MastheadBrand>
    </MastheadMain>
  </Masthead>
);
