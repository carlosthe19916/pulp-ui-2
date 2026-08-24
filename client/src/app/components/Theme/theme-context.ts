import { createContext } from "react";

export const THEME_MODES = {
  SYSTEM: "system",
  LIGHT: "light",
  DARK: "dark",
} as const;

export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES];

export const THEME_VARIANTS = {
  DEFAULT: "default",
  FELT: "felt",
} as const;

export type ThemeVariant = (typeof THEME_VARIANTS)[keyof typeof THEME_VARIANTS];

export const CONTRAST_MODES = {
  SYSTEM: "system",
  DEFAULT: "default",
  HIGH_CONTRAST: "high-contrast",
  GLASS: "glass",
} as const;

export type ContrastMode = (typeof CONTRAST_MODES)[keyof typeof CONTRAST_MODES];

export const isThemeModeValid = (value: string): value is ThemeMode => {
  return Object.values(THEME_MODES).includes(value as ThemeMode);
};

export const isThemeVariantValid = (value: string): value is ThemeVariant => {
  return Object.values(THEME_VARIANTS).includes(value as ThemeVariant);
};

export const isContrastModeValid = (value: string): value is ContrastMode => {
  return Object.values(CONTRAST_MODES).includes(value as ContrastMode);
};

export interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  variant: ThemeVariant;
  setVariant: (variant: ThemeVariant) => void;
  contrast: ContrastMode;
  setContrast: (contrast: ContrastMode) => void;
  isGlass: boolean;
}

export const ThemeContext = createContext<ThemeState>({
  mode: "system",
  setMode: () => {},
  isDark: false,
  variant: "default",
  setVariant: () => {},
  contrast: "system",
  setContrast: () => {},
  isGlass: false,
});
