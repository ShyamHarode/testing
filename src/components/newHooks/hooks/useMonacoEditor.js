import { useRef } from "react";

// Minimal Monaco Editor interfaces based on actual usage
interface MonacoAction {
  run(): Promise<void>;
}

interface MonacoEditor {
  getAction(actionId: string): MonacoAction | null;
  getValue(): string;
}

export const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  wrappingIndent: "indent",
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
    enabled: "off",
  },
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
} as const;

export function useMonacoEditor() {
  const editorRef = useRef<MonacoEditor | null>(null);

  const formatEditorContent = async (editor: MonacoEditor | null = editorRef.current) => {
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

  const handleEditorDidMount = (editor: MonacoEditor | null, options = {}) => {
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
