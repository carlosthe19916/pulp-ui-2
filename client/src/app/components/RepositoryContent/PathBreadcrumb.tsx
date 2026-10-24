import type React from "react";

import { Breadcrumb, BreadcrumbItem, Button } from "@patternfly/react-core";

import { pathSegments } from "./browseHelpers";

interface IPathBreadcrumbProps {
  rootLabel: string;
  prefix: string;
  onNavigate: (prefix: string) => void;
}

/** Breadcrumb over a path prefix; clicking a segment narrows the list to that folder. */
export const PathBreadcrumb: React.FC<IPathBreadcrumbProps> = ({
  rootLabel,
  prefix,
  onNavigate,
}) => {
  const segments = pathSegments(prefix);
  const link = ({ label, target }: { label: string; target: string }) => (
    <Button variant="link" isInline onClick={() => onNavigate(target)}>
      {label}
    </Button>
  );
  return (
    <Breadcrumb>
      <BreadcrumbItem isActive={!segments.length}>
        {segments.length ? link({ label: rootLabel, target: "" }) : rootLabel}
      </BreadcrumbItem>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <BreadcrumbItem
            key={segments.slice(0, index + 1).join("/")}
            isActive={isLast}
          >
            {isLast
              ? segment
              : link({
                  label: segment,
                  target: `${segments.slice(0, index + 1).join("/")}/`,
                })}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};
