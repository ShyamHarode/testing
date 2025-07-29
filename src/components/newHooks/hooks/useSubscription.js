// we want to pass in a websiteID and then get the product subscriptions for that website
import { useMemo } from "react";

import { useOrganization } from "@clerk/nextjs";
import useSWR from "swr";

import { ACTIVE_SUBSCRIPTION_STATUSES, SubscriptionStatus } from "@/lib/constants/pricing";
import { api, handleApiRequest } from "@/lib/utils";

const fetcher = async (url) => {
  return handleApiRequest({
    makeRequest: async () => {
      const response = await api.get(url);
      return response.data;
    },
  });
};

const useSubscription = (includePriceDetails = false) => {
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

  const [isActive, isTrialing, isPaidCustomer] = useMemo(() => {
    // not active/trialing/paid if currently loading or there was an error
    if (isLoading || error || !data) return [false, false, false];

    const currentStatus = data?.subscriptionStatus || "";
    const active = ACTIVE_SUBSCRIPTION_STATUSES.includes(currentStatus);
    const trialing = currentStatus.toLowerCase() === SubscriptionStatus.trialing;
    const paidCustomer = active && !trialing; // "active" or "past_due" but not "trialing"

    return [active, trialing, paidCustomer];
  }, [data?.subscriptionStatus, isLoading, error]);

  return {
    subscription: data || {},
    isLoading,
    isSubError: error,
    isActive,
    isTrialing,
    isPaidCustomer,
    refresh: mutate,
  };
};

export default useSubscription;
