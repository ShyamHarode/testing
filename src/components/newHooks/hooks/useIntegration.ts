import { useMemo } from "react";

import useSWR, { KeyedMutator } from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { getIntegration } from "@/lib/queries/integrationQueries";
import { handleApiRequest } from "@/lib/utils";

import type { Integration as PrismaIntegration } from "@prisma/client";

type Integration = PrismaIntegration;

interface UseIntegrationReturn {
  integration?: Integration;
  isLoading: boolean;
  refresh: KeyedMutator<Integration>;
}

const useIntegration = (): UseIntegrationReturn => {
  const query = useRouterQuery(["websiteId", "integrationId"]) as {
    websiteId?: string;
    integrationId?: string;
  };

  const args = useMemo(() => {
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

  const fetcher = async (args: { websiteId: string; integrationId?: string }) => {
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
