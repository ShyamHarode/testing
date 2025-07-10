import { useMemo } from "react";

import { Conversion } from "@prisma/client";
import useSWR from "swr";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import {
  bulkUpdateConversions,
  createConversion,
  deleteConversion,
  getConversions,
  updateConversion,
} from "@/lib/queries/conversionQueries";
import { handleApiRequest } from "@/lib/utils";

import type { KeyedMutator } from "swr";

// Local type definitions based on Prisma Conversion type
type CreateConversionData = Omit<Conversion, "id" | "createdAt" | "websiteId">;
type BulkUpdateConversion = Omit<Conversion, "createdAt" | "websiteId">;

interface UseConversionsReturn {
  conversions: Conversion[];
  isLoading: boolean;
  refresh: KeyedMutator<Conversion[]>;
  createConversion: (data: CreateConversionData) => Promise<void>;
  updateConversion: (id: string, data: Partial<CreateConversionData>) => Promise<void>;
  deleteConversion: (id: string) => Promise<void>;
  bulkUpdateConversions: (conversions: BulkUpdateConversion[]) => Promise<void>;
}

const useConversions = (): UseConversionsReturn => {
  const query = useRouterQuery(["websiteId"]) as { websiteId?: string };
  const websiteId = query?.websiteId;

  const args = useMemo(() => {
    if (!websiteId) return null;
    return { websiteId };
  }, [websiteId]);

  const fetcher = async (args: { websiteId: string }): Promise<Conversion[]> => {
    return await handleApiRequest({
      makeRequest: async () => getConversions(args),
    });
  };

  const { data, isLoading: isSWRLoading, mutate } = useSWR(args, fetcher);

  const isLoading = isSWRLoading;

  const updateConversionMutation = async (id: string, data: Partial<CreateConversionData>): Promise<void> => {
    await handleApiRequest({
      makeRequest: async () => {
        return updateConversion(websiteId!, id, data as CreateConversionData);
      },
      successCallback: () => {
        mutate();
      },
    });
  };

  const createConversionMutation = async (data: CreateConversionData): Promise<void> => {
    await handleApiRequest({
      makeRequest: async () => {
        return createConversion(websiteId!, data);
      },
      successCallback: () => {
        mutate();
      },
    });
  };

  const deleteConversionMutation = async (id: string): Promise<void> => {
    await handleApiRequest({
      makeRequest: async () => {
        return deleteConversion(websiteId!, id);
      },
      successCallback: () => {
        mutate();
      },
    });
  };

  const bulkUpdateConversionsMutation = async (updatedConversions: BulkUpdateConversion[]): Promise<void> => {
    await handleApiRequest({
      makeRequest: async () => {
        return bulkUpdateConversions(websiteId!, updatedConversions);
      },
      successCallback: () => {
        mutate();
      },
    });
  };

  return {
    conversions: data || [],
    isLoading,
    refresh: mutate,
    createConversion: createConversionMutation,
    updateConversion: updateConversionMutation,
    deleteConversion: deleteConversionMutation,
    bulkUpdateConversions: bulkUpdateConversionsMutation,
  };
};

export default useConversions;
