import Link from "next/link";
import { useRouter } from "next/router";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Form } from "@/components/ui/form";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().optional(),
});

export default function ProjectsEditor({ content, onSave, page }) {
  const router = useRouter();
  const { websiteId } = router.query;

  const defaultValues = {
    header: content.header,
    subheader: content.subheader,
  };

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
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
            sectionName: SECTION_TYPES.PROJECTS,
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
            sectionName: SECTION_TYPES.PROJECTS,
            page,
          }}
        />

        <div>
          <strong>Edit Projects</strong>
          <p>
            You can edit the projects that are displayed on your website by visiting the{" "}
            <Link
              href={`/dashboard/sites/${websiteId}/projects`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ash-800 hover:text-ash-900"
            >
              projects page
            </Link>{" "}
            in the Rebolt app.
          </p>
        </div>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
