import type React from "react";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Gallery,
  Stack as PFStack,
} from "@patternfly/react-core";

interface IChildrenProps {
  children?: React.ReactNode;
}

/** Children one under the other. */
export const Stack: React.FC<IChildrenProps> = ({ children }) => (
  <PFStack hasGutter>{children}</PFStack>
);

/** Children side by side when there is room, else one under the other. */
export const Grid: React.FC<IChildrenProps> = ({ children }) => (
  // Gallery fits columns to its container; the chat is often narrower than the viewport.
  <Gallery hasGutter minWidths={{ default: "20rem" }}>
    {children}
  </Gallery>
);

interface ISectionProps extends IChildrenProps {
  title: string;
}

/** A titled group of children. */
export const Section: React.FC<ISectionProps> = ({ title, children }) => (
  <Card isPlain isCompact>
    <CardHeader>
      <CardTitle component="h3">{title}</CardTitle>
    </CardHeader>
    <CardBody>
      <Stack>{children}</Stack>
    </CardBody>
  </Card>
);

interface ITextProps {
  text: string;
}

/** A short sentence from the assistant, such as what the view compares. */
export const Text: React.FC<ITextProps> = ({ text }) => (
  <Content component="p">{text}</Content>
);
