import type React from "react";
import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  Label,
  PageSection,
  Tab,
  TabContentBody,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ObjectAccessPanel } from "@app/components/ObjectAccessPanel";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { defineTabState, usePersistentTab } from "@app/hooks/usePersistentTab";
import {
  usePublicationDeleteMutation,
  useSuspensePublicationDetailQuery,
} from "@app/queries/publications";
import {
  extractIdFromHref,
  hasRoleEndpoints,
} from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { PublicationDetailsView } from "./components/PublicationDetailsView";

interface IPublicationDetailProps {
  pulpDomain: string;
  pulpType: string;
  href: string;
}

const PUBLICATION_DETAIL_TABS = defineTabState({
  tabs: ["details", "access"],
  defaultValue: "details",
});

export const PublicationDetail: React.FC<IPublicationDetailProps> = ({
  pulpDomain,
  pulpType,
  href,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { data: publication } = useSuspensePublicationDetailQuery({ href });
  const { disabledProps } = useObjectPermissions({ href });
  const id = extractIdFromHref(href);
  const name = `Publication ${id}`;
  const canManageRoles = hasRoleEndpoints(href);

  const deleteMutation = usePublicationDeleteMutation({
    onSuccess: (_data, { pulp_href }) => {
      addNotification({
        title: `Publication "${extractIdFromHref(pulp_href ?? "")}" deleted`,
        variant: "success",
      });
      void navigate({
        to: "/content-management/$pulpDomain/publications",
        params: { pulpDomain },
      });
    },
    onError: (error, { pulp_href }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete publication "${extractIdFromHref(pulp_href ?? "")}"`,
        }),
        variant: "danger",
      }),
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { tab: activeTab, selectTab } = usePersistentTab({
    ...PUBLICATION_DETAIL_TABS,
    storage: "url",
    available: ["details", ...(canManageRoles ? (["access"] as const) : [])],
  });

  return (
    <>
      <DocumentTitle title={`Publication · ${id}`} />
      <PageHeader
        title={name}
        label={<Label color="blue">plugin: {pulpType}</Label>}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/publications"
                params={{ pulpDomain }}
              >
                Publications
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{name}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete",
                  onClick: () => setIsDeleteOpen(true),
                  ...disabledProps("delete"),
                },
              },
            ]}
          />
        }
      />

      <PageSection>
        <Tabs
          activeKey={activeTab}
          onSelect={(_event, tabKey) => selectTab(tabKey)}
          mountOnEnter
        >
          <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>}>
            <TabContentBody hasPadding>
              <PublicationDetailsView
                publication={publication}
                pulpType={pulpType}
              />
            </TabContentBody>
          </Tab>
          {canManageRoles && (
            <Tab eventKey="access" title={<TabTitleText>Access</TabTitleText>}>
              <TabContentBody hasPadding>
                <ObjectAccessPanel href={href} name={name} />
              </TabContentBody>
            </Tab>
          )}
        </Tabs>
      </PageSection>

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Publication"
        body={`Are you sure you want to delete publication "${id}"? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(publication, {
            onSuccess: () => setIsDeleteOpen(false),
          })
        }
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
