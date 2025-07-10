import { useMemo } from "react";
import { useRouter } from "next/router";

// Overloads for different parameter types
function useRouterQuery(query: string): string | string[] | undefined;
function useRouterQuery(query: string[]): Record<string, string | string[] | undefined>;
function useRouterQuery(query: string | string[]): any {
  const router = useRouter();

  return useMemo(() => {
    let result: any;

    if (Array.isArray(query)) {
      result = {} as Record<string, string | string[] | undefined>;
      query.forEach((q) => {
        result[q] = router.query[q];
      });
    } else {
      result = router.query[query];
    }

    return result;
  }, [query, router.query]);
}

export default useRouterQuery;
