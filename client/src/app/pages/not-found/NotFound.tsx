import type React from "react";

import { Bullseye } from "@patternfly/react-core";
import PathMissingIcon from "@patternfly/react-icons/dist/esm/icons/path-missing-icon";

import { FullPageEmptyState } from "@app/components/FullPageEmptyState";

export const NotFound: React.FC = () => {
  return (
    <Bullseye>
      <FullPageEmptyState
        titleText="404: That page does not exist"
        icon={PathMissingIcon}
        body="Another page might have the information you need."
      />
    </Bullseye>
  );
};
