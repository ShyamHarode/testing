import { useState } from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConversionType } from "@prisma/client";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ContactFormModal from "@/components/ContactFormModal";
import EditorInputField from "@/components/forms/EditorInputField";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import useConversions from "@/components/hooks/useConversions";
import { Button } from "@/components/ui/button";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { getSectionBgImageObject } from "@/lib/utils";
import { formFieldValidationSchema } from "@/lib/zod-schemas/contact-form";
import { imageInputSchema } from "../../lib/zod-schemas/image-input";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().optional(),
  bgImage: imageInputSchema(false).optional(),
  fields: formFieldValidationSchema.optional(),
});

export default function ContactFormEditor({ content, onSave, websiteId, page }) {
  const [modalOpen, setModalOpen] = useState(false);

  const { conversions = [] } = useConversions();

  const formConversion = conversions?.find((conversion) => conversion.type === ConversionType.FORM);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      bgImage: getSectionBgImageObject(content.bgImage),
    },
  });

  const { handleSubmit } = form;

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
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
          sectionName: SECTION_TYPES.CONTACT_FORM,
          page,
        }}
      />

      <EditorInputField
        form={form}
        fieldName="subheader"
        label="Description"
        aiPrompt={{
          type: PROMPT_TYPES.HEADER_SUBHEADER,
          componentName: "Description",
          sectionName: SECTION_TYPES.CONTACT_FORM,
          page,
        }}
      />

      <ImageUploaderForm label="Background image" fieldName={"bgImage"} form={form} />

      <Link href={`/dashboard/sites/${websiteId}/company#goals`}>
        <Button type="button" className="mt-4 mb-16" size="sm" variant="outline">
          {!!formConversion ? "Edit Form Goal" : "Add a Form Goal"}
        </Button>
      </Link>

      <ContactFormModal form={form} open={modalOpen} setOpen={setModalOpen} />

      <FormButtonWrapper form={form} />
    </form>
  );
}
