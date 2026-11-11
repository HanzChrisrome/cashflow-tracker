// Global test setup goes here (e.g. jest-dom matchers later).
import "@testing-library/jest-dom/vitest";

// Recharts needs ResizeObserver, which jsdom does not implement.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

export {};
