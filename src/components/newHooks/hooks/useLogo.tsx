import { ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";

type LocationInApp = "authPage" | "navBar" | "onboarding" | "sidebar";

const logoMap: Record<string, Record<LocationInApp, ReactElement>> = {
  pdm: {
    authPage: <img src="/pdm-white.png" className="h-20" alt="PDM Logo" />,
    navBar: <img src="/pdm-powered-by.png" className="h-12" alt="PDM Logo" />,
    onboarding: (
      <div className="mb-10">
        <img src="/pdm-black.png" className="h-8" alt="PDM Logo" />
      </div>
    ),
    sidebar: <img src="/pdm-black.png" className="h-6 mb-1" alt="PDM Logo" />,
  },
  default: {
    authPage: <img src="/rebolt-branding/rebolt-full-dark.svg" className="h-10" alt="Rebolt Logo" />,
    navBar: <img src="/rebolt-branding/rebolt-full-dark.svg" className="h-7" alt="Rebolt Logo" />,
    onboarding: <img src="/rebolt-branding/rebolt-full-dark.svg" className="h-8" alt="Rebolt Logo" />,
    sidebar: <img src="/rebolt-branding/rebolt-full-dark.svg" className="h-8" alt="Rebolt Logo" />,
  },
};

const useLogo = (locationInApp: LocationInApp): ReactElement => {
  const router = useRouter();
  const [whitelabelLogo, setWhitelabelLogo] = useState<string | string[] | null>("default");

  // This checks if there is a whitelabel query parameter or a stored whitelabel provider in local storage.
  // If the query parameter exists and is different from the stored provider, it updates the local storage and state with the new provider.
  // Otherwise, it sets the state with the stored provider.
  useEffect(() => {
    const whiteLabelQueryParam = router.query.wlp;
    const storedWhitelabelProvider = window.localStorage.getItem("wlp");

    if (whiteLabelQueryParam || storedWhitelabelProvider) {
      if (whiteLabelQueryParam && whiteLabelQueryParam !== storedWhitelabelProvider) {
        window.localStorage.setItem("wlp", String(whiteLabelQueryParam));
        setWhitelabelLogo(whiteLabelQueryParam);
      } else {
        setWhitelabelLogo(storedWhitelabelProvider);
      }
    }
  }, [router.query.wlp]);

  const getLogo = (whitelabelLogo: string | string[] | null, locationInApp: LocationInApp): ReactElement => {
    switch (whitelabelLogo) {
      case "pdm":
        return logoMap.pdm[locationInApp];
      case "default":
      case "undefined":
      default:
        return logoMap.default[locationInApp];
    }
  };

  return getLogo(whitelabelLogo, locationInApp);
};

export default useLogo;
