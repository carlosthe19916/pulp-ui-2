import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";

import { EntityDetail } from "@app/components/Entity/EntityDetail";
import { usePublicationDeleteMutation } from "@app/queries/publications";
import { PUBLICATION_FAMILY } from "@app/queries/utils/families";

const publicationDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/publications/$pubId",
);

export const PublicationDetailRoute = () => {
  const { pubId, pulpDomain } = publicationDetailRouteApi.useParams();
  const navigate = useNavigate();
  const deleteMutation = usePublicationDeleteMutation();

  return (
    <EntityDetail
      config={PUBLICATION_FAMILY}
      id={pubId}
      deleteMutation={deleteMutation}
      listLink={
        <Link
          to="/content-management/$pulpDomain/publications"
          params={{ pulpDomain }}
        >
          Publications
        </Link>
      }
      onDeleted={() =>
        void navigate({
          to: "/content-management/$pulpDomain/publications",
          params: { pulpDomain },
        })
      }
    />
  );
};
