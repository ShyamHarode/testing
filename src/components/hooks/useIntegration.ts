import { useMemo } from "react";

import type { KeyedMutator } from "swr";
import useSWR from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { getIntegration } from "@/lib/queries/integrationQueries";
import { handleApiRequest } from "@/lib/utils";

type IntegrationData = {
  id: string;
  websiteId: string;
  provider: string;
  // Add other integration fields as needed
  [key: string]: any;
};

interface IntegrationArgs {
  websiteId: string;
  integrationId: string;
}

interface UseIntegrationReturn {
  integration: IntegrationData | undefined;
  isLoading: boolean;
  refresh: KeyedMutator<IntegrationData>;
}

const useIntegration = (): UseIntegrationReturn => {
  const query = useRouterQuery(["websiteId", "integrationId"]) as {
    websiteId?: string;
    integrationId?: string;
  };

  const args = useMemo((): IntegrationArgs | null => {
    const websiteId = query?.websiteId;
    const integrationId = query?.integrationId;

    if (!websiteId || !integrationId) {
      return null;
    }

    return {
      websiteId,
      integrationId,
    };
  }, [query]);

  const fetcher = async (args: IntegrationArgs): Promise<IntegrationData> => {
    return await handleApiRequest({
      makeRequest: async () => getIntegration(args),
    });
  };

  const { data, isValidating, mutate } = useSWR(args, fetcher);

  return {
    integration: data,
    isLoading: isValidating,
    refresh: mutate,
  };
};

export default useIntegration;
