import type React from "react";

import {
  Button,
  ClipboardCopy,
  Flex,
  FlexItem,
  Label,
  Tooltip,
} from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import LockIcon from "@patternfly/react-icons/dist/esm/icons/lock-icon";

import type { DistributionResponse } from "@app/client";
import { resolvePulpType } from "@app/queries/utils/pulpHref";

/** Plugins whose `base_url` serves an API (registry, Galaxy) rather than a browsable file tree. */
const NON_BROWSABLE_PLUGINS = ["container", "ansible"];

interface IContentUrlLinkProps {
  distribution: DistributionResponse;
}

/**
 * A distribution's `base_url`: an external link to the content app's directory index,
 * or a copyable value for plugins that serve an API instead.
 */
export const ContentUrlLink: React.FC<IContentUrlLinkProps> = ({
  distribution,
}) => {
  const url = distribution.base_url;
  if (!url) {
    return <>—</>;
  }

  const plugin = resolvePulpType(distribution.pulp_href)?.split(".")[0] ?? "";
  if (NON_BROWSABLE_PLUGINS.includes(plugin)) {
    return (
      <ClipboardCopy
        variant="inline-compact"
        isReadOnly
        isCode
        hoverTip="Copy"
        clickTip="Copied"
      >
        {url}
      </ClipboardCopy>
    );
  }

  return (
    <Flex
      spaceItems={{ default: "spaceItemsSm" }}
      alignItems={{ default: "alignItemsCenter" }}
      flexWrap={{ default: "nowrap" }}
    >
      <FlexItem>
        <Button
          variant="link"
          isInline
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ExternalLinkAltIcon />}
          iconPosition="end"
        >
          {url}
        </Button>
      </FlexItem>
      {distribution.content_guard && (
        <FlexItem>
          <Tooltip content="Protected by a content guard: opening it in a browser may be denied.">
            <Label isCompact icon={<LockIcon />}>
              Protected
            </Label>
          </Tooltip>
        </FlexItem>
      )}
    </Flex>
  );
};
