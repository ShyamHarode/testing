import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import RichTextarea from "@/components/forms/RichTextarea";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Form } from "@/components/ui/form";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  history: z.string().min(1, "Details is required"),
});

export default function ServiceDetailsEditor({ content, onSave, page }) {
  const defaultValues = {
    header: content.header,
    history: content.history,
  };

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)}>
        <EditorInputField
          form={form}
          fieldName="header"
          label="Header"
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Header",
            sectionName: SECTION_TYPES.SERVICE_DETAILS,
            page,
          }}
        />

        <RichTextarea
          fieldName="history"
          label="Service Details (300+ words ideally)"
          form={form}
          aiPrompt={{
            type: PROMPT_TYPES.FREEFORM,
            componentName: "Service Details (300+ words ideally)",
            sectionName: SECTION_TYPES.SERVICE_DETAILS,
            page,
          }}
          editorContentClassName="max-h-[350px] overflow-y-scroll"
        />

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
