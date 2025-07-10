import type { KeyedMutator } from "swr";
import useSWR from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { api, handleApiRequest } from "@/lib/utils";

// Using Prisma Page type since this hook fetches page data
type PageData = {
  id: string;
  name: string;
  slug: string;
  type: string;
  websiteId: string;
  // Add other page fields as needed
} | null;

interface UsePageReturn {
  page: PageData;
  isLoading: boolean;
  refresh: KeyedMutator<PageData>;
}

export const usePage = (): UsePageReturn => {
  const { websiteId, pageId } = useRouterQuery(["websiteId", "pageId"]) as {
    websiteId: string | undefined;
    pageId: string | undefined;
  };

  const fetcher = async (url: string): Promise<PageData> => {
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
    page: data || null,
    isLoading,
    refresh: mutate,
  };
};
