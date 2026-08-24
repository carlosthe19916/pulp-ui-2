import React, { useCallback, useEffect, useState } from "react";

import {
  CONTRAST_MODES,
  isContrastModeValid,
  isThemeModeValid,
  isThemeVariantValid,
  ThemeContext,
  THEME_MODES,
  THEME_VARIANTS,
  type ContrastMode,
  type ThemeMode,
  type ThemeVariant,
} from "./theme-context";

export type { ContrastMode, ThemeMode, ThemeVariant } from "./theme-context";

const DARK_MODE_CLASS = "pf-v6-theme-dark";
const FELT_THEME_CLASS = "pf-v6-theme-felt";
const HIGH_CONTRAST_CLASS = "pf-v6-theme-high-contrast";
const GLASS_THEME_CLASS = "pf-v6-theme-glass";

const useMatchMedia = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

interface IThemeProviderProps {
  children: React.ReactNode;
  mode: ThemeMode;
  setMode: (value: ThemeMode) => void;
  variant: ThemeVariant;
  setVariant: (value: ThemeVariant) => void;
  contrast: ContrastMode;
  setContrast: (value: ContrastMode) => void;
}

export const ThemeProvider: React.FC<IThemeProviderProps> = ({
  children,
  mode,
  setMode,
  variant,
  setVariant,
  contrast,
  setContrast,
}) => {
  const sanitizedMode: ThemeMode = isThemeModeValid(mode) ? mode : "system";
  const sanitizedVariant: ThemeVariant = isThemeVariantValid(variant)
    ? variant
    : "default";
  const sanitizedContrast: ContrastMode = isContrastModeValid(contrast)
    ? contrast
    : "system";

  const setSanitizedMode = useCallback(
    (value: ThemeMode) => {
      setMode(isThemeModeValid(value) ? value : "system");
    },
    [setMode],
  );

  const setSanitizedVariant = useCallback(
    (value: ThemeVariant) => {
      setVariant(isThemeVariantValid(value) ? value : "default");
    },
    [setVariant],
  );

  const setSanitizedContrast = useCallback(
    (value: ContrastMode) => {
      setContrast(isContrastModeValid(value) ? value : "system");
    },
    [setContrast],
  );

  const prefersDark = useMatchMedia("(prefers-color-scheme: dark)");
  const prefersMoreContrast = useMatchMedia("(prefers-contrast: more)");
  const forcedColors = useMatchMedia("(forced-colors: active)");
  const prefersReducedTransparency = useMatchMedia(
    "(prefers-reduced-transparency: reduce)",
  );

  const isDark =
    sanitizedMode === THEME_MODES.DARK ||
    (sanitizedMode === THEME_MODES.SYSTEM && prefersDark);

  const isFelt = sanitizedVariant === THEME_VARIANTS.FELT;

  const isHighContrast =
    sanitizedContrast === CONTRAST_MODES.HIGH_CONTRAST ||
    (sanitizedContrast === CONTRAST_MODES.SYSTEM &&
      (prefersMoreContrast || forcedColors));

  const isGlass =
    sanitizedContrast === CONTRAST_MODES.GLASS &&
    !isHighContrast &&
    !prefersReducedTransparency;

  useEffect(() => {
    const htmlElement = document.documentElement;
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    htmlElement.classList.toggle(DARK_MODE_CLASS, isDark);
    htmlElement.classList.toggle(FELT_THEME_CLASS, isFelt);
    htmlElement.classList.toggle(HIGH_CONTRAST_CLASS, isHighContrast);
    htmlElement.classList.toggle(GLASS_THEME_CLASS, isGlass);

    themeMeta?.setAttribute("content", isDark ? "#000000" : "#ffffff");
  }, [isDark, isFelt, isHighContrast, isGlass]);

  return (
    <ThemeContext
      value={{
        isDark,
        isGlass,
        mode: sanitizedMode,
        setMode: setSanitizedMode,
        variant: sanitizedVariant,
        setVariant: setSanitizedVariant,
        contrast: sanitizedContrast,
        setContrast: setSanitizedContrast,
      }}
    >
      {children}
    </ThemeContext>
  );
};
