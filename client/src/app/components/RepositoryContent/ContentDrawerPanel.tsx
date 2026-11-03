import type React from "react";

import {
  Content,
  ContentVariants,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Title,
} from "@patternfly/react-core";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";

import { PluginContentPanel } from "@app/components/PluginContentPanel";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useContentDetailQuery } from "@app/queries/content";
import { resolvePulpType } from "@app/queries/utils/pulpHref";

interface IContentDrawerPanelProps {
  href: string | null;
  versionHref: string;
  onClose: () => void;
}

export const ContentDrawerPanel: React.FC<IContentDrawerPanelProps> = ({
  href,
  versionHref,
  onClose,
}) => {
  const { data } = useContentDetailQuery({ href });
  const pulpType = resolvePulpType(href ?? "");

  return (
    <DrawerPanelContent isResizable defaultSize="50%" minSize="400px">
      {href && (
        <>
          <DrawerHead>
            <Flex
              direction={{ default: "column" }}
              spaceItems={{ default: "spaceItemsSm" }}
            >
              <Title
                headingLevel="h2"
                size="lg"
                className={textStyles.textBreakWord}
              >
                {data?.prn}
              </Title>
              <Flex
                spaceItems={{ default: "spaceItemsMd" }}
                alignItems={{ default: "alignItemsCenter" }}
              >
                {pulpType && (
                  <FlexItem>
                    <PulpTypeLabel pulpType={pulpType} />
                  </FlexItem>
                )}
                <FlexItem>
                  <Content component={ContentVariants.small}>
                    <ResourceHrefLink
                      kind="content"
                      href={href}
                      label="View full details"
                    />
                  </Content>
                </FlexItem>
              </Flex>
            </Flex>
            <DrawerActions>
              <DrawerCloseButton onClick={onClose} />
            </DrawerActions>
          </DrawerHead>
          <DrawerPanelBody>
            <PluginContentPanel href={href} versionHref={versionHref} />
          </DrawerPanelBody>
        </>
      )}
    </DrawerPanelContent>
  );
};
