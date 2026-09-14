/// <reference types="vitest/globals" />
/// <reference lib="dom" />

// Registers jest-dom matchers on Vitest's `expect` (runtime) and augments its
// `Assertion` type with `toBeInTheDocument` etc. (types) in one import.
import "@testing-library/jest-dom/vitest";

declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }

  // vitest/jsdom expose window via globalThis
  interface Global {
    matchMedia?: Window["matchMedia"];
  }
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof window !== "undefined" && !window.matchMedia) {
  throw new Error("matchMedia polyfill failed to initialize");
}
