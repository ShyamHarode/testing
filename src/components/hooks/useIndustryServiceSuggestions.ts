import { useMemo } from "react";

import useSWR from "swr";

import { defaultIndustryList } from "@/lib/constants/industries";
import { api, handleApiRequest } from "@/lib/utils";

import type { GoogleService } from "@/types/industries";

const fetcher = async (url: string) => {
  let data: GoogleService[] = [];

  await handleApiRequest({
    makeRequest: async () => {
      const response = await api.get<GoogleService[]>(url);
      data = response.data;
      return response.data;
    },
  } as any);

  return data;
};

export const useIndustryServiceSuggestions = (industry?: string | null) => {
  const industrySlug = useMemo(() => {
    if (!industry) return null;

    return defaultIndustryList.find((ind) => ind.name === industry.toLowerCase())?.slug ?? null;
  }, [industry]);

  const {
    data: suggestions = [],
    isLoading,
    error,
  } = useSWR<GoogleService[]>(industrySlug ? `/api/industries/${industrySlug}/service-suggestions` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenOffline: false,
    refreshInterval: 0,
    shouldRetryOnError: false,
    fallbackData: [],
  });

  return {
    suggestions,
    isLoading,
    error,
  };
};
