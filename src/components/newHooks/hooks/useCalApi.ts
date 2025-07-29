import { useEffect } from "react";

import { getCalApi } from "@calcom/embed-react";

type CalApi = Awaited<ReturnType<typeof getCalApi>>;
type UiConfig = Parameters<CalApi>[1];

interface UseCalApiProps {
  options?: Omit<UiConfig, "styles">;
}

export default function useCalApi({ options }: UseCalApiProps = {}): void {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({});
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
        ...options,
      });
    })();
  }, [options]);
}
