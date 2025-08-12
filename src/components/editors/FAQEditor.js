import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { useWebsite } from "@/components/hooks/useWebsite";
import { Button } from "@/components/ui/button";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().optional(),
  questions: z
    .array(
      z.object({
        a: z.string().min(1, "Answer is required"),
        q: z.string().min(1, "Question is required"),
      })
    )
    .optional(),
});

export default function FAQEditor({ content, onSave, page, pageSlug }) {
  const { website } = useWebsite(["services"]);

  const serviceSlug = useMemo(() => {
    if (!!website?.services?.length) {
      const service = website.services.find((service) => service.slug === pageSlug);
      return service?.slug;
    }

    return null;
  }, [pageSlug, website?.services]);

  const [editingIndex, setEditingIndex] = useState();

  const defaultValues = {
    header: content.header,
    subheader: content.subheader,
    questions: content.questions,
  };

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
    setEditingIndex(null);
  };

  const { control, handleSubmit } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const handleSortEnd = (newItems) => {
    form.setValue("questions", newItems, { shouldDirty: true });
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
          sectionName: SECTION_TYPES.FAQS,
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
          sectionName: SECTION_TYPES.FAQS,
          page,
        }}
      />

      <EditorInputList
        fields={fields}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        remove={remove}
        listName="FAQs"
        onSortEnd={handleSortEnd}
        onXClick={() => {
          if (!fields[editingIndex]?.q) {
            remove(editingIndex);
          }
          setEditingIndex(null);
        }}
        renderDisplay={(field, index) => (
          <div className="flex flex-col gap-2 border-ash-200 border p-3 rounded-md">
            <div className="flex flex-col gap-1">
              <p className="font-bold text-sm">
                {index + 1}. {field.q}
              </p>
              <p className="font-normal text-sm text-ash-600 line-clamp-2">{field.a}</p>
            </div>
          </div>
        )}
        renderEdit={(_, index) => (
          <>
            <EditorInputField
              form={form}
              fieldName={`questions.${index}.q`}
              label="Question"
              type="textarea"
              aiPrompt={{
                type: PROMPT_TYPES.FAQ,
                answer: form.watch(`questions.${index}.a`),
                existing: form.watch(`questions`),
                serviceSlug,
                page,
              }}
            />

            <EditorInputField
              form={form}
              fieldName={`questions.${index}.a`}
              label="Answer"
              type="textarea"
              aiPrompt={{
                type: PROMPT_TYPES.FAQ,
                question: form.watch(`questions.${index}.q`),
                existing: form.watch(`questions`),
                serviceSlug,
                page,
              }}
            />
          </>
        )}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`${form.formState.isDirty ? "mb-[69px]" : ""}`}
        onClick={() => {
          append({
            q: "",
            a: "",
          });
          setEditingIndex(fields.length);
        }}
      >
        Add FAQ
      </Button>

      <FormButtonWrapper form={form} />
    </form>
  );
}
