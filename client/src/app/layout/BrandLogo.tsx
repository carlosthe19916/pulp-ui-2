import type React from "react";

import { Brand, Split, SplitItem, Title } from "@patternfly/react-core";

import { getBranding } from "@app/utils/branding";

interface IBrandLogoProps {
  /** Show only the brand image, for the collapsed dock. */
  isCompact?: boolean;
}

export const BrandLogo: React.FC<IBrandLogoProps> = ({ isCompact }) => {
  const {
    masthead: { leftBrand, leftTitle },
  } = getBranding();

  return (
    <Split hasGutter>
      <SplitItem>
        {leftBrand ? (
          <Brand
            src={leftBrand.src}
            alt={leftBrand.alt}
            heights={{ default: leftBrand.height }}
          />
        ) : null}
      </SplitItem>
      {!isCompact && leftTitle ? (
        <SplitItem isFilled>
          <Title
            headingLevel={leftTitle.heading ?? "h1"}
            // The page title is the page's only h1; the brand isn't a heading unless asked.
            role={leftTitle.heading ? undefined : "presentation"}
            size={leftTitle.size ?? "2xl"}
          >
            {leftTitle.text}
          </Title>
        </SplitItem>
      ) : null}
    </Split>
  );
};
