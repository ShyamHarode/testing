import useSWR, { KeyedMutator } from "swr";
import { v4 as uuidv4 } from "uuid";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import {
  deleteConversion,
  getConversions,
  bulkUpdateConversions as queryBulkUpdateConversions,
  createConversion as queryCreateConversion,
  updateConversion as queryUpdateConversion,
} from "@/lib/queries/conversionQueries";
import { handleApiRequest } from "@/lib/utils";

import type { Conversion } from "@prisma/client";

type ConversionCreateInput = Omit<Conversion, "id" | "createdAt" | "websiteId">;
type ConversionUpdateInput = Partial<ConversionCreateInput>;

const SWR_CONFIG = {
  revalidateOnFocus: false, // prevent unnecessary revalidation
  dedupingInterval: 5000, // cache requests for 5s (default is 2s)
  shouldRetryOnError: false, // prevent retry on 4xx errors
};

interface UseConversionsReturn {
  websiteId: string | undefined;
  updateConversion: (id: string, data: ConversionUpdateInput) => Promise<void>;
  createConversion: (data: ConversionCreateInput) => Promise<void>;
  removeConversion: (conversionId: string) => Promise<void>;
  isLoading: boolean;
  conversions: Conversion[];
  bulkUpdateConversions: (updatedConversions: Conversion[]) => Promise<void>;
  mutate: KeyedMutator<Conversion[]>;
}

export default function useConversions(): UseConversionsReturn {
  const websiteId = useRouterQuery("websiteId") as string;

  const fetcher = async ({ websiteId: id }: { websiteId: string }): Promise<Conversion[]> => {
    return handleApiRequest({
      makeRequest: async () => getConversions({ websiteId: id }),
    });
  };

  const {
    isLoading,
    data: conversions = [],
    mutate,
  } = useSWR(websiteId ? { key: "conversion", websiteId } : null, fetcher, {
    ...SWR_CONFIG,
    fallbackData: [],
  });

  const updateConversion = async (id: string, data: ConversionUpdateInput) => {
    const optimisticData = conversions.map((item) => {
      if (item.id === id) {
        return { ...item, ...data };
      }
      return item;
    }) as Conversion[];

    await handleApiRequest({
      makeRequest: async () => {
        if (!websiteId) throw new Error("Website ID is required");
        return queryUpdateConversion(websiteId, id, data as ConversionCreateInput);
      },
      successCallback: (result: Conversion[]) => {
        mutate(result, {
          optimisticData,
          populateCache: false,
          revalidate: true,
          rollbackOnError: true,
        });
      },
    });
  };

  const createConversion = async (data: ConversionCreateInput) => {
    const newConversion: Conversion = {
      createdAt: new Date(),
      websiteId: websiteId || "",
      ...data,
      id: uuidv4(),
      priority: conversions.length + 1,
    };
    const optimisticConversions = [...conversions, newConversion];

    await handleApiRequest({
      makeRequest: async () => {
        if (!websiteId) throw new Error("Website ID is required");
        return queryCreateConversion(websiteId, data);
      },
      successCallback: (result: Conversion[]) => {
        mutate(result, {
          optimisticData: optimisticConversions,
          populateCache: false,
          revalidate: true,
          rollbackOnError: true,
        });
      },
    });
  };

  const removeConversion = async (conversionId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) {
      return;
    }
    if (!websiteId) throw new Error("Website ID is required");

    const remainingConversions = conversions.filter((c) => c.id !== conversionId);
    const updatedConversions = remainingConversions.map((c, i) => ({ ...c, priority: i + 1 }));

    await handleApiRequest({
      makeRequest: async () => {
        if (conversions?.length >= 2) {
          await bulkUpdateConversions(updatedConversions);
        }
        return deleteConversion(websiteId, conversionId);
      },
      successCallback: (result: Conversion[]) => {
        mutate(result, {
          optimisticData: updatedConversions,
          populateCache: false,
          revalidate: true,
          rollbackOnError: true,
        });
      },
    });
  };

  const bulkUpdateConversions = async (updatedConversions: Conversion[]) => {
    if (!websiteId) throw new Error("Website ID is required");
    await handleApiRequest({
      makeRequest: async () => {
        return queryBulkUpdateConversions(websiteId, updatedConversions);
      },
      successCallback: (result: Conversion[]) => {
        mutate(result, {
          optimisticData: updatedConversions,
          populateCache: true,
          revalidate: false,
          rollbackOnError: true,
        });
      },
    });
  };

  return {
    websiteId,
    updateConversion,
    createConversion,
    removeConversion,
    isLoading,
    conversions,
    bulkUpdateConversions,
    mutate,
  };
}
