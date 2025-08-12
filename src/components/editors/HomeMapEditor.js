import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ContactInfoForm from "@/components/forms/ContactInfoForm";
import EditorInputField from "@/components/forms/EditorInputField";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  showEmail: z.boolean(),
});

export default function HomeMapEditor({ content, onSave, websiteId, page }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      showEmail: content.showEmail,
    },
  });

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
  };

  const { handleSubmit } = form;

  return (
    <>
      <Form {...form}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <EditorInputField
            form={form}
            fieldName="header"
            label="Header"
            aiPrompt={{
              type: PROMPT_TYPES.HEADER_SUBHEADER,
              componentName: "Header",
              sectionName: SECTION_TYPES.MAP,
              page,
            }}
          />

          <FormField
            control={form.control}
            name="showEmail"
            render={({ field }) => (
              <div className="flex flex-row items-center justify-between mb-8">
                <div className="space-y-0.5 mr-2.5">
                  <FormLabel className="text-sm">Show company email</FormLabel>
                  <FormDescription>This can be helpful for prospects but also leads to more spam</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </div>
            )}
          />

          <p>
            Want to edit phone, hours or email?
            <br />
            <button type="button" onClick={() => setIsModalOpen(true)} className="underline text-ash-700">
              Click here
            </button>
          </p>

          <FormButtonWrapper form={form} />
        </form>
      </Form>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
            <DialogDescription>Update your contact details below.</DialogDescription>
          </DialogHeader>
          <ContactInfoForm
            websiteId={websiteId}
            onSuccess={async () => {
              setIsModalOpen(false);
              await onSave();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
