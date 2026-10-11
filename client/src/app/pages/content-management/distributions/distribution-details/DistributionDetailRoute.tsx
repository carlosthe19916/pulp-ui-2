import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";

import { EntityDetail } from "@app/components/Entity/EntityDetail";
import { useDistributionDeleteMutation } from "@app/queries/distributions";
import { DISTRIBUTION_FAMILY } from "@app/queries/utils/families";

const distributionDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/distributions/$distId",
);

export const DistributionDetailRoute = () => {
  const { distId, pulpDomain } = distributionDetailRouteApi.useParams();
  const navigate = useNavigate();
  const deleteMutation = useDistributionDeleteMutation();

  return (
    <EntityDetail
      config={DISTRIBUTION_FAMILY}
      id={distId}
      deleteMutation={deleteMutation}
      listLink={
        <Link
          to="/content-management/$pulpDomain/distributions"
          params={{ pulpDomain }}
        >
          Distributions
        </Link>
      }
      onDeleted={() =>
        void navigate({
          to: "/content-management/$pulpDomain/distributions",
          params: { pulpDomain },
        })
      }
    />
  );
};
