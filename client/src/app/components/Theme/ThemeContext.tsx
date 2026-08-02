import React, { useState } from "react";

import {
  isThemeModeValid,
  ThemeContext,
  THEME_MODES,
  type ThemeMode,
} from "./theme-context";

export type { ThemeMode } from "./theme-context";

const DARK_MODE_KEY = "pf-v6-theme-dark";

const getSystemTheme = (): Exclude<ThemeMode, "system"> => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

interface IThemeProviderProps {
  children: React.ReactNode;
  mode: ThemeMode;
  setMode: (value: ThemeMode) => void;
}

export const ThemeProvider: React.FC<IThemeProviderProps> = ({
  children,
  mode,
  setMode,
}) => {
  const sanitizedMode: ThemeMode = isThemeModeValid(mode) ? mode : "system";

  const setSanitizedMode = React.useCallback(
    (value: string) => {
      if (value && isThemeModeValid(value)) {
        setMode(value);
      } else {
        setMode("system");
      }
    },
    [setMode],
  );

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme,
  );

  const isDark =
    sanitizedMode === THEME_MODES.DARK ||
    (sanitizedMode === THEME_MODES.SYSTEM && systemTheme === "dark");

  React.useEffect(() => {
    const htmlElement = document.documentElement;
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    if (isDark) {
      htmlElement.classList.add(DARK_MODE_KEY);
      themeMeta?.setAttribute("content", "#000000");
    } else {
      htmlElement.classList.remove(DARK_MODE_KEY);
      themeMeta?.setAttribute("content", "#ffffff");
    }
  }, [isDark]);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setSystemTheme(getSystemTheme());
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  return (
    <ThemeContext
      value={{ isDark, mode: sanitizedMode, setMode: setSanitizedMode }}
    >
      {children}
    </ThemeContext>
  );
};
