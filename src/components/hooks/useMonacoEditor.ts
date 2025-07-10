import { useRef } from "react";

// Monaco editor types - making it optional since it may not be available
type MonacoEditor = {
  getValue: () => string;
  getAction: (actionId: string) => { run: () => Promise<void> } | null;
} | null;

export const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  wrappingIndent: "indent" as const,
  automaticLayout: true,
  formatOnType: true,
  scrollBeyondLastLine: false,
  tabSize: 2,
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  parameterHints: { enabled: false },
  hover: {
    enabled: false,
    delay: 0,
  },
  inlayHints: {
    enabled: "off" as const,
  },
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
};

interface UseMonacoEditorReturn {
  editorRef: React.MutableRefObject<MonacoEditor>;
  formatEditorContent: (editor?: MonacoEditor) => Promise<string | null>;
  handleEditorDidMount: (editor: MonacoEditor, options?: any) => void;
}

export function useMonacoEditor(): UseMonacoEditorReturn {
  const editorRef = useRef<MonacoEditor>(null);

  const formatEditorContent = async (editor: MonacoEditor = editorRef.current): Promise<string | null> => {
    if (!editor) return null;

    try {
      const formatAction = editor.getAction("editor.action.formatDocument");
      if (formatAction) {
        await formatAction.run();
        return editor.getValue();
      }
      return null;
    } catch (error) {
      console.error("Error formatting editor content:", error);
      return null;
    }
  };

  const handleEditorDidMount = (editor: MonacoEditor, options: any = {}): void => {
    if (!editor) return;

    editorRef.current = editor;
    const currentValue = editor.getValue();

    if (currentValue && currentValue.trim()) {
      const formatAction = editor.getAction("editor.action.formatDocument");
      if (formatAction) {
        formatAction.run();
      }
    }
  };

  return {
    editorRef,
    formatEditorContent,
    handleEditorDidMount,
  };
}
