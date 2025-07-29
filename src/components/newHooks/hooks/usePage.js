import useSWR, { KeyedMutator } from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { api, handleApiRequest } from "@/lib/utils";
import { PageWithSections } from "@/types/prisma";

interface IUsePage {
  page: PageWithSections;
  isLoading: boolean;
  refresh: KeyedMutator<any>;
}

export const usePage = (): IUsePage => {
  const { websiteId, pageId } = useRouterQuery(["websiteId", "pageId"]);

  const fetcher = async (url: string) => {
    return handleApiRequest({
      makeRequest: async () => {
        const response = await api.get(url);
        return response.data;
      },
    });
  };

  const { data, isLoading, mutate } = useSWR(
    websiteId && pageId ? `/api/sites/${websiteId}/pages/${pageId}` : null,
    fetcher
  );

  return {
    page: data,
    isLoading,
    refresh: mutate,
  };
};