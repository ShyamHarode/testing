import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { cn } from "@/lib/utils";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  offers: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().min(1, "Description is required"),
      amount: z.string().min(1, "Amount is required"),
      discountCode: z.string().min(1, "Discount code is required"),
      autoPopup: z.boolean().optional(),
    })
  ),
  isGlobal: z.boolean().optional(),
});

export default function OffersEditor({ content, onSave, page }) {
  const [editingIndex, setEditingIndex] = useState();

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      offers: content.offers || [],
      isGlobal: content.isGlobal === undefined ? true : content.isGlobal,
    },
  });

  const isGlobal = form.watch("isGlobal");

  const onFormSubmit = async (data) => {
    await onSave(data, { isGlobal: data.isGlobal, sectionType: SECTION_TYPES.OFFERS });
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "offers",
  });

  // Function to check if any other offer has autoPopup set to true
  const isAnyOtherAutoPopupEnabled = (currentIndex) => {
    return form.getValues("offers").some((offer, index) => index !== currentIndex && offer.autoPopup === true);
  };

  const handleSortEnd = (newItems) => {
    form.setValue("offers", newItems, { shouldDirty: true });
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
            sectionName: SECTION_TYPES.OFFERS,
            page,
          }}
        />

        <div className="flex flex-col rounded-lg border p-4 mb-8">
          <FormField
            control={form.control}
            name="isGlobal"
            render={({ field }) => (
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5 mr-2.5">
                  <FormLabel className="text-base">Apply site-wide</FormLabel>
                  <FormDescription>
                    {isGlobal
                      ? "Changing offers here will apply to offers on other pages."
                      : "These changes will only be applied to the current page."}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </div>
            )}
          />
        </div>

        <EditorInputList
          fields={fields}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          remove={remove}
          onXClick={() => {
            if (!fields[editingIndex]?.title) {
              remove(editingIndex);
            }
            setEditingIndex(null);
          }}
          listName="Offers"
          onSortEnd={handleSortEnd}
          renderDisplay={(field) => (
            <div className="flex flex-col gap-2 border-ash-200 border p-3 rounded-md">
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">{field.title}</p>
                <p className={cn("font-normal text-xs italic line-clamp-2")}>{field.description}</p>
                <p className="font-medium text-sm text-ash-600">{field.amount}</p>
              </div>
            </div>
          )}
          renderEdit={(_, index) => (
            <>
              <EditorInputField
                condense
                form={form}
                fieldName={`offers.${index}.title`}
                label="Title"
                aiPrompt={{
                  type: PROMPT_TYPES.OFFERS,
                  description: form.watch(`offers.${index}.description`),
                  discount: form.watch(`offers.${index}.amount`),
                  existing: form.watch("offers"),
                  page,
                }}
              />
              <EditorInputField
                condense
                form={form}
                fieldName={`offers.${index}.description`}
                label="Description"
                type="textarea"
                aiPrompt={{
                  type: PROMPT_TYPES.OFFERS,
                  title: form.watch(`offers.${index}.title`),
                  discount: form.watch(`offers.${index}.amount`),
                  existing: form.watch("offers"),
                  page,
                }}
              />
              <EditorInputField
                condense
                form={form}
                fieldName={`offers.${index}.amount`}
                label="Discount"
                aiPrompt={{
                  type: PROMPT_TYPES.OFFERS,
                  title: form.watch(`offers.${index}.title`),
                  description: form.watch(`offers.${index}.description`),
                  existing: form.watch("offers"),
                  page,
                }}
              />

              <EditorInputField
                condense
                form={form}
                placeholder="VIP25"
                fieldName={`offers.${index}.discountCode`}
                label="Discount code emailed to user"
              />

              <div>
                <FormField
                  control={form.control}
                  name={`offers.${index}.autoPopup`}
                  render={({ field }) => (
                    <div className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5 mr-2.5">
                        <FormLabel className="text-sm">Auto-popup {field.value ? "on" : "off"}</FormLabel>
                        <FormDescription>
                          {isAnyOtherAutoPopupEnabled(index)
                            ? "Another offer already has auto-popup enabled"
                            : field.value
                              ? "Dialog displays automatically after a few seconds"
                              : "Dialog will only display when button is clicked"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          disabled={isAnyOtherAutoPopupEnabled(index)}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />
              </div>
            </>
          )}
        />

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={`${form.formState.isDirty ? "mb-[69px]" : ""}`}
          onClick={() => {
            append({
              title: "Untitled",
            });
            setEditingIndex(fields.length);
          }}
        >
          {"+ Add offer"}
        </Button>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
