import useSWR from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { getMessage } from "@/lib/queries/messageQueries";
import { handleApiRequest } from "@/lib/utils";

export const useMessage = () => {
  const { messageId, websiteId } = useRouterQuery(["messageId", "websiteId"]);

  const fetcher = async ({ websiteId, messageId }) => {
    return await handleApiRequest({
      makeRequest: async () => getMessage(websiteId, messageId),
    });
  };

  const { data, isLoading, mutate } = useSWR(websiteId && messageId ? { websiteId, messageId } : null, fetcher);

  return {
    message: data,
    isLoading,
    refresh: mutate,
  };
};
