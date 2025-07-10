/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

type WhitelabelProvider = "pdm" | "default";
type LocationInApp = "authPage" | "navBar" | "onboarding" | "sidebar";

const logoMap: Record<WhitelabelProvider, Record<LocationInApp, React.JSX.Element>> = {
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

const useLogo = (locationInApp: LocationInApp): React.JSX.Element => {
  const router = useRouter();
  const [whitelabelLogo, setWhitelabelLogo] = useState<WhitelabelProvider>("default");

  // This checks if there is a whitelabel query parameter or a stored whitelabel provider in local storage.
  // If the query parameter exists and is different from the stored provider, it updates the local storage and state with the new provider.
  // Otherwise, it sets the state with the stored provider.
  useEffect(() => {
    const whiteLabelQueryParam = router.query.wlp as string | undefined;
    const storedWhitelabelProvider = window.localStorage.getItem("wlp") as WhitelabelProvider | null;

    if (whiteLabelQueryParam || storedWhitelabelProvider) {
      if (whiteLabelQueryParam && whiteLabelQueryParam !== storedWhitelabelProvider) {
        window.localStorage.setItem("wlp", whiteLabelQueryParam);
        setWhitelabelLogo(whiteLabelQueryParam as WhitelabelProvider);
      } else if (storedWhitelabelProvider) {
        setWhitelabelLogo(storedWhitelabelProvider);
      }
    }
  }, [router.query.wlp]);

  const getLogo = (whitelabelLogo: WhitelabelProvider, locationInApp: LocationInApp): React.JSX.Element => {
    switch (whitelabelLogo) {
      case "pdm":
        return logoMap.pdm[locationInApp];
      case "default":
      default:
        return logoMap.default[locationInApp];
    }
  };

  return getLogo(whitelabelLogo, locationInApp);
};

export default useLogo;
