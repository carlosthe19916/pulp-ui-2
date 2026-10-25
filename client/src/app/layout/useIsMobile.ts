import { useSyncExternalStore } from "react";

// PatternFly's lg breakpoint, below which the docked page swaps the dock for the
// mobile masthead.
const MOBILE_QUERY = "(max-width: 62rem)";

const subscribe = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

export const useIsMobile = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
  );
