import type React from "react";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@patternfly/react-core";

interface IDashboardCardProps {
  title: React.ReactNode;
  /** Links to other pages, shown in the footer (PatternFly dashboard cards). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** A full-height dashboard card: title, body, and an optional footer of links. */
export const DashboardCard: React.FC<IDashboardCardProps> = ({
  title,
  footer,
  children,
}) => (
  <Card isFullHeight>
    <CardHeader>
      <CardTitle component="h3">{title}</CardTitle>
    </CardHeader>
    <CardBody>{children}</CardBody>
    {footer ? <CardFooter>{footer}</CardFooter> : null}
  </Card>
);
