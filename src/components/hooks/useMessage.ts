import useSWR, { KeyedMutator, SWRConfiguration } from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import { getMessage } from "@/lib/queries/messageQueries";
import { handleApiRequest } from "@/lib/utils";

import type { ContactMessage } from "@prisma/client";

interface UseMessageReturn {
  message: ContactMessage | undefined;
  isLoading: boolean;
  refresh: KeyedMutator<ContactMessage>;
}

export const useMessage = (
  swrConfig: SWRConfiguration = {}
): UseMessageReturn => {
  const { messageId, websiteId } = useRouterQuery([
    "messageId",
    "websiteId",
  ]) as {
    messageId: string | undefined;
    websiteId: string | undefined;
  };

  const fetcher = async ({
    websiteId,
    messageId,
  }: {
    websiteId: string;
    messageId: string;
  }): Promise<ContactMessage> => {
    return handleApiRequest({
      makeRequest: async () => getMessage(websiteId, messageId),
    });
  };

  const { data, isLoading, mutate } = useSWR<ContactMessage>(
    websiteId && messageId ? { websiteId, messageId } : null,
    fetcher,
    swrConfig
  );

  return {
    message: data,
    isLoading,
    refresh: mutate,
  };
};
