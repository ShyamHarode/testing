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

// Types
import type { Page } from "@prisma/client";

interface PartnershipImage {
  url: string;
  alt?: string;
  externalLink?: string;
  providerId?: string;
  source?: string;
}

interface FormData {
  header?: string;
  subheader?: string;
  images: PartnershipImage[];
}

interface Content {
  header?: string;
  subheader?: string;
  images?: Array<{
    url: string;
    externalLink?: string;
    alt?: string;
  }>;
}

interface PartnershipsEditorProps {
  content: Content;
  onSave: (data: FormData) => Promise<void>;
  page: Page;
}

const MAX_IMAGES = 20;

const validationSchema = z.object({
  header: z.string().optional(),
  subheader: z.string().optional(),
  images: z
    .array(
      objectImageSchema.extend({
        externalLink: z.string().url().optional().or(z.literal("")),
      })
    )
    .min(1, "At least one image is required"),
});

export default function PartnershipsEditor({ content, onSave, page }: PartnershipsEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<FormData>({
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

  const onFormSubmit = async (data: FormData) => {
    await onSave(data);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const canAddImage = fields.length < MAX_IMAGES;
  const shouldShowDelete = (field: PartnershipImage) => {
    const validItemsCount = fields.filter((f) => f.url).length;
    return validItemsCount > 1 && field.url;
  };

  const handleSortEnd = (newItems: PartnershipImage[]) => {
    form.setValue("images", newItems, { shouldDirty: true });
  };

  const handleXClick = () => {
    if (editingIndex === null) return;
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
          className=""
          icon={null}
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Header",
            sectionName: SECTION_TYPES.PARTNERSHIPS,
            page,
          }}
        />
        <EditorInputField
          form={form}
          fieldName="subheader"
          label="Subheader"
          className=""
          icon={null}
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Subheader",
            sectionName: SECTION_TYPES.PARTNERSHIPS,
            page,
          }}
        />
        <EditorInputList
          fields={fields}
          editingIndex={editingIndex as null | undefined}
          setEditingIndex={setEditingIndex}
          remove={remove}
          listName="Images"
          onSortEnd={handleSortEnd}
          allowDelete={true}
          handleVisibility={() => {}}
          renderDisplay={(field: PartnershipImage) => {
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
          renderEdit={(field: PartnershipImage, index: number) => (
            <>
              <ImageUploaderForm
                key={`image-uploader-${index}`}
                label="Update image"
                fieldName={`images.${index}`}
                form={form}
                onGalleryImagesSelectFinished={() => {}}
              />
              <EditorInputField
                form={form}
                fieldName={`images.${index}.externalLink`}
                label="External Link"
                className=""
                icon={null}
                aiPrompt=""
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
              append({ url: "", alt: "", externalLink: "" });
              setEditingIndex(fields.length);
            }
          }}
        >
          {canAddImage ? "+ Add Partnership" : `Only ${MAX_IMAGES} partnerships allowed`}
        </Button>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
