const SEVERITY_COLOR: Record<string, "orange" | "yellow" | "blue" | "grey"> = {
  critical: "orange",
  important: "orange",
  moderate: "yellow",
  low: "blue",
};

/** An advisory severity's label color; never red. */
export const severityColor = (severity?: string) =>
  SEVERITY_COLOR[(severity ?? "").toLowerCase()] ?? "grey";
