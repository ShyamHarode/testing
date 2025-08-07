import { useState } from "react";
import Image from "next/image";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import DarkModeToggle from "@/components/DarkModeToggle";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { getSectionBgImageObject } from "@/lib/utils";
import { imageInputSchema } from "@/lib/zod-schemas/image-input";
import EditorInputField from "../forms/EditorInputField";
import EditorInputList from "../forms/EditorInputList";
import ImageUploaderForm from "../forms/ImageUploaderForm";
import { FormButtonWrapper } from "../FormSubmitButton";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().optional(),
  members: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      title: z.string().min(1, "Title is required"),
      bio: z.string().min(1, "Bio is required"),
      image: imageInputSchema(false).nullable().optional(),
    })
  ),
  isDarkMode: z.boolean().nullable().optional(),
});

export default function TeamEditor({ content, onSave, page }) {
  const [editingIndex, setEditingIndex] = useState();
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      members: content.members.map((member) => ({
        ...member,
        image: member.image ? getSectionBgImageObject(member.image) : null,
      })),
      isDarkMode: content.isDarkMode,
    },
  });

  const { control, handleSubmit } = form;

  const onFormSubmit = async (data) => {
    const dataToSave = {
      ...data,
      members: data.members.map((member) => ({
        ...member,
        image: member.image?.url ?? "",
      })),
    };
    await onSave(dataToSave);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const handleSortEnd = (newItems) => {
    form.setValue("members", newItems, { shouldDirty: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DarkModeToggle form={form} />
        <EditorInputField
          form={form}
          fieldName="header"
          label="Header"
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Header",
            sectionName: SECTION_TYPES.TEAM,
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
            sectionName: SECTION_TYPES.TEAM,
            page,
          }}
        />

        <EditorInputList
          fields={fields}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          remove={remove}
          listName="Team Members"
          onSortEnd={handleSortEnd}
          onXClick={() => {
            if (!fields[editingIndex]?.name) {
              remove(editingIndex);
            }
            setEditingIndex(null);
          }}
          renderDisplay={(field) => (
            <div className="flex items-start gap-4 border-ash-200 border p-3 rounded-md">
              {field.image?.url && (
                <Image
                  src={field.image.url}
                  alt={field.name}
                  className="w-12 h-12 object-cover rounded-full"
                  width={200}
                  height={200}
                />
              )}
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">{field.name}</p>
                <p className="font-normal text-xs italic">{field.title}</p>
                <p className="font-normal text-xs italic line-clamp-2 text-ash-600">{field.bio}</p>
              </div>
            </div>
          )}
          renderEdit={(_, index) => (
            <>
              <EditorInputField condense form={form} fieldName={`members.${index}.name`} label="Name" />
              <EditorInputField condense form={form} fieldName={`members.${index}.title`} label="Title" />
              <EditorInputField condense form={form} fieldName={`members.${index}.bio`} label="Bio" type="textarea" />
              <ImageUploaderForm fieldName={`members.${index}.image`} form={form} />
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
              name: "",
              title: "",
              bio: "",
              image: "",
            });
            setEditingIndex(fields.length);
          }}
        >
          + Add Team Member
        </Button>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
