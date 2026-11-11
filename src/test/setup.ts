import "@testing-library/jest-dom/vitest";

// jsdom has no layout, so window.scrollTo throws "Not implemented"; a reading step calls it when
// the step changes. Tests that care about scrolling spy on it themselves.
if (typeof window !== "undefined") {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}
