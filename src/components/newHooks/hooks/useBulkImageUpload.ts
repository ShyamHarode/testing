import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import axios from "axios";
import toast from "react-hot-toast";
import useSWR from "swr";

import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB, MAX_IMAGE_UPLOADS } from "@/lib/constants/photos";
import { uploadMultipleImages } from "@/lib/images";
import { handleApiRequest, logFrontendError } from "@/lib/utils";
import useIsMobile from "./useIsMobile";

import type { UploadResponse } from "imagekit/dist/libs/interfaces";
import type { ChangeEvent } from "react";
import type { ImageUploadWebsite } from "@/types/image-upload";

interface AbortableFileInput extends HTMLInputElement {
  abort: () => void;
}

type UseImageUploadProps = {
  onUploadSuccess?: (_: UploadResponse[]) => Promise<void>;
  fileSizeValidator?: (_: File) => boolean;
};

export function useBulkImageUpload({
  onUploadSuccess,
  fileSizeValidator = (file: File) => file.size <= MAX_FILE_SIZE,
}: UseImageUploadProps) {
  const { isMobileDevice } = useIsMobile();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [photoLimitReached, setPhotoLimitReached] = useState<boolean>(false);
  const ikFileInputRef = useRef<AbortableFileInput>(null);
  const lastClickTimeRef = useRef<number>(0);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  const removeLocalImage = (index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove) {
      // cleanup the preview URL to prevent memory leaks
      const fileKey = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
      const urlToRemove = previewUrlsRef.current.get(fileKey);
      if (urlToRemove) {
        URL.revokeObjectURL(urlToRemove);
        previewUrlsRef.current.delete(fileKey);
      }
    }

    setSelectedFiles((current) => current.filter((_, i) => i !== index));
  };

  // Consolidated file input reset with mobile-specific handling
  const resetFileInput = useCallback(() => {
    const input = ikFileInputRef.current;
    if (!input) return;

    input.value = "";

    if (isMobileDevice) {
      // force form reset and blur for mobile browsers
      input.form?.reset();
      input.blur();
    }
  }, [isMobileDevice]);

  const handleFileInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      let newFiles = Array.from(event.target.files || []);

      if (newFiles.length === 0) {
        resetFileInput();
        return;
      }

      if (newFiles.length + selectedFiles.length > MAX_IMAGE_UPLOADS) {
        setPhotoLimitReached(true);
        newFiles = newFiles.slice(0, MAX_IMAGE_UPLOADS - selectedFiles.length);
      }

      let validFiles: File[] = [];

      newFiles.forEach((f) => {
        if (!fileSizeValidator(f)) {
          toast.error(`${f.name} is larger than ${MAX_FILE_SIZE_MB}MB and cannot be uploaded`);
        } else {
          validFiles.push(f);
        }
      });

      setSelectedFiles((prev) => [...prev, ...validFiles]);

      // Reset input after processing
      setTimeout(resetFileInput, 100);
    },
    [fileSizeValidator, resetFileInput, selectedFiles.length]
  );

  // Mobile-specific initialization
  useEffect(() => {
    if (isMobileDevice) {
      const input = ikFileInputRef.current;
      if (input) {
        // Initialize mobile input state
        setTimeout(() => {
          input.focus();
          input.blur();
        }, 100);
      }
    }
  }, [isMobileDevice]);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      // Cleanup all preview URLs on unmount
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const triggerBulkUpload = useCallback(async () => {
    if (selectedFiles.length > MAX_IMAGE_UPLOADS) {
      setPhotoLimitReached(true);
      return;
    }

    setIsUploading(true);

    try {
      const results = await uploadMultipleImages(selectedFiles);

      await onUploadSuccess?.(results.filter((r) => !!r) as UploadResponse[]);

      const { failureCount } = results.reduce(
        (acc, result) => {
          if (!!result) {
            acc.successCount++;
          } else {
            acc.failureCount++;
          }
          return acc;
        },
        { successCount: 0, failureCount: 0 }
      );

      const successfulUrls = results.reduce((acc: string[], result) => {
        if (!!result && !!result?.url) {
          acc.push(result.url);
        }
        return acc;
      }, []);

      setUploadedImageUrls((prev) => [...prev, ...successfulUrls]);

      // Clean up all preview URLs and reset files
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
      setSelectedFiles([]);

      if (failureCount > 0) {
        toast.error(`${failureCount} images failed to upload`);
      }
    } catch (error) {
      //This error is coming from imagekit client side SDK, logging here
      logFrontendError(
        "Failed to upload images",
        error,
        "Failed to upload images. Please try again shortly or contact support."
      );
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, onUploadSuccess]);

  const triggerUploader = () => {
    // prevent rapid successive clicks (mobile browsers can get confused)
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      return;
    }
    lastClickTimeRef.current = now;

    const input = ikFileInputRef.current;
    if (!input) return;

    if (isMobileDevice) {
      // mobile-specific click handling
      input.focus();
      setTimeout(() => input.click(), 50);
    } else {
      input.click();
    }
  };

  const getPreviewUrl = useCallback((file: File): string => {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    let url = previewUrlsRef.current.get(fileKey);

    if (!url) {
      url = URL.createObjectURL(file);
      previewUrlsRef.current.set(fileKey, url);
    }

    return url;
  }, []);

  const localImages = useMemo(() => selectedFiles.map(getPreviewUrl), [selectedFiles, getPreviewUrl]);

  return {
    isUploading,
    uploadedImageUrls,
    localImages,
    handleFileInputChange,
    triggerBulkUpload,
    removeLocalImage,
    ikFileInputRef,
    triggerUploader,
    photoLimitReached,
    setPhotoLimitReached,
  };
}

type UseImageUploadApiProps = {
  imageUploadToken: string;
  initialData: ImageUploadWebsite;
};

export function useImageUploadApi({ imageUploadToken, initialData }: UseImageUploadApiProps) {
  const fetcher = async (url: string) => {
    return await handleApiRequest({
      makeRequest: async () => {
        const response = await axios.get(url);
        return response.data;
      },
      errorCallback: () => {
        return initialData;
      },
      hideErrorToast: true,
    } as any);
  };

  const { data, error, isLoading } = useSWR(
    imageUploadToken ? `/api/image-upload/${imageUploadToken}` : null,
    fetcher,
    {
      fallbackData: initialData,
      fallback: initialData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      refreshInterval: 0,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
}
