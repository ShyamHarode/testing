import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { api, cn, getSectionBgImageObject, handleApiRequest } from "@/lib/utils";
import { imageInputSchema } from "@/lib/zod-schemas/image-input";

const MAX_IMAGE_PAIRS = 15;

const validationSchema = z.object({
  header: z.string().optional(),
  images: z
    .array(
      z.object({
        before: z.object({
          imageUrl: imageInputSchema(true),
          altText: z.string().optional(),
        }),
        after: z.object({
          imageUrl: imageInputSchema(true),
          altText: z.string().optional(),
        }),
      })
    )
    .min(1, "At least one before/after pair is required")
    .max(MAX_IMAGE_PAIRS, `Only ${MAX_IMAGE_PAIRS} Pairs Allowed`),
});

export default function BeforeAndAfterEditor({ content, onSave, page }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [generatingAltFor, setGeneratingAltFor] = useState(null);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content?.header || "",
      images:
        content?.images?.map((image) => ({
          before: {
            imageUrl: image?.before?.imageUrl ? getSectionBgImageObject(image.before.imageUrl) : "",
            altText: image?.before?.altText || "",
          },
          after: {
            imageUrl: image?.after?.imageUrl ? getSectionBgImageObject(image.after.imageUrl) : "",
            altText: image?.after?.altText || "",
          },
        })) || [],
    },
  });

  const onFormSubmit = async (data) => {
    const dataToSave = {
      ...data,
      images: data.images.map((image) => ({
        before: {
          imageUrl: image.before?.imageUrl?.url || "",
          altText: image.before?.altText || "",
        },
        after: {
          imageUrl: image.after?.imageUrl?.url || "",
          altText: image.after?.altText || "",
        },
      })),
    };
    await onSave(dataToSave);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const canAddImage = fields.length < MAX_IMAGE_PAIRS;
  const shouldShowDelete = (field) => {
    const validItemsCount = fields.filter((f) => f.before?.imageUrl && f.after?.imageUrl).length;
    return validItemsCount > 1 && field.before?.imageUrl && field.after?.imageUrl;
  };

  const handleSortEnd = (newItems) => {
    form.setValue("images", newItems, { shouldDirty: true });
  };

  const handleXClick = () => {
    const currentField = fields[editingIndex];
    if (!currentField?.before?.imageUrl && !currentField?.after?.imageUrl) {
      remove(editingIndex);
    }
    setEditingIndex(null);
  };

  const generateAltText = async (imageUrl, index, type) => {
    setGeneratingAltFor({ index, type });

    let altText = "";
    await handleApiRequest({
      makeRequest: async () => {
        const response = await api.post("/api/ai/photo-alt", {
          imageUrl,
        });
        altText = response.data.altText;
        return response.data;
      },
      finallyCallback: () => {
        setGeneratingAltFor(null);
      },
    });

    return altText;
  };

  const handleUploadSuccess = async (urls, index, type) => {
    if (!urls || !urls.length) {
      toast.error("No image URL received");
      return;
    }

    const imageUrl = urls[0];

    const altText = await generateAltText(imageUrl, index, type);

    form.setValue(
      `images.${index}.${type}`,
      {
        imageUrl: getSectionBgImageObject(imageUrl),
        altText,
      },
      { shouldDirty: true }
    );
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
            sectionName: SECTION_TYPES.BEFORE_AND_AFTER,
            page,
          }}
        />
        <EditorInputList
          fields={fields}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          remove={remove}
          listName="Before/After Pairs"
          onSortEnd={handleSortEnd}
          allowDelete={shouldShowDelete}
          isDraggingDisabled={editingIndex !== undefined}
          renderDisplay={(field) => (
            <div className="flex items-center flex-col gap-2 border-ash-200 border p-3 rounded-md">
              <img
                src={field.before?.imageUrl?.url || ""}
                alt={field.before?.altText || ""}
                className="w-20 h-20 object-cover rounded"
              />
              <p className="text-sm text-ash-500">{field.before?.altText || ""}</p>
              <img
                src={field.after?.imageUrl?.url || ""}
                alt={field.after?.altText || ""}
                className="w-20 h-20 object-cover rounded"
              />

              <div className="text-sm text-ash-500">
                <p>{field.after?.altText || ""}</p>
              </div>
            </div>
          )}
          renderEdit={(field, index) => (
            <>
              <ImageUploaderForm
                key={`before-image-${index}`}
                label="Before image"
                fieldName={`images.${index}.before.imageUrl`}
                onSuccess={(result) => handleUploadSuccess(result.urls, index, "before")}
                form={form}
              />
              <EditorInputField
                form={form}
                fieldName={`images.${index}.before.altText`}
                label="Before alt text"
                disabled={generatingAltFor?.index === index && generatingAltFor?.type === "before"}
                placeholder={
                  generatingAltFor?.index === index && generatingAltFor?.type === "before"
                    ? "Generating alt text..."
                    : "Upload to generate..."
                }
              />
              <ImageUploaderForm
                key={`after-image-${index}`}
                label="After image"
                fieldName={`images.${index}.after.imageUrl`}
                onSuccess={(result) => handleUploadSuccess(result.urls, index, "after")}
                form={form}
              />
              <EditorInputField
                form={form}
                fieldName={`images.${index}.after.altText`}
                label="After alt text"
                disabled={generatingAltFor?.index === index && generatingAltFor?.type === "after"}
                placeholder={
                  generatingAltFor?.index === index && generatingAltFor?.type === "after"
                    ? "Generating alt text..."
                    : "Upload to generate..."
                }
              />
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
              append({
                before: { imageUrl: "", altText: "" },
                after: { imageUrl: "", altText: "" },
              });
              setEditingIndex(fields.length);
            }
          }}
        >
          {canAddImage ? "+ Add pair" : `Only ${MAX_IMAGE_PAIRS} Pairs Allowed`}
        </Button>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
