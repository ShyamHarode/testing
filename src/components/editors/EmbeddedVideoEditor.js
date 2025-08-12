import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import { Form, FormControl, FormDescription, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import VideoDraggerInput from "@/components/VideoDraggerInput";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";

function isEmbeddedVideoUrl(url) {
  if (!url) return false;
  return url.includes("vimeo") || url.includes("youtube") || url.includes("youtu.be");
}

const validationSchema = z.object({
  header: z.string().optional(),
  subheader: z.string().optional(),
  videoUrl: z
    .string()
    .min(1, "Video URL is required")
    .url("Please enter a valid URL")
    .refine((url) => {
      if (!url) return false;
      const youtubePattern =
        /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?(\S+)$/;
      const vimeoPattern =
        /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*?)\/videos\/|)?(\d+)(?:|\/\?)$/;
      const imagekitPattern = /^https:\/\/ik\.imagekit\.io\/[^\/]+\/[^\/]+\.(mp4|mov|avi|wmv|flv|webm)$/;
      return youtubePattern.test(url) || vimeoPattern.test(url) || imagekitPattern.test(url);
    }, "Please enter a valid YouTube or Vimeo URL"),
});

const transformVideoUrl = (url) => {
  const youtubePattern =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?(\S+)$/;
  const vimeoPattern =
    /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*?)\/videos\/|)?(\d+)(?:|\/\?)$/;
  const imagekitPattern = /^https:\/\/ik\.imagekit\.io\/[^\/]+\/[^\/]+\.(mp4|mov|avi|wmv|flv|webm)$/;

  const youtubeMatch = url.match(youtubePattern);
  const vimeoMatch = url.match(vimeoPattern);
  const imagekitMatch = url.match(imagekitPattern);

  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return `https://player.vimeo.com/video/${videoId}`;
  } else if (imagekitMatch) {
    return url;
  }

  return url;
};

export default function EmbeddedVideoEditor({ content, onSave, page }) {
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      header: content.header || "",
      subheader: content.subheader || "",
      videoUrl: content.videoUrl || "",
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const videoUrl = watch("videoUrl");

  const getInitialMode = () => {
    if (!content.videoUrl) return false;
    return !isEmbeddedVideoUrl(content.videoUrl);
  };
  const [isUploadMode, setIsUploadMode] = useState(getInitialMode());

  const [lastEmbedUrl, setLastEmbedUrl] = useState(() => {
    const url = content.videoUrl || "";
    return isEmbeddedVideoUrl(url) ? url : "";
  });
  const [lastUploadUrl, setLastUploadUrl] = useState(() => {
    const url = content.videoUrl || "";
    return !isEmbeddedVideoUrl(url) ? url : "";
  });

  useEffect(() => {
    if (!videoUrl) return;
    const isEmbed = isEmbeddedVideoUrl(videoUrl);
    setIsUploadMode(!isEmbed);
    if (isEmbed) {
      setLastEmbedUrl(videoUrl);
    } else {
      setLastUploadUrl(videoUrl);
    }
  }, [videoUrl]);

  const onFormSubmit = async (data) => {
    const transformedData = {
      ...data,
      videoUrl: isEmbeddedVideoUrl(data.videoUrl) ? transformVideoUrl(data.videoUrl) : data.videoUrl,
    };
    await onSave(transformedData);
    form.reset(transformedData);
  };

  const handleVideoUploadSuccess = (response) => {
    setValue("videoUrl", response.url, { shouldValidate: true, shouldDirty: true });
  };

  const handleModeSwitch = (checked) => {
    setIsUploadMode(checked);
    if (checked) {
      setValue("videoUrl", lastUploadUrl, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("videoUrl", lastEmbedUrl, { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="pb-12 px-2 overflow-auto">
        <EditorInputField
          form={form}
          fieldName="header"
          label="Header"
          aiPrompt={{
            type: PROMPT_TYPES.HEADER_SUBHEADER,
            componentName: "Header",
            sectionName: SECTION_TYPES.EMBEDDED_VIDEO,
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
            sectionName: SECTION_TYPES.EMBEDDED_VIDEO,
            page,
          }}
        />

        <hr className="mb-5" />

        <div className="flex flex-col rounded-lg border p-4 mb-8">
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5 mr-2.5">
              <FormLabel className="text-base">{isUploadMode ? "Upload video on" : "Upload video off"}</FormLabel>
              <FormDescription>
                {isUploadMode ? "Upload a video file directly to your site." : "Use a YouTube or Vimeo URL."}
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={isUploadMode} onCheckedChange={handleModeSwitch} />
            </FormControl>
          </div>

          {isUploadMode ? (
            <div className="space-y-3 mt-4">
              <FormLabel>Video</FormLabel>
              <VideoDraggerInput
                fieldName="embeddedVideo"
                onSuccess={handleVideoUploadSuccess}
                selectedVideo={videoUrl ? { url: videoUrl } : null}
                onRemoveVideo={() => setValue("videoUrl", "", { shouldValidate: true, shouldDirty: true })}
              />
              {errors.videoUrl && <p className="text-lava-500 text-sm">{errors.videoUrl.message}</p>}
            </div>
          ) : (
            <div className="mt-4">
              <EditorInputField form={form} fieldName="videoUrl" label="Video URL (YouTube or Vimeo)" />
            </div>
          )}
        </div>

        <FormButtonWrapper form={form} />
      </form>
    </Form>
  );
}
