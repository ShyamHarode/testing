import type { KeyedMutator } from "swr";
import useSWR from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { getMessage } from "@/lib/queries/messageQueries";
import { handleApiRequest } from "@/lib/utils";

type MessageData = {
  id: string;
  websiteId: string;
  fields: Record<string, string>;
  createdAt: string;
  isSuspectedSpam?: boolean;
  // Add other message fields as needed
} | null;

interface UseMessageReturn {
  message: MessageData;
  isLoading: boolean;
  refresh: KeyedMutator<MessageData>;
}

export const useMessage = (): UseMessageReturn => {
  const { messageId, websiteId } = useRouterQuery(["messageId", "websiteId"]) as {
    messageId: string | undefined;
    websiteId: string | undefined;
  };

  const fetcher = async ({ websiteId, messageId }: { websiteId: string; messageId: string }): Promise<MessageData> => {
    return await handleApiRequest({
      makeRequest: async () => getMessage(websiteId, messageId),
    });
  };

  const { data, isLoading, mutate } = useSWR(
    websiteId && messageId ? { websiteId, messageId } : null, 
    fetcher
  );

  return {
    message: data || null,
    isLoading,
    refresh: mutate,
  };
};
