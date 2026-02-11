import type React from "react";

import type { AxiosError } from "axios";

import type { UniquePackageMetadataResponse } from "@app/api/models";
import type { DistributionResponse } from "@app/client";
import { useFetchUniquePackageMetadata } from "@app/queries/packages";

interface WithPackageProps {
  distribution: DistributionResponse;
  packageName: string;
  children: (args: {
    pkg: UniquePackageMetadataResponse | undefined;
    isFetching: boolean;
    fetchError?: AxiosError | null;
  }) => React.ReactNode;
}

export const WithPackage: React.FC<WithPackageProps> = ({
  distribution,
  packageName,
  children,
}) => {
  const { pkg, isFetching, fetchError } = useFetchUniquePackageMetadata({
    distributionPath: distribution.base_path,
    packageName,
  });

  return <>{children({ pkg, isFetching, fetchError })}</>;
};
