// import { useEffect, useMemo, useState } from "react";

// import useSWR from "swr";
// import { v4 as uuidv4 } from "uuid";

// import {
//   getCodeTemplate,
//   getCodeTemplates,
//   createCodeTemplate as queryCreateTemplate,
//   deleteCodeTemplate as queryDeleteTemplate,
//   updateCodeTemplate as queryUpdateTemplate,
// } from "@/lib/queries/templateQueries";
// import { handleApiRequest } from "@/lib/utils";

// const SWR_CONFIG = {
//   revalidateOnFocus: false,
//   dedupingInterval: 5000,
//   shouldRetryOnError: false,
// };

// export const OPTIMISTIC_UPDATE_OPTIONS = {
//   populateCache: true,
//   revalidate: false,
//   rollbackOnError: true,
// };

// type CodeTemplate = {
//   id: string;
//   name: string;
//   code: string;
//   language: string;
//   // Add other template fields as needed
//   [key: string]: any;
// };

// type TemplatesData = {
//   templates: CodeTemplate[];
//   total: number;
// };

// interface QueryParams {
//   search?: string;
//   language?: string;
//   page?: number;
//   limit?: number;
//   [key: string]: any;
// }

// interface UseCodeTemplatesReturn {
//   templates: CodeTemplate[];
//   total: number;
//   isLoading: boolean;
//   isValidating: boolean;
//   error: any;
//   createCodeTemplate: (templateData: Partial<CodeTemplate>) => Promise<void>;
//   updateCodeTemplate: (id: string, templateData: Partial<CodeTemplate>) => Promise<void>;
//   deleteCodeTemplate: (id: string) => Promise<void>;
//   refresh: () => void;
// }

// interface UseCodeTemplateReturn {
//   template: CodeTemplate | undefined;
//   isValidating: boolean;
//   isLoading: boolean;
//   error: any;
//   updateCodeTemplate: (templateData: Partial<CodeTemplate>) => Promise<void>;
//   refresh: () => void;
// }

// export function useCodeTemplates(queryParams: QueryParams = {}): UseCodeTemplatesReturn {
//   const [debouncedParams, setDebouncedParams] = useState<QueryParams>(queryParams);

//   useEffect(() => {
//     // if only non-search params changed, update immediately
//     if (queryParams.search === debouncedParams.search) {
//       setDebouncedParams(queryParams);
//       return;
//     }

//     const timer = setTimeout(() => {
//       const search = queryParams.search?.trim() || "";
//       if (search.length < 3 && search.length > 0) {
//         setDebouncedParams({
//           ...queryParams,
//           search: debouncedParams.search || "",
//         });
//       } else {
//         setDebouncedParams(queryParams);
//       }
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [queryParams, debouncedParams.search]);

//   const cleanParams = useMemo((): QueryParams => {
//     const params = { ...debouncedParams };
//     for (const p in params) {
//       if (params[p] === null) {
//         delete params[p];
//       }
//     }
//     return params;
//   }, [debouncedParams]);

//   const { data, error, mutate, isLoading, isValidating } = useSWR(
//     ["templates", cleanParams],
//     () => getCodeTemplates(cleanParams),
//     {
//       ...SWR_CONFIG,
//       fallbackData: { templates: [], total: 0 } as TemplatesData,
//     }
//   );

//   const createCodeTemplate = async (templateData: Partial<CodeTemplate>): Promise<void> => {
//     const optimisticData: TemplatesData = {
//       templates: [{ id: uuidv4(), ...templateData } as CodeTemplate, ...data.templates],
//       total: data.total + 1,
//     };

//     return await handleApiRequest({
//       makeRequest: async () => {
//         return await mutate(
//           async () => {
//             const template = await queryCreateTemplate(templateData);
//             return {
//               templates: [template, ...data.templates],
//               total: data.total + 1,
//             };
//           },
//           {
//             optimisticData,
//             ...OPTIMISTIC_UPDATE_OPTIONS,
//           }
//         );
//       },
//       errorCallback: (error: any) => {
//         console.error("Error creating template:", error);
//       },
//     });
//   };

//   const updateCodeTemplate = async (id: string, templateData: Partial<CodeTemplate>): Promise<void> => {
//     const optimisticData: TemplatesData = {
//       templates: data.templates.map((t: CodeTemplate) => (t.id === id ? { ...t, ...templateData } : t)),
//       total: data.total,
//     };

//     return await handleApiRequest({
//       makeRequest: async () => {
//         return await mutate(
//           async () => {
//             const updatedTemplate = await queryUpdateTemplate(id, templateData);
//             return {
//               templates: data.templates.map((t: CodeTemplate) => (t.id === id ? { ...t, ...updatedTemplate } : t)),
//               total: data.total,
//             };
//           },
//           {
//             optimisticData,
//             ...OPTIMISTIC_UPDATE_OPTIONS,
//           }
//         );
//       },
//       errorCallback: (error: any) => {
//         console.error("Error updating template:", error);
//       },
//     });
//   };

