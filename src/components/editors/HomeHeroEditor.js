import { useCallback, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import DarkModeToggle from "@/components/DarkModeToggle";
import EditableButtonList from "@/components/editors/_components/EditableButtonList";
import EditorInputField from "@/components/forms/EditorInputField";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoDraggerInput from "@/components/VideoDraggerInput";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import BUTTON_TYPES from "@/lib/constants/buttonTypes";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { cn, getSectionBgImageObject } from "@/lib/utils";
import { imageInputSchema } from "../../lib/zod-schemas/image-input";

const validationSchema = z
  .object({
    header: z.string().min(1, "Header is required"),
    subheader: z.string().optional(),
    bgImage: imageInputSchema(false),
    videoUrl: z.string().optional(),
    showCustomButtons: z.boolean().optional(),
    hideVideoControls: z.boolean().optional(),
    buttons: z
      .array(
        z.object({
          type: z.string().min(1, "Type is required"),
          label: z.string().min(1, "Label is required"),
          link: z.string().min(1, "Link is required"),
        })
      )
      .optional(),
    heroMediaType: z.enum(["bgImage", "heroVideo"]).default("bgImage"),
    isDarkMode: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.heroMediaType === "bgImage") {
        return data.bgImage?.url && data.bgImage.url.length > 0;
      }
      if (data.heroMediaType === "heroVideo") {
        return data.videoUrl && data.videoUrl.length > 0;
      }
      return false;
    },
    {
      message: "Either an image or a video is required.",
      path: ["mediaValidation"],
    }
  );

export default function HomeHeroEditor({ content, onSave, page, pages }) {
  const maxButtons = 2;
  const [editingIndex, setEditingIndex] = useState();
  const [tabValue, setTabValue] = useState(content.heroMediaType || "bgImage");

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header,
      subheader: content.subheader,
      bgImage: getSectionBgImageObject(content.bgImage),
      videoUrl: content.videoUrl,
      buttons: content.buttons,
      showCustomButtons: content.showCustomButtons || false,
      hideVideoControls: content.hideVideoControls || false,
      variantNumber: content.variantNumber ?? 0,
      heroMediaType: content.heroMediaType || "bgImage",
      isDarkMode: content.isDarkMode || false,
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const videoUrl = watch("videoUrl");

  const handleVideoUploadSuccess = (response) => {
    setValue("videoUrl", response.url, { shouldValidate: true, shouldDirty: true });
  };

  const onFormSubmit = async (data) => {
    await onSave(data);
    form.reset(data);
    setEditingIndex(null);
  };

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "buttons",
  });

  const showCustomButtons = form.watch("showCustomButtons");

  const addButton = useCallback(() => {
    if (fields.length < maxButtons) {
      append({
        type: BUTTON_TYPES.SITE_LINK,
        label: "Untitled",
        link: "/",
      });

      setEditingIndex(fields.length);
    }
  }, [fields, maxButtons, append]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="pb-12 overflow-auto">
        <DarkModeToggle form={form} />
        <EditorInputField
          form={form}
          fieldName="header"
          label="Header"
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Header",
            sectionName: SECTION_TYPES.HOME_HERO,
            page,
          }}
        />

        <EditorInputField
          form={form}
          fieldName="subheader"
          label="Subheader"
          type="textarea"
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Subheader",
            sectionName: SECTION_TYPES.HOME_HERO,
            page,
          }}
        />

        <hr className="mb-5" />

        <Tabs
          value={tabValue}
          onValueChange={(val) => {
            setTabValue(val);
            setValue("heroMediaType", val, { shouldDirty: true, shouldValidate: true });
          }}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="bgImage" className="w-full">
              Image
            </TabsTrigger>
            <TabsTrigger value="heroVideo" className="w-full">
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bgImage" className="w-full">
            <ImageUploaderForm fieldName="bgImage" form={form} hideLabel />
          </TabsContent>
          <TabsContent value="heroVideo" className="w-full">
            <VideoDraggerInput
              fieldName="heroVideo"
              onSuccess={handleVideoUploadSuccess}
              selectedVideo={videoUrl ? { url: videoUrl } : null}
              onRemoveVideo={() => setValue("videoUrl", "", { shouldValidate: true, shouldDirty: true })}
            />
            {errors.mediaValidation && <p className="text-lava-500 text-sm mb-2">{errors.mediaValidation.message}</p>}
            <div key="hide-video-controls-switch" className="flex flex-col rounded-lg border p-4">
              <FormField
                key="hide-video-controls-field"
                control={form.control}
                name="hideVideoControls"
                render={({ field }) => (
                  <div key="hide-video-controls-container" className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5 mr-2.5">
                      <FormLabel className="text-base">Hide video controls</FormLabel>
                      <FormDescription>{`Video controls are currently ${field.value ? "hidden" : "visible"}`}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <hr className="my-5" />

        <div className="flex flex-col rounded-lg border p-4 mb-8">
          <FormField
            control={form.control}
            name="showCustomButtons"
            render={({ field }) => (
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5 mr-2.5">
                  <FormLabel className="text-base">Custom buttons {showCustomButtons ? "on" : "off"}</FormLabel>
                  <FormDescription>
                    {showCustomButtons
                      ? "Custom buttons are enabled. Edit below."
                      : "Your buttons will be based on the goals you set up."}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </div>
            )}
          />

          {showCustomButtons && (
            <>
              <EditableButtonList
                pages={pages}
                form={form}
                fields={fields}
                update={update}
                editingIndex={editingIndex}
                setEditingIndex={setEditingIndex}
                remove={remove}
                listName="Home hero buttons"
                fieldName="buttons"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className={cn(fields.length >= maxButtons && "opacity-0")}
                onClick={addButton}
              >
                {"+ Add Button"}
              </Button>
            </>
          )}
        </div>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
