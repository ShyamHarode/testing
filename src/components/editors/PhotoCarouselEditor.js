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

const MAX_IMAGES = 50;

const validationSchema = z.object({
  header: z.string().optional(),
  images: z
    .array(
      z.object({
        imageUrl: imageInputSchema(true),
        altText: z.string().optional(),
      })
    )
    .min(1, "At least one image is required"),
});

export default function PhotoCarouselEditor({ content, onSave, page }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [generatingAltForIndex, setGeneratingAltForIndex] = useState(null);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      selectedImages: [],
      images:
        content.images?.map((image) => ({
          ...image,
          imageUrl: getSectionBgImageObject(image.imageUrl) ?? "",
        })) || [],
    },
  });

  const onFormSubmit = async (data) => {
    const dataToSave = {
      ...data,
      images: data.images.map((image) => ({
        ...image,
        imageUrl: image.imageUrl?.url ?? "",
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

  const canAddImage = fields.length < MAX_IMAGES;
  const shouldShowDelete = (field) => {
    const validItemsCount = fields.filter((f) => f.imageUrl).length;
    return validItemsCount > 1 && field.imageUrl;
  };

  const handleSortEnd = (newItems) => {
    form.setValue("images", newItems, { shouldDirty: true });
  };

  const handleXClick = () => {
    const currentField = fields[editingIndex];

    if (!currentField?.imageUrl) {
      remove(editingIndex);
    } else {
      form.setValue(`images.${editingIndex}`, currentField, { shouldDirty: false });
    }
    setEditingIndex(null);
  };

  const generateAltText = async (imageUrl, index) => {
    setGeneratingAltForIndex(index);

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
        setGeneratingAltForIndex(null);
      },
    });

    return altText;
  };

  const handleGalleryImagesSelectFinished = async (galleryImages, listIdx) => {
    const isQuickAdder = listIdx === undefined;

    if (fields.length >= MAX_IMAGES && isQuickAdder) {
      toast.error(`Only ${MAX_IMAGES} images allowed`);
      return;
    }

    const loadingToast = toast.loading(
      `Generating alt text for ${galleryImages.length} image${galleryImages.length > 1 ? "s" : ""}`
    );

    const formattedGalleryImages = galleryImages.map((image) => {
      if (typeof image === "string") {
        return {
          url: image,
          altText: "",
        };
      }
      return image;
    });

    const altTexts = await Promise.all(formattedGalleryImages.map((image) => generateAltText(image.url, listIdx)));
    if (isQuickAdder) {
      formattedGalleryImages.forEach((image, index) => {
        append({ imageUrl: getSectionBgImageObject(image.url), altText: altTexts[index] });
      });
    } else {
      form.setValue(
        `images.${listIdx}`,
        { imageUrl: getSectionBgImageObject(formattedGalleryImages[0].url), altText: altTexts[0] },
        { shouldDirty: true }
      );
    }
    toast.dismiss(loadingToast);
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
            sectionName: SECTION_TYPES.PHOTO_CAROUSEL,
            page,
          }}
        />
        <ImageUploaderForm
          label="Quick add images"
          showImagePreviews={false}
          onGalleryImagesSelectFinished={handleGalleryImagesSelectFinished}
          form={form}
          fieldName={"selectedImages"}
          isGallery={true}
          onSuccess={(result, section) => {
            if (section === "dragger") {
              handleGalleryImagesSelectFinished(result.urls);
            }
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
          renderDisplay={(field) => (
            <div className="flex items-center flex-col gap-2 border-ash-200 border p-3 rounded-md">
              <img src={field.imageUrl?.url} alt={field.altText || ""} className="w-20 h-20 object-cover rounded" />
              <p className="text-sm text-ash-500">{field.altText}</p>
            </div>
          )}
          renderEdit={(field, index) => (
            <>
              <ImageUploaderForm
                key={`image-uploader-${index}`}
                label="Update image"
                fieldName={`images.${index}.imageUrl`}
                onSuccess={(result) => handleGalleryImagesSelectFinished(result.urls, index)}
                form={form}
              />
              <EditorInputField
                form={form}
                fieldName={`images.${index}.altText`}
                label="Alt text"
                disabled={generatingAltForIndex === index}
                placeholder={generatingAltForIndex === index ? "Generating alt text..." : "Upload to generate..."}
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
              append({ imageUrl: "", altText: "" });
              setEditingIndex(fields.length);
            }
          }}
        >
          {canAddImage ? "+ Add Image" : `Only ${MAX_IMAGES} images allowed`}
        </Button>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
