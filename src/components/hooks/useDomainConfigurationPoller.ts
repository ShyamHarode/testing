import useSWR from "swr";

import { api, handleApiRequest } from "@/lib/utils";
import { type ConfiguredBy } from "@/lib/vercel";

type PollSuccessResponse = {
  message: string;
  customDomain: string | null;
  customDomainMisconfigured: boolean;
  configurations: ConfiguredBy[];
};

export const useDomainConfigurationPoller = ({
  websiteId,
  initialCustomDomain,
  initialCustomDomainMisconfigured,
  refreshInterval = 10000,
  onConfigurationChange,
}: {
  websiteId: string;
  initialCustomDomain: string | null;
  initialCustomDomainMisconfigured: boolean;
  refreshInterval?: number;
  onConfigurationChange: (_: PollSuccessResponse) => void;
}) => {
  const { data, error } = useSWR(
    `/api/sites/${websiteId}/custom-domain/poll`,
    async () => {
      const fallbackData = {
        message: "",
        customDomain: initialCustomDomain,
        customDomainMisconfigured: initialCustomDomainMisconfigured,
        configurations: [],
      };

      const response = await handleApiRequest({
        makeRequest: async () => {
          const response = await api.get(`/api/sites/${websiteId}/custom-domain/poll`);
          return response.data;
        },
        hideErrorToast: true,
      } as any);

      return (response as PollSuccessResponse) || fallbackData;
    },
    {
      refreshInterval,
      fallbackData: {
        message: "",
        customDomain: initialCustomDomain,
        customDomainMisconfigured: initialCustomDomainMisconfigured,
        configurations: [],
      },
      refreshWhenHidden: false, // cease polling when tab is hidden
      shouldRetryOnError: true,
      onSuccess: async (data) => {
        const { customDomain, customDomainMisconfigured, message, configurations } = data;

        if (initialCustomDomainMisconfigured !== customDomainMisconfigured) {
          onConfigurationChange({ customDomain, customDomainMisconfigured, message, configurations });
        }
      },
    }
  );

  return {
    customDomain: data?.customDomain ?? initialCustomDomain,
    customDomainMisconfigured: data?.customDomainMisconfigured ?? initialCustomDomainMisconfigured,
    configurations: data?.configurations ?? [],
    error,
  };
};
