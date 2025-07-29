import { useEffect, useMemo, useState } from "react";

import useSWR, { KeyedMutator } from "swr";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import {
  getCodeTemplate,
  getCodeTemplates,
  createCodeTemplate as queryCreateTemplate,
  deleteCodeTemplate as queryDeleteTemplate,
  updateCodeTemplate as queryUpdateTemplate,
} from "@/lib/queries/templateQueries";
import { handleApiRequest } from "@/lib/utils";
import { templateCreateSchema, templateUpdateSchema } from "@/lib/zod-schemas/code-templates";

import type { CodeTemplate as PrismaCodeTemplate } from "@prisma/client";

type CodeTemplate = PrismaCodeTemplate;
type CodeTemplateCreateInput = z.infer<typeof templateCreateSchema>;
type CodeTemplateUpdateInput = z.infer<typeof templateUpdateSchema>;

const SWR_CONFIG = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  shouldRetryOnError: false,
};

export const OPTIMISTIC_UPDATE_OPTIONS = {
  populateCache: true,
  revalidate: false,
  rollbackOnError: true,
};

interface UseCodeTemplatesParams {
  search?: string;
  [key: string]: unknown;
}

interface CodeTemplatesResponse {
  templates: CodeTemplate[];
  total: number;
}

export function useCodeTemplates(queryParams: UseCodeTemplatesParams = {}) {
  const [debouncedParams, setDebouncedParams] = useState(queryParams);

  useEffect(() => {
    // if only non-search params changed, update immediately
    if (queryParams.search === debouncedParams.search) {
      setDebouncedParams(queryParams);
      return;
    }

    const timer = setTimeout(() => {
      const search = queryParams.search?.trim() || "";
      if (search.length < 3 && search.length > 0) {
        setDebouncedParams({
          ...queryParams,
          search: debouncedParams.search || "",
        });
      } else {
        setDebouncedParams(queryParams);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [queryParams, debouncedParams.search]);

  const cleanParams = useMemo(() => {
    const params: UseCodeTemplatesParams = { ...debouncedParams };
    for (const p in params) {
      if (params[p] === null) {
        delete params[p];
      }
    }
    return params;
  }, [debouncedParams]);

  const {
    data,
    error,
    mutate,
    isLoading,
    isValidating,
  }: {
    data: CodeTemplatesResponse;
    error: unknown;
    mutate: KeyedMutator<CodeTemplatesResponse>;
    isLoading: boolean;
    isValidating: boolean;
  } = useSWR(["templates", cleanParams], () => getCodeTemplates(cleanParams), {
    ...SWR_CONFIG,
    fallbackData: { templates: [], total: 0 },
  });

  const createCodeTemplate = async (templateData: CodeTemplateCreateInput) => {
    const optimisticData: CodeTemplatesResponse = {
      templates: [
        {
          ...(templateData as CodeTemplate),
          id: uuidv4(),
        },
        ...data.templates,
      ],
      total: data.total + 1,
    };

    return await handleApiRequest({
      makeRequest: async () => {
        return await mutate(
          async () => {
            const template = await queryCreateTemplate(templateData);
            return {
              templates: [template, ...data.templates],
              total: data.total + 1,
            };
          },
          {
            optimisticData,
            ...OPTIMISTIC_UPDATE_OPTIONS,
          }
        );
      },
      errorCallback: (error: Error) => {
        // SWR will automatically roll back the optimistic update on error
        throw error;
      },
    });
  };

  const updateCodeTemplate = async (id: string, templateData: CodeTemplateUpdateInput) => {
    const optimisticData: CodeTemplatesResponse = {
      templates: data.templates.map((t) => (t.id === id ? { ...t, ...templateData } : t)) as CodeTemplate[],
      total: data.total,
    };

    return await handleApiRequest({
      makeRequest: async () => {
        return await mutate(
          async () => {
            const updatedTemplate = await queryUpdateTemplate(id, templateData);
            return {
              templates: data.templates.map((t) => (t.id === id ? { ...t, ...updatedTemplate } : t)),
              total: data.total,
            };
          },
          {
            optimisticData,
            ...OPTIMISTIC_UPDATE_OPTIONS,
          }
        );
      },
      errorCallback: (error: Error) => {
        // SWR will automatically roll back the optimistic update on error
        throw error;
      },
    });
  };

  const deleteCodeTemplate = async (id: string) => {
    const optimisticData: CodeTemplatesResponse = {
      templates: data.templates.filter((t) => t.id !== id),
      total: data.total - 1,
    };

    return await handleApiRequest({
      makeRequest: async () => {
        return await mutate(
          async () => {
            await queryDeleteTemplate(id);
            return optimisticData;
          },
          {
            optimisticData,
            ...OPTIMISTIC_UPDATE_OPTIONS,
          }
        );
      },
      errorCallback: (error: Error) => {
        // SWR will automatically roll back the optimistic update on error
        throw error;
      },
    });
  };

  return {
    templates: data?.templates || [],
    total: data?.total || 0,
    isLoading,
    isValidating,
    error,
    createCodeTemplate,
    updateCodeTemplate,
    deleteCodeTemplate,
    refresh: () => mutate(),
  };
}

export function useCodeTemplate(templateId: string | null | undefined) {
  const {
    data: template,
    error,
    mutate,
    isValidating,
    isLoading,
  }: {
    data?: CodeTemplate;
    error: unknown;
    mutate: KeyedMutator<CodeTemplate>;
    isValidating: boolean;
    isLoading: boolean;
  } = useSWR(
    templateId ? ["template", templateId] : null,
    templateId ? () => getCodeTemplate(templateId) : null,
    SWR_CONFIG
  );

  const updateCodeTemplate = async (templateData: CodeTemplateUpdateInput) => {
    if (!template) return;
    const optimisticData: CodeTemplate = {
      ...template,
      ...(templateData as CodeTemplate),
    };

    return await handleApiRequest({
      makeRequest: async () => {
        return await mutate(
          async () => {
            if (!templateId) throw new Error("Template ID is missing");
            await queryUpdateTemplate(templateId, templateData);
            return optimisticData;
          },
          {
            optimisticData,
            ...OPTIMISTIC_UPDATE_OPTIONS,
          }
        );
      },
      errorCallback: (error: Error) => {
        // SWR will automatically roll back the optimistic update on error
        throw error;
      },
    });
  };

  return {
    template,
    isValidating,
    isLoading,
    error,
    updateCodeTemplate,
    refresh: () => mutate(),
  };
}
