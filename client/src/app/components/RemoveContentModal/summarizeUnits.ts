import type { IContentUnitRef } from "@app/hooks/useContentUnitSelection";

/** Groups units by type (in first-seen order), keeping up to `limit` names each. */
export const summarizeUnits = ({
  units,
  limit = 5,
}: {
  units: IContentUnitRef[];
  limit?: number;
}) => {
  const byType = new Map<string | undefined, string[]>();
  for (const unit of units) {
    byType.set(unit.pulpType, [
      ...(byType.get(unit.pulpType) ?? []),
      unit.label,
    ]);
  }
  return [...byType].map(([pulpType, labels]) => ({
    pulpType,
    labels: labels.slice(0, limit),
    more: Math.max(labels.length - limit, 0),
  }));
};
