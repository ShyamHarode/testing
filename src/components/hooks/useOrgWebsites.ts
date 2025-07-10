import { useMemo } from "react";
import { useRouter } from "next/router";

import { useOrganization } from "@clerk/nextjs";
import useSWR from "swr";

import { api, handleApiRequest } from "@/lib/utils";

import type { KeyedMutator } from "swr";

type WebsiteData = {
  id: string;
  subdomain: string;
  customDomain: string | null;
  companyName: string;
  active: boolean;
  // Add other website fields as needed
  [key: string]: any;
};

interface UseOrgWebsitesReturn {
  websites: WebsiteData[];
  isLoading: boolean;
  loadingWebsites: boolean;
  initializing: boolean;
  refresh: KeyedMutator<WebsiteData[]>;
  mutate: KeyedMutator<WebsiteData[]>;
  currentWebsiteId: string | null;
  orgName: string | undefined;
}

const getOrgWebsites = async (): Promise<WebsiteData[]> => {
  return handleApiRequest({
    makeRequest: async () => {
      const response = await api.get(`/api/organizations/websites`);
      return response.data;
    },
  });
};

const useOrgWebsites = (): UseOrgWebsitesReturn => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const router = useRouter();

  const shouldFetch = isOrgLoaded && organization;

  const {
    data: websites = [],
    isLoading: isSWRLoading,
    mutate,
  } = useSWR(shouldFetch ? "org-websites" : null, getOrgWebsites, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    fallbackData: [] as WebsiteData[],
  });

  const isLoading = isSWRLoading || !isOrgLoaded;

  // Get the current website ID from router query or first active website
  const currentWebsiteId = useMemo((): string | null => {
    // First, try to get from router query
    if (router.query.websiteId && typeof router.query.websiteId === "string") {
      return router.query.websiteId;
    }

    if (router.query.currentWebsiteId && typeof router.query.currentWebsiteId === "string") {
      return router.query.currentWebsiteId;
    }

    // Then try to get the first active website
    const activeWebsites = websites.filter((website) => website.active);
    if (activeWebsites.length > 0) {
      return activeWebsites[0].id;
    }

    // Finally, fallback to any website
    if (websites.length > 0) {
      return websites[0].id;
    }

    return null;
  }, [router.query.websiteId, router.query.currentWebsiteId, websites]);

  return {
    websites,
    isLoading,
    loadingWebsites: isLoading,
    initializing: isLoading,
    refresh: mutate,
    mutate,
    currentWebsiteId,
    orgName: organization?.name,
  };
};

export default useOrgWebsites;
