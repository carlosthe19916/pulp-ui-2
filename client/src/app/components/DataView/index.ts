// Thin shared foundation for pages built on `@patternfly/react-data-view`.
// Pages import react-data-view's components/hooks directly (raw API) and use
// these helpers for the repetitive bits: bridging the string-keyed sort hook to
// PatternFly's index-based `Th` sort props, and rendering consistent
// loading/empty/error states.
export { computeActiveState, dataViewBodyStates } from "./dataViewStates";
export { buildThSort } from "./sortHelpers";
