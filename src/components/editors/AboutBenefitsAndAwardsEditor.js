import { useState } from "react";
import Image from "next/image";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { cn, getSectionBgImageObject } from "@/lib/utils";
import { imageInputSchema } from "@/lib/zod-schemas/image-input";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().optional(),
  benefitsAndAwards: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().nullable().optional(),
      image: imageInputSchema(false).nullable().optional(),
    })
  ),
});

export default function AboutBenefitsAndAwardsEditor({ content, onSave, page }) {
  const [editingIndex, setEditingIndex] = useState();
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      benefitsAndAwards:
        content.benefitsAndAwards.map((item) => ({
          ...item,
          image: getSectionBgImageObject(item.image),
        })) || [],
    },
  });

  const { control, handleSubmit } = form;

  const onFormSubmit = async (data) => {
    const dataToSave = {
      ...data,
      benefitsAndAwards: data.benefitsAndAwards.map((item) => ({
        ...item,
        image: item.image?.url ?? "",
      })),
    };
    await onSave(dataToSave);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "benefitsAndAwards",
  });

  const handleSortEnd = (newItems) => {
    form.setValue("benefitsAndAwards", newItems, { shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <EditorInputField
        form={form}
        fieldName="header"
        label="Header"
        aiPrompt={{
          type: PROMPT_TYPES.HEADER_SUBHEADER,
          componentName: "Header",
          sectionName: SECTION_TYPES.ABOUT_BENEFITS_AND_AWARDS,
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
          sectionName: SECTION_TYPES.ABOUT_BENEFITS_AND_AWARDS,
          page,
        }}
      />

      <EditorInputList
        fields={fields}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        remove={remove}
        listName="Benefit/award entries"
        onSortEnd={handleSortEnd}
        onXClick={() => {
          if (!fields[editingIndex]?.title) {
            remove(editingIndex);
          }
          setEditingIndex(null);
        }}
        renderDisplay={(field) => (
          <div className="flex items-center gap-4 border-ash-200 border p-3 rounded-md h-full">
            {field.image?.url && (
              <Image
                src={field.image.url}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-ash-500 object-cover"
                alt={`${field.title}'s thumbnail image`}
              />
            )}
            <div className="flex flex-col gap-1">
              <p className="font-bold text-sm">{field.title}</p>
              {field.description && (
                <p className={cn("font-normal text-xs italic line-clamp-2 text-ash-600")}>{field.description}</p>
              )}
            </div>
          </div>
        )}
        renderEdit={(_, index) => (
          <>
            <EditorInputField
              condense
              form={form}
              fieldName={`benefitsAndAwards.${index}.title`}
              label="Title"
              aiPrompt={{
                type: PROMPT_TYPES.BENEFITS_AND_AWARDS,
                section: SECTION_TYPES.ABOUT_BENEFITS_AND_AWARDS,
                description: form.watch(`benefitsAndAwards.${index}.description`),
                existing: form.watch("benefitsAndAwards"),
                page,
              }}
            />

            <EditorInputField
              condense
              form={form}
              fieldName={`benefitsAndAwards.${index}.description`}
              label="Description (optional)"
              aiPrompt={{
                type: PROMPT_TYPES.BENEFITS_AND_AWARDS,
                section: SECTION_TYPES.ABOUT_BENEFITS_AND_AWARDS,
                title: form.watch(`benefitsAndAwards.${index}.title`),
                existing: form.watch("benefitsAndAwards"),
                page,
              }}
            />

            <ImageUploaderForm fieldName={`benefitsAndAwards.${index}.image`} form={form} />
          </>
        )}
      />

      <Button
        type="button"
        size="sm"
        variant="secondary"
        className={`${form.formState.isDirty ? "mb-[69px]" : ""}`}
        onClick={() => {
          append({
            title: "Untitled",
          });
          setEditingIndex(fields.length);
        }}
      >
        {"+ Add Benefit/Award"}
      </Button>

      <FormButtonWrapper form={form} />
    </form>
  );
}
