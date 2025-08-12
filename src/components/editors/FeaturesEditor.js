import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import IconSelectorModal from "@/components/forms/IconSelectorModal";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { getSectionBgImageObject } from "@/lib/utils";
import { imageInputSchema } from "@/lib/zod-schemas/image-input";

const validationSchema = z.object({
  header: z.string().trim().min(1, "Header is required"),
  subheader: z.string().optional(),
  bgImage: imageInputSchema(false),
  features: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Title is required"),
        description: z.string().trim().optional(),
        icon: z.object({
          svgCode: z.string(),
          id: z.string(),
          _timestamp: z.number().optional(),
        }),
      })
    )
    .min(1, "At least one feature is required")
    .max(4, "Maximum of 4 features allowed"),
});

export default function FeaturesEditor({ content, onSave, page }) {
  const [editingIndex, setEditingIndex] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      features: content.features || [],
      description: content.description,
      bgImage: content.bgImage ? getSectionBgImageObject(content.bgImage) : null,
    },
  });

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const canAddStep = fields.length < 4;
  const canRemoveStep = fields.length > 1;

  const handleSortEnd = (newItems) => {
    form.setValue("features", newItems, { shouldDirty: true });
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
            sectionName: SECTION_TYPES.FEATURES,
            page,
          }}
        />
        <EditorInputField
          form={form}
          fieldName="subheader"
          label="Subheader"
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Subheader",
            sectionName: SECTION_TYPES.FEATURES,
            page,
          }}
        />
        <ImageUploaderForm form={form} fieldName="bgImage" label="Background Image (optional)" />
        <EditorInputList
          fields={fields}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          allowDelete={canRemoveStep}
          remove={remove}
          listName="Features"
          onSortEnd={handleSortEnd}
          renderDisplay={(field) => (
            <div className="flex flex-col gap-2 border-ash-200 border p-3 rounded-md h-full">
              {field.icon && <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: field.icon.svgCode }} />}
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">{field.title}</p>
                <p className="text-sm text-ash-500">{field.description}</p>
              </div>
            </div>
          )}
          renderEdit={(_, index) => (
            <>
              <Label>Icon</Label>
              <div className="relative w-fit">
                <div
                  onClick={() => setIsModalOpen(true)}
                  type="button"
                  className="mb-4 flex items-center justify-center p-4 outline-dashed outline-1 outline-ash-300 rounded-md hover:bg-ash-300 transition-all duration-200 ease-in-out cursor-pointer"
                >
                  {form.watch(`features.${index}.icon`) ? (
                    <div
                      className="w-8 h-8"
                      dangerouslySetInnerHTML={{
                        __html: form.watch(`features.${index}.icon.svgCode`),
                      }}
                    />
                  ) : (
                    <p>Add icon</p>
                  )}
                </div>
                {form.watch(`features.${index}.icon`) && (
                  <div
                    type="button"
                    onClick={() => {
                      form.setValue(`features.${index}.icon`, undefined, {
                        shouldDirty: true,
                      });
                    }}
                    className="absolute -top-2 -right-2 bg-lava-400 hover:bg-lava-700 p-1 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out"
                  >
                    <X className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <EditorInputField condense form={form} fieldName={`features.${index}.title`} label="Title" />
              <EditorInputField
                condense
                form={form}
                fieldName={`features.${index}.description`}
                label="Description"
                type="textarea"
              />
              <IconSelectorModal
                fieldName={`features.${index}.icon`}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
              />
            </>
          )}
        />

        {/* If the FormButtonWrapper is visible, then add this margin bottom (height of the FormButtonWrapper) to the button so it doesn't get cut off, this should apply to every element that is affected by the FormButtonWrapper */}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={`${form.formState.isDirty ? "mb-[69px]" : ""}`}
          onClick={() => {
            if (canAddStep) {
              append({
                title: `Your feature`,
              });
              setEditingIndex(fields.length);
            }
          }}
          disabled={!canAddStep}
        >
          {canAddStep ? "+ Add feature" : "Only 4 features allowed"}
        </Button>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
