import React, { use, useState } from "react";

import {
  Divider,
  Icon,
  MenuSearch,
  MenuSearchInput,
  MenuToggle,
  Select,
  SelectGroup,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import DesktopIcon from "@patternfly/react-icons/dist/esm/icons/desktop-icon";
import OutlinedMoonIcon from "@patternfly/react-icons/dist/esm/icons/outlined-moon-icon";
import OutlinedSunIcon from "@patternfly/react-icons/dist/esm/icons/outlined-sun-icon";

import {
  CONTRAST_MODES,
  ThemeContext,
  THEME_MODES,
  THEME_VARIANTS,
  type ContrastMode,
  type ThemeMode,
  type ThemeVariant,
} from "./theme-context";

const VARIANT_BUTTON_IDS: Record<ThemeVariant, string> = {
  default: "theme-default",
  felt: "theme-felt",
};

const COLOR_BUTTON_IDS: Record<ThemeMode, string> = {
  system: "color-system",
  light: "color-light",
  dark: "color-dark",
};

const CONTRAST_BUTTON_IDS: Record<ContrastMode, string> = {
  system: "contrast-system",
  default: "contrast-default",
  "high-contrast": "contrast-high",
  glass: "contrast-glass",
};

const prefixed = (id: string, suffix: string) => `${id}-${suffix}`;

const invertIds = <K extends string>(
  ids: Record<K, string>,
): Record<string, K> =>
  Object.fromEntries(
    Object.entries(ids).map(([key, value]) => [value, key]),
  ) as Record<string, K>;

const VARIANT_BY_SUFFIX = invertIds(VARIANT_BUTTON_IDS);
const COLOR_BY_SUFFIX = invertIds(COLOR_BUTTON_IDS);
const CONTRAST_BY_SUFFIX = invertIds(CONTRAST_BUTTON_IDS);

const colorSchemeIcons: Record<ThemeMode, React.ReactNode> = {
  light: <OutlinedSunIcon />,
  dark: <OutlinedMoonIcon />,
  system: <DesktopIcon />,
};

const colorSchemeLabels: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const eventButtonId = (
  event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
): string => (event.currentTarget as HTMLElement).id;

export const ThemeSelector: React.FC<{ id?: string }> = ({
  id = "theme-selector",
}) => {
  const { mode, setMode, variant, setVariant, contrast, setContrast } =
    use(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);

  const handleVariantChange = (
    event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
  ) => {
    const suffix = eventButtonId(event).slice(`${id}-`.length);
    const next = VARIANT_BY_SUFFIX[suffix];
    if (next) {
      setVariant(next);
    }
  };

  const handleColorChange = (
    event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
  ) => {
    const suffix = eventButtonId(event).slice(`${id}-`.length);
    const next = COLOR_BY_SUFFIX[suffix];
    if (next) {
      setMode(next);
    }
  };

  const handleContrastChange = (
    event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
  ) => {
    const suffix = eventButtonId(event).slice(`${id}-`.length);
    const next = CONTRAST_BY_SUFFIX[suffix];
    if (next) {
      setContrast(next);
    }
  };

  return (
    <Select
      id={id}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          icon={<Icon size="lg">{colorSchemeIcons[mode]}</Icon>}
          aria-label={`Theme selection, current: ${colorSchemeLabels[mode]}`}
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
      <SelectGroup label="Theme" titleId={`${id}-variant-title`}>
        <MenuSearch>
          <MenuSearchInput>
            <ToggleGroup aria-labelledby={`${id}-variant-title`}>
              <ToggleGroupItem
                text="Default"
                buttonId={prefixed(id, VARIANT_BUTTON_IDS.default)}
                isSelected={variant === THEME_VARIANTS.DEFAULT}
                onChange={handleVariantChange}
              />
              <ToggleGroupItem
                text="Project Felt"
                buttonId={prefixed(id, VARIANT_BUTTON_IDS.felt)}
                isSelected={variant === THEME_VARIANTS.FELT}
                onChange={handleVariantChange}
              />
            </ToggleGroup>
          </MenuSearchInput>
        </MenuSearch>
      </SelectGroup>
      <Divider />
      <SelectGroup label="Color scheme" titleId={`${id}-color-scheme-title`}>
        <MenuSearch>
          <MenuSearchInput>
            <ToggleGroup aria-labelledby={`${id}-color-scheme-title`}>
              <ToggleGroupItem
                text="System"
                buttonId={prefixed(id, COLOR_BUTTON_IDS.system)}
                isSelected={mode === THEME_MODES.SYSTEM}
                onChange={handleColorChange}
              />
              <ToggleGroupItem
                text="Light"
                buttonId={prefixed(id, COLOR_BUTTON_IDS.light)}
                isSelected={mode === THEME_MODES.LIGHT}
                onChange={handleColorChange}
              />
              <ToggleGroupItem
                text="Dark"
                buttonId={prefixed(id, COLOR_BUTTON_IDS.dark)}
                isSelected={mode === THEME_MODES.DARK}
                onChange={handleColorChange}
              />
            </ToggleGroup>
          </MenuSearchInput>
        </MenuSearch>
      </SelectGroup>
      <Divider />
      <SelectGroup label="Contrast mode" titleId={`${id}-contrast-title`}>
        <MenuSearch>
          <MenuSearchInput>
            <ToggleGroup aria-labelledby={`${id}-contrast-title`}>
              <ToggleGroupItem
                text="System"
                buttonId={prefixed(id, CONTRAST_BUTTON_IDS.system)}
                isSelected={contrast === CONTRAST_MODES.SYSTEM}
                onChange={handleContrastChange}
              />
              <ToggleGroupItem
                text="Default"
                buttonId={prefixed(id, CONTRAST_BUTTON_IDS.default)}
                isSelected={contrast === CONTRAST_MODES.DEFAULT}
                onChange={handleContrastChange}
              />
              <ToggleGroupItem
                text="High contrast"
                buttonId={prefixed(id, CONTRAST_BUTTON_IDS["high-contrast"])}
                isSelected={contrast === CONTRAST_MODES.HIGH_CONTRAST}
                onChange={handleContrastChange}
              />
              <ToggleGroupItem
                text="Glass"
                buttonId={prefixed(id, CONTRAST_BUTTON_IDS.glass)}
                isSelected={contrast === CONTRAST_MODES.GLASS}
                onChange={handleContrastChange}
              />
            </ToggleGroup>
          </MenuSearchInput>
        </MenuSearch>
      </SelectGroup>
    </Select>
  );
};
