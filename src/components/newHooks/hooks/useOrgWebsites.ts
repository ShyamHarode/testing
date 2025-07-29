import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import useSWR, { KeyedMutator } from "swr";

import { api, handleApiRequest } from "@/lib/utils";

import type { Dispatch, SetStateAction } from "react";
import type { Organization as PrismaOrganization, Website as PrismaWebsite } from "@prisma/client";

type Website = PrismaWebsite;
type Organization = PrismaOrganization & { websites: Website[] };

const fetcher = async (url: string): Promise<Organization> => {
  return handleApiRequest({
    makeRequest: async () => {
      const response = await api.get(url);
      return response.data;
    },
  });
};

interface UseOrgWebsitesReturn {
  currentWebsiteId: string | null;
  loadingWebsites: boolean;
  websites: Website[];
  organization?: Organization;
  orgName: string;
  setWebsites: Dispatch<SetStateAction<Website[]>>;
  mutate: KeyedMutator<Organization>;
}

const useOrgWebsites = (): UseOrgWebsitesReturn => {
  const router = useRouter();
  const { websiteId } = router?.query;
  const [websites, setWebsites] = useState<Website[]>([]);
  const [orgName, setOrgName] = useState("");

  const { data: orgData, isLoading: initializing, mutate } = useSWR<Organization>("/api/organizations", fetcher);

  useEffect(() => {
    if (orgData?.id && Array.isArray(orgData?.websites)) {
      setWebsites(orgData.websites);
    }
    if (orgData?.name) {
      setOrgName(orgData.name);
    }
  }, [orgData]);

  // Determines the current website ID from either the URL parameter or the first website in the list
  // If a URL parameter exists but doesn't match any website, it will be removed and return null
  // Returns:
  //   - null: if on server, still loading, or invalid website ID
  //   - string: valid website ID from URL or first website
  const currentWebsiteId = useMemo(() => {
    if (typeof window === "undefined" || initializing || !websites?.length) return null;

    const url = new URL(window.location.href);
    const urlWebsiteId = url.searchParams.get("currentWebsiteId");

    if (urlWebsiteId) {
      const websiteExists = websites?.some((website) => website.id === urlWebsiteId);

      if (!websiteExists) {
        url.searchParams.delete("currentWebsiteId");
        window.history.replaceState({}, "", url.toString());
        return null;
      }
    }

    return (websiteId as string) || urlWebsiteId || (websites?.length > 0 ? websites[0].id : null);
  }, [websites, initializing, websiteId]);

  return {
    currentWebsiteId,
    loadingWebsites: initializing,
    websites,
    organization: orgData,
    orgName,
    setWebsites,
    mutate,
  };
};

export default useOrgWebsites;
