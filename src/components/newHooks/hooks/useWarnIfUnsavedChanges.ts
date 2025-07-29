import { useEffect } from "react";
import { useRouter } from "next/router";

import NProgress from "nprogress";

const useWarnIfUnsavedChanges = (isDirty: boolean): void => {
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    const handleRouteChange = () => {
      if (isDirty) {
        const confirmationMessage = "You have unsaved changes, are you sure you want to leave?";
        if (window.confirm(confirmationMessage)) {
          return;
        } else {
          router.events.emit("routeChangeError");
          setTimeout(() => {
            NProgress.done(true);
          });
          throw "routeChange aborted";
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [isDirty, router.events]);
};

export default useWarnIfUnsavedChanges;
