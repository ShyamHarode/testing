import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import RichTextarea from "@/components/forms/RichTextarea";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { getSectionBgImageObject } from "@/lib/utils";
import { imageInputSchema } from "@/lib/zod-schemas/image-input";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  history: z.string().min(1, "Field is required"),
  image: imageInputSchema(),
  alignText: z.enum(["left", "right"]),
});

export default function AboutEditor({ content, onSave, page }) {
  const defaultValues = {
    header: content.header,
    history: content.history,
    image: getSectionBgImageObject(content.image),
    alignText: content.alignText || "left",
  };

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const onFormSubmit = async (data) => {
    const dataToSave = { ...data, image: data.image?.url };
    await onSave(dataToSave);
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
            sectionName: SECTION_TYPES.ABOUT,
            page,
          }}
        />

        <RichTextarea
          fieldName="history"
          label="Company background, goals, values"
          form={form}
          aiPrompt={{
            type: PROMPT_TYPES.ABOUT_FREEFORM_PARAGRAPH,
            componentName: "Company background, goals, values",
            sectionName: SECTION_TYPES.ABOUT,
            page,
          }}
          editorContentClassName="max-h-[350px] overflow-y-scroll"
        />

        <FormField
          control={form.control}
          name="alignText"
          render={({ field }) => (
            <FormItem className=" mt-6">
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value}>
                  <FormItem className="flex items-center gap-2 m-0">
                    <FormControl>
                      <RadioGroupItem value="left" />
                    </FormControl>
                    <FormLabel className="!mt-0">Text left, image right</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2 m-0">
                    <FormControl>
                      <RadioGroupItem value="right" />
                    </FormControl>
                    <FormLabel className="!mt-0">Text right, image left</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <ImageUploaderForm className="mb-14" fieldName="image" form={form} />

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