//   const deleteCodeTemplate = async (id: string): Promise<void> => {
//     const optimisticData: TemplatesData = {
//       templates: data.templates.filter((t: CodeTemplate) => t.id !== id),
//       total: data.total - 1,
//     };

//     return await handleApiRequest({
//       makeRequest: async () => {
//         return await mutate(
//           async () => {
//             await queryDeleteTemplate(id);
//             return optimisticData;
//           },
//           {
//             optimisticData,
//             ...OPTIMISTIC_UPDATE_OPTIONS,
//           }
//         );
//       },
//       errorCallback: (error: any) => {
//         console.error("Error deleting template:", error);
//       },
//     });
//   };

//   return {
//     templates: data?.templates || [],
//     total: data?.total || 0,
//     isLoading,
//     isValidating,
//     error,
//     createCodeTemplate,
//     updateCodeTemplate,
//     deleteCodeTemplate,
//     refresh: () => mutate(),
//   };
// }

// export function useCodeTemplate(templateId: string | null): UseCodeTemplateReturn {
//   const {
//     data: template,
//     error,
//     mutate,
//     isValidating,
//     isLoading,
//   } = useSWR(templateId ? ["template", templateId] : null, () => getCodeTemplate(templateId!), SWR_CONFIG);

//   const updateCodeTemplate = async (templateData: Partial<CodeTemplate>): Promise<void> => {
//     const optimisticData = { ...template, ...templateData };

//     return await handleApiRequest({
//       makeRequest: async () => {
//         return await mutate(
//           async () => {
//             await queryUpdateTemplate(templateId!, templateData);
//             return optimisticData;
//           },
//           {
//             optimisticData,
//             ...OPTIMISTIC_UPDATE_OPTIONS,
//           }
//         );
//       },
//       errorCallback: (error: any) => {
//         console.error("Error updating template:", error);
//       },
//     });
//   };

//   return {
//     template,
//     isValidating,
//     isLoading,
//     error,
//     updateCodeTemplate,
//     refresh: () => mutate(),
//   };
// }

import { useEffect, useMemo, useState } from "react";

import useSWR, { KeyedMutator } from "swr";
import { v4 as uuidv4 } from "uuid";

import {
  getCodeTemplate,
  getCodeTemplates,
  createCodeTemplate as queryCreateTemplate,
  deleteCodeTemplate as queryDeleteTemplate,
  updateCodeTemplate as queryUpdateTemplate,
} from "@/lib/queries/templateQueries";
import { handleApiRequest } from "@/lib/utils";

import type {
  Prisma,
  CodeTemplate as PrismaCodeTemplate,
} from "@prisma/client";

type CodeTemplate = PrismaCodeTemplate;
type CodeTemplateCreateInput = Prisma.CodeTemplateCreateInput;
type CodeTemplateUpdateInput = Prisma.CodeTemplateUpdateInput;

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
    error: any;
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
          id: uuidv4(),
          ...templateData,
        },
        ...data.templates,
      ],
      total: data.total + 1,
    };

    return await handleApiRequest({
      makeRequest: async () =>
        await mutate(
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
        ),
      errorCallback: (error: Error) => {
        // SWR will automatically roll back the optimistic update on error
        throw error;
      },
    });
  };

  const updateCodeTemplate = async (
    id: string,
    templateData: CodeTemplateUpdateInput
  ) => {
    const optimisticData: CodeTemplatesResponse = {
      templates: data.templates.map((t) =>
        t.id === id ? { ...t, ...templateData } : t
      ) as CodeTemplate[],
      total: data.total,
    };

    return await handleApiRequest({
      makeRequest: async () =>
        await mutate(
          async () => {
            const updatedTemplate = await queryUpdateTemplate(id, templateData);
            return {
              templates: data.templates.map((t) =>
                t.id === id ? { ...t, ...updatedTemplate } : t
              ),
              total: data.total,
            };
          },
          {
            optimisticData,
            ...OPTIMISTIC_UPDATE_OPTIONS,
          }
        ),
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
      makeRequest: async () =>
        await mutate(
          async () => {
            await queryDeleteTemplate(id);
            return optimisticData;
          },
          {
            optimisticData,
            ...OPTIMISTIC_UPDATE_OPTIONS,
          }
        ),
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
    () => getCodeTemplate(templateId),
    SWR_CONFIG
  );

  const updateCodeTemplate = async (templateData: CodeTemplateUpdateInput) => {
    if (!template) return;
    const optimisticData: CodeTemplate = {
      ...template,
      ...templateData,
    };

    return await handleApiRequest({
      makeRequest: async () =>
        await mutate(
          async () => {
            if (!templateId) throw new Error("Template ID is missing");
            await queryUpdateTemplate(templateId, templateData);
            return optimisticData;
          },
          {
            optimisticData,
            ...OPTIMISTIC_UPDATE_OPTIONS,
          }
        ),
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
