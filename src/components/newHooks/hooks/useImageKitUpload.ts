import { useState } from "react";

import { useWebsite } from "@/components/hooks/useWebsite";
import { api, handleApiRequest, logFrontendError } from "@/lib/utils";

import type { UploadResponse as IKUploadResponse } from "imagekit-javascript/dist/src/interfaces";
import type { FileUploadEvent, ImagekitAuth, UseImageKitUploadProps } from "@/types/imagekit";

const publicKey = process.env.NEXT_PUBLIC_IMAGE_KIT_PUBLIC;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGE_KIT_ENDPOINT;

if (!publicKey || !urlEndpoint) {
  throw new Error(
    "ImageKit configuration is missing. Please check NEXT_PUBLIC_IMAGE_KIT_PUBLIC and NEXT_PUBLIC_IMAGE_KIT_ENDPOINT environment variables."
  );
}

export function useImageKitUpload({
  fieldName,
  onSuccess,
  onUploadStart,
  onUploadEnd,
  photoToken,
  saveImageToLibrary = true,
  fileType = "image",
}: UseImageKitUploadProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { website, isLoading } = useWebsite(["id", "logo", "images"], {}, { token: photoToken });

  const authenticator = async (): Promise<ImagekitAuth> => {
    // Generate a fresh authentication token for each upload to avoid token collisions
    const response = await handleApiRequest({
      makeRequest: async () => {
        const res = await api.post("/api/imagekit/auth", { count: 1 });
        return res.data;
      },
    });

    const authData = response[0];
    const { signature, expire, token } = authData;
    return { signature, expire, token };
  };

  const handleIKSuccess = async (res: IKUploadResponse): Promise<void> => {
    try {
      // Determine default extension based on file type
      const defaultExt = fileType === "video" ? ".mp4" : ".webp";

      // Get file extension from original upload
      const extension = res.name.match(/\.[^.]+$/)?.[0] || defaultExt;

      // Create new filename using ImageKit's fileId with appropriate prefix
      const prefix = fileType === "video" ? "video" : "image";
      const newFileName = `${prefix}_${res.fileId}${extension}`;

      let finalUrl = res.url; // Default to original URL

      // Try to rename the file
      await handleApiRequest({
        makeRequest: async () => {
          const response = await api.post("/api/imagekit/rename", {
            filePath: res.filePath,
            newFileName,
          });
          // Update URL only if rename succeeds
          finalUrl = res.url.replace(res.name, newFileName);
          return response.data;
        },
        hideErrorToast: true,
      });

      // Only save to image library if it's an image and saveImageToLibrary is true
      if (fileType === "image" && saveImageToLibrary) {
        // Wait for website data to be loaded if we don't have a photoToken
        if (!photoToken && isLoading) {
          throw new Error("Website data has not loaded yet. Please try again to save.");
        }

        await handleApiRequest({
          makeRequest: async () => {
            const response = await api.post("/api/photos/save", {
              websiteId: website?.id,
              photoToken,
              url: finalUrl,
            });
            return response.data;
          },
        });
      }

      if (onSuccess) {
        onSuccess({ ...res, url: finalUrl });
      }
    } finally {
      setIsUploading(false);
      if (onUploadEnd) onUploadEnd();
    }
  };

  const handleIKError = (err: Error): void => {
    setIsUploading(false);
    logFrontendError(`Error uploading ${fileType}`, err);
    if (onUploadEnd) onUploadEnd();
  };

  const handleIKStart = (): void => {
    setIsUploading(true);
    if (onUploadStart) onUploadStart();
  };

  const fileUploadHandler = (event: FileUploadEvent): void => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Trigger upload for each file
    files.forEach((file) => {
      const input = document.getElementById(`ikUpload-${fieldName}`) as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  };

  return {
    publicKey,
    urlEndpoint,
    authenticator,
    handleIKSuccess,
    handleIKError,
    handleIKStart,
    fileUploadHandler,
    isUploading,
  };
}
