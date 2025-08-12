import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import EditorInputField from "../forms/EditorInputField";
import { FormButtonWrapper } from "../FormSubmitButton";

// Types
import type { Page } from "@prisma/client";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().nullable(),
});

type FormData = z.infer<typeof validationSchema>;

interface Content {
  header?: string;
  subheader?: string | null;
}

interface TextEditorProps {
  content: Content;
  onSave: (data: FormData) => Promise<void>;
  page: Page;
}

export default function TextEditor({ content, onSave, page }: TextEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
    },
  });

  const { handleSubmit } = form;

  const onFormSubmit = async (data: FormData) => {
    await onSave(data);
    form.reset(data);
    setEditingIndex(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="pb-12 overflow-auto">
        <EditorInputField
          form={form}
          fieldName="header"
          label="Header"
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Header",
            sectionName: SECTION_TYPES.TEXT,
            page,
          }}
        />

        <EditorInputField
          form={form}
          fieldName="subheader"
          label="Subheader"
          type="textarea"
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Subheader",
            sectionName: SECTION_TYPES.TEXT,
            page,
          }}
        />

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
