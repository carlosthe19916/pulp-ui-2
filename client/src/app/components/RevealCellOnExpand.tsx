import type React from "react";
import { useCallback, useState } from "react";

/**
 * Defers mounting expanded-row content until its row is first expanded, then keeps
 * it mounted (keep-alive). The library `DataViewTable` always renders expanded-row
 * content into the DOM and merely toggles PatternFly's native `hidden` attribute on
 * the `<tr>` when collapsing; this watches that attribute so a heavy panel (and its
 * queries) only mounts on first expand instead of on page load. `children` is a
 * thunk so even building the content element is deferred until that first expand.
 *
 * @param props.children - Builds the expanded content; called once revealed.
 */
export const RevealCellOnExpand: React.FC<{
  children: () => React.ReactNode;
}> = ({ children }) => {
  const [revealed, setRevealed] = useState(false);

  // Observe the owning `<tr>` from a ref callback (not an effect) so revealing
  // stays out of React's effect phase. Returns a React 19 ref-cleanup.
  const observeRow = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node || revealed) return;
      const row = node.closest("tr");
      if (!row) return;
      // Already visible (e.g. a row that mounts already-expanded): reveal now.
      if (!row.hidden) {
        setRevealed(true);
        return;
      }
      // Otherwise reveal the first time PatternFly clears `hidden` (row expanded).
      const observer = new MutationObserver(() => {
        if (!row.hidden) setRevealed(true);
      });
      observer.observe(row, { attributes: true, attributeFilter: ["hidden"] });
      return () => observer.disconnect();
    },
    [revealed],
  );

  // Once revealed, render the content with no wrapper of our own (keep-alive).
  // While collapsed, render only a hidden anchor so we can locate and watch the
  // owning `<tr>` — a fragment can't hold the ref that detection needs.
  return revealed ? <>{children()}</> : <span ref={observeRow} hidden />;
};
