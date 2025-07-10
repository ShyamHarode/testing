import { useRouter } from "next/router";
import { useEffect } from "react";

const useWarnIfUnsavedChanges = (unsavedChanges: boolean): void => {
  const router = useRouter();

  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent): string | void => {
      if (unsavedChanges) {
        e.preventDefault();
        return (e.returnValue = "Are you sure you want to close?");
      }
    };

    const handleBrowseAway = (): void => {
      if (unsavedChanges && !confirm("Are you sure you want to leave?")) {
        router.events.emit("routeChangeError");
        throw "Route Cancelled";
      }
    };

    window.addEventListener("beforeunload", handleWindowClose);
    router.events.on("routeChangeStart", handleBrowseAway);

    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
      router.events.off("routeChangeStart", handleBrowseAway);
    };
  }, [unsavedChanges, router]);
};

export default useWarnIfUnsavedChanges;
