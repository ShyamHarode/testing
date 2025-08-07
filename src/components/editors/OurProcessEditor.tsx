import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import IconSelectorModal from "@/components/forms/IconSelectorModal";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { cn } from "@/lib/utils";

// Types
import type { Page } from "@prisma/client";

interface StepIcon {
  svgCode: string;
  id: string;
  _timestamp?: number;
}

interface Step {
  title: string;
  description: string;
  icon?: StepIcon;
}

interface FormData {
  header: string;
  subheader?: string;
  steps: Step[];
}

interface Content {
  header?: string;
  subheader?: string;
  steps?: Step[];
}

interface OurProcessEditorProps {
  content: Content;
  onSave: (data: FormData) => Promise<void>;
  page: Page;
}

const validationSchema = z.object({
  header: z.string().trim().min(1, "Header is required"),
  subheader: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Title is required"),
        description: z.string().trim().min(1, "Description is required"),
        icon: z
          .object({
            svgCode: z.string(),
            id: z.string(),
            _timestamp: z.number().optional(),
          })
          .optional(),
      })
    )
    .min(1, "At least one step is required")
    .max(4, "Maximum of 4 steps allowed"),
});

export default function OurProcessEditor({ content, onSave, page }: OurProcessEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      steps: content.steps || [],
    },
  });

  const onFormSubmit = async (data: FormData) => {
    await onSave(data);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const canAddStep = fields.length < 4;
  const canRemoveStep = fields.length > 1;

  const handleSortEnd = (newItems: Step[]) => {
    form.setValue("steps", newItems, { shouldDirty: true });
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
            sectionName: SECTION_TYPES.OUR_PROCESS,
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
            sectionName: SECTION_TYPES.OUR_PROCESS,
            page,
          }}
        />
        <EditorInputList
          fields={fields}
          editingIndex={editingIndex as null | undefined}
          setEditingIndex={setEditingIndex}
          allowDelete={canRemoveStep}
          remove={remove}
          listName="Steps"
          onSortEnd={handleSortEnd}
          onXClick={() => setEditingIndex(null)}
          handleVisibility={() => {}}
          renderDisplay={(field: Step) => (
            <div className="flex flex-col gap-2 border-ash-200 border p-3 rounded-md">
              {field.icon && <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: field.icon.svgCode }} />}
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">{field.title}</p>
                <p className={cn("font-normal text-xs italic line-clamp-2")}>{field.description}</p>
              </div>
            </div>
          )}
          renderEdit={(_: Step, index: number) => (
            <>
              <Label>Icon</Label>
              <div className="relative w-fit">
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="mb-4 flex items-center justify-center p-4 outline-dashed outline-1 outline-ash-300 rounded-md hover:bg-ash-300 transition-all duration-200 ease-in-out cursor-pointer"
                >
                  {form.watch(`steps.${index}.icon`) ? (
                    <div
                      className="w-8 h-8"
                      dangerouslySetInnerHTML={{
                        __html: form.watch(`steps.${index}.icon.svgCode`),
                      }}
                    />
                  ) : (
                    <p>Add icon</p>
                  )}
                </div>
                {form.watch(`steps.${index}.icon`) && (
                  <div
                    onClick={() => {
                      form.setValue(`steps.${index}.icon`, undefined, {
                        shouldDirty: true,
                      });
                    }}
                    className="absolute -top-2 -right-2 bg-lava-400 hover:bg-lava-700 p-1 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out"
                  >
                    <X className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <EditorInputField
                condense
                form={form}
                fieldName={`steps.${index}.title`}
                label="Title"
                className=""
                icon={null}
                aiPrompt=""
              />
              <EditorInputField
                condense
                form={form}
                fieldName={`steps.${index}.description`}
                label="Description"
                type="textarea"
                className=""
                icon={null}
                aiPrompt=""
              />
              <IconSelectorModal
                fieldName={`steps.${index}.icon`}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
              />
            </>
          )}
        />

        {/* If the FormButtonWrapper is visible, then add this margin bottom (height of the FormButtonWrapper) to the button so it doesn't get cut off, this should apply to every element that is affected by the FormButtonWrapper */}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={`${form.formState.isDirty ? "mb-[69px]" : ""}`}
          onClick={() => {
            if (canAddStep) {
              append({
                title: `Your step`,
                description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur`,
              });
              setEditingIndex(fields.length);
            }
          }}
          disabled={!canAddStep}
        >
          {canAddStep ? "+ Add step" : "Only 4 steps allowed"}
        </Button>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
