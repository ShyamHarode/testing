import { useMemo } from "react";

import { Website } from "@prisma/client";
import useSWR, { SWRConfiguration } from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { getWebsite } from "@/lib/queries/websiteQueries";
import { handleApiRequest } from "@/lib/utils";

export const useWebsite = <T = Website>(
  select = ["*"],
  swrConfig: SWRConfiguration = {},
  {
    token,
  }: {
    token?: string;
  } = {}
): {
  website: T;
  isLoading: boolean;
  refresh: () => any;
} => {
  const query = useRouterQuery(["websiteId"]) as { websiteId: string | null };

  const args = useMemo(() => {
    const websiteId = query?.websiteId;

    if (!websiteId) {
      return null;
    }

    return {
      websiteId,
      select,
    };
  }, [query, select]);

  const fetcher = async (args: { websiteId: string; select: string[] }) => {
    if (!args) return null;

    return await handleApiRequest({
      makeRequest: async () => getWebsite(args, { token }),
    });
  };

  const { data, isLoading, mutate } = useSWR(args, fetcher, swrConfig);

  return {
    website: data,
    isLoading,
    refresh: mutate,
  };
};
