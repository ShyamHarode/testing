import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { logFrontendError } from "@/lib/utils";

// Define the context value type
interface GlobalContextType {
  someState: any; // You may want to replace 'any' with a more specific type
  setSomeState: (value: any) => void; // You may want to replace 'any' with a more specific type
}

// Define component props type
interface GlobalContextProviderProps {
  children: ReactNode;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalContextProvider = ({ children }: GlobalContextProviderProps) => {
  const [someState, setSomeState] = useState<any>(null); // You may want to replace 'any' with a more specific type

  const value: GlobalContextType = useMemo(
    () => ({
      someState,
      setSomeState,
    }),
    [someState]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);

  if (typeof context === "undefined") {
    const error = new Error("useGlobalContext must be used within a GlobalContextProvider");
    logFrontendError("useGlobalContext error:", error);
    throw error;
  }

  return context;
};
