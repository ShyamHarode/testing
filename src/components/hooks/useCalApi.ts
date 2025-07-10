import { useEffect } from "react";

import { getCalApi } from "@calcom/embed-react";

interface CalApiOptions {
  branding?: {
    brandColor?: string;
  };
  hideEventTypeDetails?: boolean;
  layout?: string;
  [key: string]: any;
}

interface UseCalApiProps {
  options?: CalApiOptions;
}

export default function useCalApi({ options = {} }: UseCalApiProps = {}): void {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({});
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
        ...options,
      } as any); // Use any to bypass strict typing for Cal.com API
    })();
  }, [options]);
}

import { useEffect } from "react";

import { getCalApi } from "@calcom/embed-react";

interface CalBrandingStyles {
  brandColor?: string;
  [key: string]: unknown;
}

interface CalStyles {
  branding?: CalBrandingStyles;
  [key: string]: unknown;
}

interface CalUiOptions {
  styles?: CalStyles;
  hideEventTypeDetails?: boolean;
  layout?: "month_view" | "week_view" | "day_view" | "list_view" | string;
  theme?: "light" | "dark" | "auto";
  cssVarsPerTheme?: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

interface CalApiFunction {
  (command: "ui", options?: CalUiOptions): void;
  (command: "preload", options?: { calLink: string }): void;
  (command: string, options?: Record<string, unknown>): void;
}

interface UseCalApiProps {
  options?: CalUiOptions;
}

export default function useCalApi({ options = {} }: UseCalApiProps = {}): void {
  useEffect(() => {
    (async function () {
      const cal = (await getCalApi({})) as CalApiFunction;
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
        ...options,
      });
    })();
  }, [options]);
}
