import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";

import { EntityDetail } from "@app/components/Entity/EntityDetail";
import { useRemoteDeleteMutation } from "@app/queries/remotes";
import { REMOTE_FAMILY } from "@app/queries/utils/families";

const remoteDetailRouteApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/remotes/$remoteId",
);

export const RemoteDetailRoute = () => {
  const { remoteId, pulpDomain } = remoteDetailRouteApi.useParams();
  const navigate = useNavigate();
  const deleteMutation = useRemoteDeleteMutation();

  return (
    <EntityDetail
      config={REMOTE_FAMILY}
      id={remoteId}
      deleteMutation={deleteMutation}
      listLink={
        <Link
          to="/content-management/$pulpDomain/remotes"
          params={{ pulpDomain }}
        >
          Remotes
        </Link>
      }
      onDeleted={() =>
        void navigate({
          to: "/content-management/$pulpDomain/remotes",
          params: { pulpDomain },
        })
      }
    />
  );
};
