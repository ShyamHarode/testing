import { useCallback, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditableButtonList from "@/components/editors/_components/EditableButtonList";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import BUTTON_TYPES from "@/lib/constants/buttonTypes";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { cn, getSectionBgImageObject } from "@/lib/utils";
import { imageInputSchema } from "@/lib/zod-schemas/image-input";
import EditorInputField from "../forms/EditorInputField";
import { FormButtonWrapper } from "../FormSubmitButton";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().nullable(),
  showCustomButtons: z.boolean().optional(),
  image: imageInputSchema(false),
  buttons: z.array(
    z.object({
      type: z.string().min(1, "Type is required"),
      label: z.string().min(1, "Label is required"),
      link: z.string().min(1, "Link is required"),
    })
  ),
});

export default function FinalCtaEditor({ content, onSave, page, pages }) {
  const maxButtons = 2;
  const [editingIndex, setEditingIndex] = useState();
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      buttons: content.buttons,
      image: content.image ? getSectionBgImageObject(content.image) : null,
      showCustomButtons: content.showCustomButtons || false,
    },
  });

  const { control, handleSubmit } = form;

  const onFormSubmit = async (data) => {
    const dataToSave = {
      ...data,
      image: data.image?.url ?? "",
    };
    await onSave(dataToSave);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "buttons",
  });

  const showCustomButtons = form.watch("showCustomButtons");

  const addButton = useCallback(() => {
    if (fields.length < maxButtons) {
      append({
        type: BUTTON_TYPES.SITE_LINK,
        label: "Untitled",
        link: "/",
      });

      setEditingIndex(fields.length);
    }
  }, [fields, maxButtons, append]);

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
            sectionName: SECTION_TYPES.FINAL_CTA,
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
            sectionName: SECTION_TYPES.FINAL_CTA,
            page,
          }}
        />

        <ImageUploaderForm form={form} fieldName="image" label="Background Image (optional)" />

        <div className="flex flex-col rounded-lg border p-4 mb-8">
          <FormField
            control={form.control}
            name="showCustomButtons"
            render={({ field }) => (
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5 mr-2.5">
                  <FormLabel className="text-base">Custom buttons {showCustomButtons ? "on" : "off"}</FormLabel>
                  <FormDescription>
                    {showCustomButtons
                      ? "Custom buttons are enabled. Edit below."
                      : "Your buttons will be based on the goals you set up."}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </div>
            )}
          />

          {showCustomButtons && (
            <>
              <EditableButtonList
                pages={pages}
                form={form}
                fields={fields}
                update={update}
                editingIndex={editingIndex}
                setEditingIndex={setEditingIndex}
                remove={remove}
                listName="Home hero buttons"
                fieldName="buttons"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className={cn(fields.length >= maxButtons && "opacity-0")}
                onClick={addButton}
              >
                {"+ Add Button"}
              </Button>
            </>
          )}
        </div>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
