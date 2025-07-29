import { useRef } from "react";

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
};

export function useMonacoEditor() {
  const editorRef = useRef(null);

  const formatEditorContent = async (editor = editorRef.current) => {
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

  const handleEditorDidMount = (editor, options = {}) => {
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
