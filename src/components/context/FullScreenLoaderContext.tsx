import { createContext, ReactNode, useCallback, useContext, useState } from "react";

// Define the context value type
interface LoaderContextType {
  showLoader: (text?: string) => void;
  hideLoader: () => void;
  isVisible: boolean;
}

// Define component props types
interface LoaderProviderProps {
  children: ReactNode;
}

interface FullScreenLoaderProps {
  loadingText: string;
}

// Create a Context for the loader
const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const useFullScreenLoader = (): LoaderContextType => {
  const context = useContext(LoaderContext);

  if (context === undefined) {
    throw new Error("useFullScreenLoader must be used within a LoaderProvider");
  }

  return context;
};

export const LoaderProvider = ({ children }: LoaderProviderProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");

  const showLoader = useCallback((_text: string = "") => {
    setLoadingText(_text); // Set the loading text
    setIsVisible(true);
  }, []);

  const hideLoader = useCallback(() => setIsVisible(false), []);

  const contextValue: LoaderContextType = {
    showLoader,
    hideLoader,
    isVisible,
  };

  return (
    <LoaderContext.Provider value={contextValue}>
      {children}
      {isVisible && <FullScreenLoader loadingText={loadingText} />}
    </LoaderContext.Provider>
  );
};

const FullScreenLoader = ({ loadingText }: FullScreenLoaderProps) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] flex-col">
    {loadingText && <span className="text-white block mb-4 font-medium">{loadingText}</span>}
    <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-white/50 relative">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);
