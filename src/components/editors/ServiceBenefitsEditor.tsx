import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";

// Types
import type { Page } from "@prisma/client";

const benefitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  benefits: z.array(benefitSchema).optional(),
});

type Benefit = z.infer<typeof benefitSchema>;
type BenefitField = Benefit & { id: string };
type FormData = z.infer<typeof validationSchema>;

interface Content {
  header?: string;
  benefits?: Benefit[];
}

interface ServiceBenefitsEditorProps {
  content: Content;
  onSave: (data: FormData) => Promise<void>;
  page: Page;
}

export default function ServiceBenefitsEditor({ content, onSave, page }: ServiceBenefitsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      benefits: content.benefits || [],
    },
  });

  const onFormSubmit = async (data: FormData) => {
    await onSave(data);
    form.reset(data);
    setEditingIndex(null);
  };

  const { control, handleSubmit } = form;

  const { fields, append, remove } = useFieldArray<FormData, "benefits">({
    control,
    name: "benefits",
  });

  const handleSortEnd = (newItems: BenefitField[]) => {
    const withoutIds: Benefit[] = newItems.map(({ id: _, ...rest }) => rest);
    form.setValue("benefits", withoutIds, { shouldDirty: true });
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
          sectionName: SECTION_TYPES.SERVICE_BENEFITS,
          page,
        }}
      />

      <EditorInputList<BenefitField>
        fields={fields as unknown as BenefitField[]}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        remove={remove}
        listName="Service benefits"
        onSortEnd={handleSortEnd}
        onXClick={() => {
          if (editingIndex !== null && !fields[editingIndex]?.title) {
            remove(editingIndex);
          }
          setEditingIndex(null);
        }}
        renderDisplay={(field) => (
          <div className="flex flex-col gap-2 border-ash-200 border p-3 rounded-md h-full">
            <div className="flex flex-col gap-1">
              <p className="font-bold text-sm">{field.title}</p>
              <p className="font-normal text-xs italic line-clamp-2 text-ash-600">{field.description}</p>
            </div>
          </div>
        )}
        renderEdit={(_field, index) => (
          <>
            <EditorInputField
              condense
              form={form}
              fieldName={`benefits.${index}.title`}
              label="Title"
              aiPrompt={{
                type: PROMPT_TYPES.BENEFITS_AND_AWARDS,
                section: SECTION_TYPES.SERVICE_BENEFITS,
                description: form.watch(`benefits.${index}.description`),
                existing: form.watch("benefits"),
                page,
              }}
            />
            <EditorInputField
              condense
              form={form}
              fieldName={`benefits.${index}.description`}
              label="Description"
              type="textarea"
              aiPrompt={{
                type: PROMPT_TYPES.BENEFITS_AND_AWARDS,
                section: SECTION_TYPES.SERVICE_BENEFITS,
                title: form.watch(`benefits.${index}.title`),
                existing: form.watch("benefits"),
                page,
              }}
            />
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
          } as Benefit);
          setEditingIndex(fields.length);
        }}
      >
        {"+ Add Benefit"}
      </Button>

      <FormButtonWrapper form={form} />
    </form>
  );
}
