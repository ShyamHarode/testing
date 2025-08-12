import { useForm } from "react-hook-form";
import { FormButtonWrapper } from "../FormSubmitButton";
import EditorInputField from "../forms/EditorInputField";
import { Form } from "@/components/ui/form";

export const AboutOurTeamEditor = ({ content, onSave }) => {
  const defaultValues = {
    header: content.header,
  };

  const form = useForm({ defaultValues });

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)}>
        <EditorInputField form={form} fieldName="header" label="Header" />

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
};
