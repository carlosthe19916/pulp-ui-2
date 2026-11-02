import { useEffect, useRef, useState } from "react";

import { getResizeObserver } from "@patternfly/react-core";

/** The element's width, kept current, so a chart draws at its real size instead of scaling. */
export const useContainerWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.clientWidth);
    update();
    return getResizeObserver(element, update);
  }, []);
  return { ref, width };
};
