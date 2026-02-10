/// <reference types="vitest/globals" />
/// <reference lib="dom" />

import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }

  // vitest/jsdom expose window via globalThis
  interface Global {
    matchMedia?: Window["matchMedia"];
  }
}

// // add jest-dom matchers to Vitest's expect
expect.extend(matchers);

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
