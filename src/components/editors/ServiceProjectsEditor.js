import { useForm } from "react-hook-form";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Form } from "@/components/ui/form";
import EditorInputField from "@/components/forms/EditorInputField";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const validationSchema = z.object({
  header: z.string().trim().min(1, "Header is required"),
});

export default function ServiceProjectsEditor({ content, onSave }) {
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
    },
  });

  const { handleSubmit } = form;

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="pb-12">
        <EditorInputField form={form} fieldName="header" label="Header" />

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
