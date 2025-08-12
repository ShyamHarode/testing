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

// Types
import type { Page } from "@prisma/client";

interface ImageObject {
  url: string;
  alt?: string;
  providerId?: string;
  source?: string;
}

interface CarouselImage {
  imageUrl: ImageObject | string;
  altText?: string;
}

type CarouselImageField = CarouselImage & { id: string };

interface FormData {
  header?: string;
  images: CarouselImage[];
  selectedImages?: string[];
}

interface Content {
  header?: string;
  images?: Array<{
    imageUrl: string;
    altText?: string;
  }>;
}

interface PhotoCarouselEditorProps {
  content: Content;
  onSave: (_: FormData) => Promise<void>;
  page: Page;
}

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

export default function PhotoCarouselEditor({ content, onSave, page }: PhotoCarouselEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [generatingAltForIndex, setGeneratingAltForIndex] = useState<number | null>(null);

  const form = useForm<FormData>({
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

  const onFormSubmit = async (data: FormData) => {
    const dataToSave = {
      ...data,
      images: data.images.map((image) => ({
        ...image,
        imageUrl: typeof image.imageUrl === "string" ? image.imageUrl : (image.imageUrl?.url ?? ""),
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

  const handleSortEnd = (newItems: CarouselImageField[]) => {
    const withoutIds = newItems.map(({ id: _, ...rest }) => rest);
    form.setValue("images", withoutIds, { shouldDirty: true });
  };

  const handleXClick = () => {
    if (editingIndex === null) return;
    const currentField = fields[editingIndex];

    if (!currentField?.imageUrl) {
      remove(editingIndex);
    } else {
      const { id: _, ...rest } = currentField as CarouselImageField;
      form.setValue(`images.${editingIndex}`, rest, { shouldDirty: false });
    }
    setEditingIndex(null);
  };

  const generateAltText = async (imageUrl: string, index: number) => {
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

  const handleGalleryImagesSelectFinished = async (
    galleryImages: string[] | Array<{ url: string; altText?: string }>,
    listIdx?: number
  ) => {
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

    const altTexts = await Promise.all(
      formattedGalleryImages.map((image, index) => generateAltText(image.url, listIdx ?? index))
    );
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
          onSuccess={
            ((result: { urls: string[] }, section?: string) => {
              if (section === "dragger") {
                void handleGalleryImagesSelectFinished(result.urls);
              }
            }) as unknown as () => void
          }
        />
        <EditorInputList<CarouselImageField>
          fields={fields as unknown as CarouselImageField[]}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          remove={remove}
          listName="Images"
          onSortEnd={handleSortEnd}
          allowDelete
          renderDisplay={(field) => (
            <div className="flex items-center flex-col gap-2 border-ash-200 border p-3 rounded-md">
              <img
                src={typeof field.imageUrl === "string" ? field.imageUrl : field.imageUrl?.url}
                alt={field.altText || ""}
                className="w-20 h-20 object-cover rounded"
              />
              <p className="text-sm text-ash-500">{field.altText}</p>
            </div>
          )}
          renderEdit={(_field, index) => (
            <>
              <ImageUploaderForm
                key={`image-uploader-${index}`}
                label="Update image"
                fieldName={`images.${index}.imageUrl`}
                onSuccess={
                  ((result: { urls: string[] }) => {
                    void handleGalleryImagesSelectFinished(result.urls, index);
                  }) as unknown as () => void
                }
                form={form}
                onGalleryImagesSelectFinished={() => {}}
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
