import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Editor from "@monaco-editor/react";
import { Check, Copy, List } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { EDITOR_OPTIONS, useMonacoEditor } from "@/components/hooks/useMonacoEditor";
import { useUser } from "@/components/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ViewTemplatesModal from "../code-templates/ViewTemplatesModal";

const validationSchema = z.object({
  customCode: z.string().optional(),
});

export default function IframeEditor({ content, onSave, page }) {
  const { editorRef, formatEditorContent, handleEditorDidMount } = useMonacoEditor();
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [copiedColor, setCopiedColor] = useState(null);
  const [websiteColors, setWebsiteColors] = useState({
    primaryColor: page.website.primaryColor || "#FFFFFF",
    secondaryColor: page.website.secondaryColor || "#000000",
  });

  const { isSuperUser } = useUser();

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      customCode: content.customCode || "",
    },
  });

  const onFormSubmit = async (data) => {
    const formattedValue = await formatEditorContent();

    if (formattedValue !== null) {
      form.setValue("customCode", formattedValue);
      data.customCode = formattedValue;
    }

    await onSave(data);
    form.reset(data);
  };

  const handleApplyTemplate = (code) => {
    try {
      form.setValue("customCode", code, { shouldDirty: true });
      const formatAction = editorRef.current?.getAction("editor.action.formatDocument");
      if (formatAction) {
        formatAction.run();
      }
      toast.success("Template applied");
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply template");
    }
    setTemplatesModalOpen(false);
  };

  const copyToClipboard = async (color, colorName) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(colorName);
      toast.success(`${colorName} color copied!`);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      console.error("Failed to copy color:", error);
      toast.error("Failed to copy color");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onFormSubmit)} className="pb-12 px-2 overflow-hidden">
      <div className="relative w-full">
        {isSuperUser && (
          <div className="flex gap-2 mb-4">
            <Button type="button" size="sm" variant="outline" onClick={() => setTemplatesModalOpen(true)}>
              <List className="h-4 w-4 mr-2" />
              View Templates
            </Button>
          </div>
        )}
        <Label htmlFor="customCode" className="text-ash-800 font-semibold mb-2 block">
          Custom Code
        </Label>
        <Editor
          id="customCode"
          height="500px"
          width="100%"
          defaultLanguage="html"
          theme="vs-dark"
          value={form.watch("customCode")}
          onChange={(value) => form.setValue("customCode", value, { shouldDirty: true })}
          onMount={handleEditorDidMount}
          options={EDITOR_OPTIONS}
        />
      </div>

      <div className="mt-6 p-4 bg-ash-100 rounded-lg border">
        <Label className="text-ash-800 font-semibold mb-3 block">Brand Colors</Label>

        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border-2 border-ash-300 cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: websiteColors.primaryColor }}
              onClick={() => copyToClipboard(websiteColors.primaryColor, "Primary")}
              title="Click to copy primary color"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-ash-700">Primary</span>
              <span className="text-xs text-ash-500 font-mono">{websiteColors.primaryColor}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(websiteColors.primaryColor, "Primary")}
            >
              {copiedColor === "Primary" ? (
                <Check className="h-3 w-3 text-mint-600" />
              ) : (
                <Copy className="h-3 w-3 text-ash-500" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border-2 border-ash-300 cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: websiteColors.secondaryColor }}
              onClick={() => copyToClipboard(websiteColors.secondaryColor, "Secondary")}
              title="Click to copy secondary color"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-ash-700">Secondary</span>
              <span className="text-xs text-ash-500 font-mono">{websiteColors.secondaryColor}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(websiteColors.secondaryColor, "Secondary")}
            >
              {copiedColor === "Secondary" ? (
                <Check className="h-3 w-3 text-mint-600" />
              ) : (
                <Copy className="h-3 w-3 text-ash-500" />
              )}
            </Button>
          </div>

          {page.website.derivativeColors &&
            Object.keys(page.website.derivativeColors).map((key, index) => (
              <div className="flex items-center gap-2" key={key}>
                <div
                  className="w-8 h-8 rounded border-2 border-ash-300 cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: page.website.derivativeColors[key] }}
                  onClick={() => copyToClipboard(page.website.derivativeColors[key], `Color ${index + 1}`)}
                  title={`Click to copy ${page.website.derivativeColors[key]}`}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ash-700">Color {index + 1}</span>
                  <span className="text-xs text-ash-500 font-mono">{page.website.derivativeColors[key]}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(page.website.derivativeColors[key], `Color ${index + 1}`)}
                >
                  {copiedColor === `Color ${index + 1}` ? (
                    <Check className="h-3 w-3 text-mint-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-ash-500" />
                  )}
                </Button>
              </div>
            ))}
        </div>
      </div>

      <FormButtonWrapper form={form} />

      {isSuperUser && templatesModalOpen && (
        <ViewTemplatesModal
          visible={templatesModalOpen}
          setHidden={() => setTemplatesModalOpen(false)}
          onApplyTemplate={handleApplyTemplate}
        />
      )}
    </form>
  );
}
