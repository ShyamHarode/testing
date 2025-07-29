import { useEffect, useState } from "react";

export const CALENDAR_LINKS = {
  DEFAULT: "https://cal.com/team/builtright/launch",
  HSA_PARTNER: "https://cal.com/team/builtright/builtright-hsa-website-onboarding-call",
  BCBA_PARTNER: "https://cal.com/team/builtright/get-a-builtright-bcba-site",
  EWINING_PARTNER: "https://cal.com/team/builtright/get-an-ewing-builtright-site",
  NTCA_PARTNER: "https://cal.com/team/builtright/get-a-ntca-builtright-site",
  STRIPE_PARTNER: "https://cal.com/team/builtright/get-a-builtright-stripe-life-site",
} as const;

type CalendarLink = typeof CALENDAR_LINKS[keyof typeof CALENDAR_LINKS];

interface UseCalendarLinkReturn {
  calendarLink: CalendarLink;
  calPath: string;
}

export function useCalendarLink(): UseCalendarLinkReturn {
  const [calendarLink, setCalendarLink] = useState<CalendarLink>(CALENDAR_LINKS.DEFAULT);

  useEffect(() => {
    // Check if we're in a browser environment and localStorage is available
    const isBrowser = typeof window !== "undefined";
    const isLocalStorageAvailable = isBrowser && window?.localStorage;
    if (!isLocalStorageAvailable) return;

    try {
      const fromHSA = localStorage?.getItem("fromHSA");
      const link = fromHSA === "yes" ? CALENDAR_LINKS.HSA_PARTNER : CALENDAR_LINKS.DEFAULT;
      setCalendarLink(link);
    } catch (error) {
      console.warn("Failed to access localStorage:", error);
      setCalendarLink(CALENDAR_LINKS.DEFAULT);
    }
  }, []);

  return { calendarLink, calPath: calendarLink.replace("https://cal.com/", "") };
}
