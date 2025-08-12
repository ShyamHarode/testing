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
  freeform: z.string().min(1, "About field is required"),
});

export default function AboutFreeFormEditor({ content, onSave, page }) {
  const defaultValues = {
    header: content.header,
    freeform: content.freeform,
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
            sectionName: SECTION_TYPES.ABOUT_FREE_FORM,
            page,
          }}
        />

        <RichTextarea
          fieldName={"freeform"}
          label={"About"}
          form={form}
          aiPrompt={{
            type: PROMPT_TYPES.FREEFORM,
            componentName: "About",
            sectionName: SECTION_TYPES.ABOUT_FREE_FORM,
            page,
          }}
          editorContentClassName="max-h-[350px] overflow-y-scroll"
        />

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
