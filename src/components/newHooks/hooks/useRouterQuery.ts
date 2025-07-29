import { useMemo } from "react";
import { useRouter } from "next/router";

type QueryValue = string | string[] | undefined;
type QueryObject = { [key: string]: QueryValue };

export default function useRouterQuery(_query: string): QueryValue;
export default function useRouterQuery(_query: string[]): QueryObject;

export default function useRouterQuery(query: string | string[]): QueryValue | QueryObject {
  const router = useRouter();

  return useMemo(() => {
    let result: QueryValue | QueryObject;

    if (Array.isArray(query)) {
      result = {};
      query.forEach((q) => {
        (result as QueryObject)[q] = router.query[q];
      });
    } else {
      result = router.query[query];
    }

    console.log("[useRouterQuery] Input:", query, "=> Output:", result);

    return result;
  }, [query, router.query]);
}
