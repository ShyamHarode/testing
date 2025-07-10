// we want to pass in a websiteID and then get the product subscriptions for that website
import { useMemo } from "react";

import { useOrganization } from "@clerk/nextjs";
import useSWR from "swr";

import { ACTIVE_SUBSCRIPTION_STATUSES, SubscriptionStatus } from "@/lib/constants/pricing";
import { api, handleApiRequest } from "@/lib/utils";

import type { KeyedMutator } from "swr";

type SubscriptionData = {
  subscriptionStatus: string;
  // Add other subscription fields as needed
  [key: string]: any;
};

interface UseSubscriptionReturn {
  subscription: SubscriptionData;
  isLoading: boolean;
  isSubError: any;
  isActive: boolean;
  isTrialing: boolean;
  isPaidCustomer: boolean;
  refresh: KeyedMutator<SubscriptionData>;
}

const fetcher = async (url: string): Promise<SubscriptionData> => {
  return handleApiRequest({
    makeRequest: async () => {
      const response = await api.get(url);
      return response.data;
    },
  });
};

const useSubscription = (includePriceDetails: boolean = false): UseSubscriptionReturn => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  // Only fetch when organization is available and fully loaded
  const {
    data,
    isLoading: isSWRLoading,
    mutate,
    error,
  } = useSWR(
    isOrgLoaded && organization ? `/api/organizations/subscription?includePriceDetails=${includePriceDetails}` : null,
    fetcher
  );

  const isLoading = isSWRLoading || !isOrgLoaded;

  const [isActive, isTrialing, isPaidCustomer] = useMemo((): [boolean, boolean, boolean] => {
    // not active/trialing/paid if currently loading or there was an error
    if (isLoading || error || !data) return [false, false, false];

    const currentStatus = data?.subscriptionStatus || "";
    const active = ACTIVE_SUBSCRIPTION_STATUSES.includes(currentStatus as any);
    const trialing = currentStatus.toLowerCase() === SubscriptionStatus.trialing;
    const paidCustomer = active && !trialing; // "active" or "past_due" but not "trialing"

    return [active, trialing, paidCustomer];
  }, [data?.subscriptionStatus, isLoading, error]);

  return {
    subscription: data || { subscriptionStatus: "" },
    isLoading,
    isSubError: error,
    isActive,
    isTrialing,
    isPaidCustomer,
    refresh: mutate,
  };
};

export default useSubscription;
