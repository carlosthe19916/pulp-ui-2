import type React from "react";
import { useCallback, useState } from "react";

interface IRevealCellOnExpandProps {
  children: () => React.ReactNode;
}

/**
 * Mounts expanded-row content on its row's first expand, then keeps it mounted.
 * `children` is a thunk so building it is deferred too.
 */
export const RevealCellOnExpand: React.FC<IRevealCellOnExpandProps> = ({
  children,
}) => {
  const [revealed, setRevealed] = useState(false);

  // `DataViewTable` always renders expanded rows and only toggles `hidden` on the
  // `<tr>`, so watch that attribute. Observe it from a ref callback (not an effect)
  // so revealing stays out of React's effect phase. Returns a React 19 ref-cleanup.
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
