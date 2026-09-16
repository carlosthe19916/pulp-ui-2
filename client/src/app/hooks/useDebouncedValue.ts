import { useEffect, useState } from "react";

// Returns a copy of `value` that only updates after `value` has stopped
// changing for `delayMs`. Used to debounce filter input before it hits a
// server query, so typing doesn't fire a request per keystroke.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
