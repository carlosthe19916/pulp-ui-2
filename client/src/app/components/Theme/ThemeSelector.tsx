import React, { use, useState } from "react";

import {
  Icon,
  MenuToggle,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";
import DesktopIcon from "@patternfly/react-icons/dist/esm/icons/desktop-icon";
import OutlinedMoonIcon from "@patternfly/react-icons/dist/esm/icons/outlined-moon-icon";
import OutlinedSunIcon from "@patternfly/react-icons/dist/esm/icons/outlined-sun-icon";

import { ThemeContext, type ThemeMode } from "./theme-context";

type ThemeMetadataType = {
  [key in ThemeMode]: {
    value: ThemeMode;
    icon: React.ReactNode;
    displayText: string;
    description: string;
  };
};

const themesMetadata: ThemeMetadataType = {
  light: {
    value: "light",
    icon: <OutlinedSunIcon />,
    displayText: "Light",
    description: "Always use light mode",
  },
  dark: {
    value: "dark",
    icon: <OutlinedMoonIcon />,
    displayText: "Dark",
    description: "Always use dark mode",
  },
  system: {
    value: "system",
    icon: <DesktopIcon />,
    displayText: "System",
    description: "Follow system preference",
  },
};

export const ThemeSelector: React.FC = () => {
  const { mode, setMode } = use(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (
    _event?: React.MouseEvent,
    selectedMode?: string,
  ) => {
    setMode((selectedMode as ThemeMode | undefined) ?? "system");
    setIsOpen(false);
  };

  return (
    <Select
      isOpen={isOpen}
      selected={mode}
      onSelect={handleThemeChange}
      onOpenChange={(open) => setIsOpen(open)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          icon={<Icon size="lg">{themesMetadata[mode].icon}</Icon>}
          aria-label={`Theme selection, current: ${themesMetadata[mode].displayText}`}
        />
      )}
      shouldFocusToggleOnSelect
      onOpenChangeKeys={["Escape"]}
      popperProps={{
        position: "right",
        enableFlip: true,
        preventOverflow: true,
      }}
    >
      <SelectGroup label="Color scheme">
        <SelectList>
          {Object.entries(themesMetadata).map(([themeName, themeMetadata]) => (
            <SelectOption
              key={themeName}
              value={themeMetadata.value}
              icon={themeMetadata.icon}
              description={themeMetadata.description}
            >
              {themeMetadata.displayText}
            </SelectOption>
          ))}
        </SelectList>
      </SelectGroup>
    </Select>
  );
};
