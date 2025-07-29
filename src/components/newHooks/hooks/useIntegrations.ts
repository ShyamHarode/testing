import { useCallback, useEffect, useState } from "react";

import { Integration } from "@prisma/client";

import { INTEGRATIONS } from "@/lib/constants/integrations";
import { getIntegrations } from "@/lib/queries/integrationQueries";
import { handleApiRequest } from "@/lib/utils";

export function useIntegrations(websiteId: string, SMMToken?: string) {
  const [connectedIntegrations, setConnectedIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    await handleApiRequest({
      makeRequest: async () => {
        setIsLoading(true);
        return getIntegrations(websiteId, SMMToken);
      },
      successCallback: (integrations: Integration[]) => {
        setConnectedIntegrations(integrations || []);
      },
      finallyCallback: () => {
        setIsLoading(false);
      },
      hideErrorToast: true,
    });
  }, [websiteId, SMMToken]);

  useEffect(() => {
    if (websiteId) {
      fetchIntegrations();
    }
  }, [websiteId, fetchIntegrations]);

  return {
    connectedIntegrations,
    setConnectedIntegrations,
    availableIntegrations: INTEGRATIONS,
    isLoading,
    fetchIntegrations,
  };
}
