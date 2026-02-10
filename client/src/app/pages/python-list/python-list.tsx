import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { useFetchPackages } from "@app/queries/packages";
import { Paths } from "@app/Routes";
import {
  List,
  ListItem,
  PageSection,
  PageSectionVariants,
  Title,
} from "@patternfly/react-core";
import type React from "react";
import { generatePath, NavLink } from "react-router-dom";

export const PythonList: React.FC = () => {
  const { result, isFetching } = useFetchPackages();

  return (
    <>
      <DocumentMetadata title={"Python"} />
      <PageSection variant={PageSectionVariants.default}>
        <Title headingLevel="h1" size="2xl">
          Python List
        </Title>
      </PageSection>
      <PageSection>
        Is Loading: {isFetching ? "yes" : "no"}
        <List>
          {result.data.map((e) => (
            <ListItem key={e.pulp_href}>
              <NavLink
                to={generatePath(Paths.pythonDetails, {
                  pythonId: e.sha256 ?? "",
                })}
              >
                {e.name}
              </NavLink>
            </ListItem>
          ))}
        </List>
      </PageSection>
    </>
  );
};
