import useSWR from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { api, handleApiRequest } from "@/lib/utils";

export const useProjects = () => {
  const websiteId = useRouterQuery("websiteId") as string;

  const fetcher = async (url: string) => {
    return handleApiRequest({
      makeRequest: async () => {
        const response = await api.get(url);
        return response.data;
      },
    } as any);
  };

  const { data, isLoading, mutate } = useSWR(websiteId ? `/api/sites/${websiteId}/projects` : null, fetcher);

  return {
    projects: data,
    isLoading,
    mutate,
  };
};
