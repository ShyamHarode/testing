import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { cn, getSectionBgImageObject } from "@/lib/utils";
import { objectImageSchema } from "@/lib/zod-schemas/image-input";

const MAX_IMAGES = 4;

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().optional(),
  images: z
    .array(
      objectImageSchema.extend({
        externalLink: z.string().url().optional().or(z.literal("")),
      })
    )
    .min(1, "At least one image is required"),
});

export default function CredentialsEditor({ content, onSave, page }) {
  const [editingIndex, setEditingIndex] = useState(null);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      images:
        content.images?.map((image) => ({
          ...getSectionBgImageObject(image.url),
          externalLink: image.externalLink || "",
        })) || [],
    },
  });

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const canAddImage = fields.length < MAX_IMAGES;
  const shouldShowDelete = (field) => {
    const validItemsCount = fields.filter((f) => f.url).length;
    return validItemsCount > 1 && field.url;
  };

  const handleSortEnd = (newItems) => {
    form.setValue("images", newItems, { shouldDirty: true });
  };

  const handleXClick = () => {
    const currentField = fields[editingIndex];

    if (!currentField?.url) {
      remove(editingIndex);
    } else {
      form.setValue(`images.${editingIndex}`, currentField, { shouldDirty: false });
    }
    setEditingIndex(null);
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
            sectionName: SECTION_TYPES.CREDENTIALS,
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
            sectionName: SECTION_TYPES.CREDENTIALS,
            page,
          }}
        />
        <EditorInputList
          fields={fields}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          remove={remove}
          listName="Images"
          onSortEnd={handleSortEnd}
          allowDelete={shouldShowDelete}
          isDraggingDisabled={editingIndex !== undefined}
          renderDisplay={(field) => {
            return (
              <div className="flex items-center flex-col gap-2 border-ash-200 border p-3 rounded-md">
                <img src={field?.url} alt={field.alt || ""} className="w-20 h-20 object-cover rounded" />

                {field.externalLink && (
                  <div className="flex items-center gap-2 text-ash-500 ">
                    <LinkIcon className="w-4 h-4" />
                    <p className="text-sm w-full break-all">{field.externalLink}</p>
                  </div>
                )}
              </div>
            );
          }}
          renderEdit={(field, index) => (
            <>
              <ImageUploaderForm
                key={`image-uploader-${index}`}
                label="Update image"
                fieldName={`images.${index}`}
                form={form}
              />
              <EditorInputField form={form} fieldName={`images.${index}.externalLink`} label="External Link" />
            </>
          )}
          onXClick={handleXClick}
        />

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={cn(form.formState.isDirty && "mb-[69px]")}
          onClick={() => {
            if (canAddImage) {
              append({ url: "", alt: "", externalLink: "" });
              setEditingIndex(fields.length);
            }
          }}
        >
          {canAddImage ? "+ Add Credential" : `Only ${MAX_IMAGES} credentials allowed`}
        </Button>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
