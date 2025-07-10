import React, { useEffect, useRef, useState } from "react";

import { IKContext, IKUpload } from "imagekitio-react";
import { Play, Trash2, Video } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { useImageKitUpload } from "@/components/hooks/useImageKitUpload";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_MB = 100; // Set appropriate video file size limit

interface VideoDraggerInputProps {
  selectedVideo?: { url: string };
  onRemoveVideo?: () => void;
  disableDelete?: boolean;
  className?: string;
  videoToken?: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onSuccess?: (response: any, source?: string) => void;
  fieldName: string;
}

interface VideoPreviewProps {
  video: { url: string };
  onRemove: () => void;
  isUploading: boolean;
  disableDelete: boolean;
}

interface SingleVideoViewProps {
  selectedVideo: { url: string } | string;
  handleRemoveVideo: () => void;
  isUploading: boolean;
  disableDelete: boolean;
}

const VideoDraggerInput = ({
  selectedVideo: externalSelectedVideo,
  onRemoveVideo: externalOnRemoveVideo,
  disableDelete = false,
  className,
  videoToken,
  onUploadStart,
  onUploadEnd,
  onSuccess,
  fieldName,
}: VideoDraggerInputProps) => {
  // Internal state for the video
  const [internalSelectedVideo, setInternalSelectedVideo] = useState<{ url: string } | string>("");

  // Use external state if provided, otherwise use internal state
  const selectedVideo = externalSelectedVideo || internalSelectedVideo;

  // Update internal state when external state changes
  useEffect(() => {
    if (externalSelectedVideo !== undefined) {
      setInternalSelectedVideo(externalSelectedVideo);
    }
  }, [externalSelectedVideo]);

  const handleRemoveVideo = () => {
    if (externalOnRemoveVideo) {
      externalOnRemoveVideo();
    } else {
      setInternalSelectedVideo("");
    }
  };

  const handleUploadSuccess = (response: any) => {
    const newVideo = { url: response.url };

    if (!externalSelectedVideo) {
      setInternalSelectedVideo(newVideo);
    }

    if (onSuccess) {
      onSuccess(response, "dragger");
    }
  };

  const {
    publicKey,
    urlEndpoint,
    authenticator,
    handleIKSuccess,
    handleIKError,
    handleIKStart,
    fileUploadHandler,
    isUploading,
  } = useImageKitUpload({
    fieldName,
    onSuccess: handleUploadSuccess,
    onUploadStart,
    onUploadEnd,
    photoToken: videoToken,
    fileType: "video",
  });

  const onDrop = (acceptedFiles: File[]) => {
    // Create a proper FileList-like object from the files array
    const fileList = {
      ...acceptedFiles,
      length: acceptedFiles.length,
      item: (index: number) => acceptedFiles[index] || null,
    } as unknown as FileList;

    // Create a mock event object that matches the expected signature
    const mockEvent = {
      target: {
        files: fileList,
      } as HTMLInputElement,
    } as React.ChangeEvent<HTMLInputElement>;

    fileUploadHandler(mockEvent);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    multiple: false,
    disabled: isUploading,
  });

  return (
    <IKContext publicKey={publicKey} urlEndpoint={urlEndpoint} authenticator={authenticator}>
      <div
        {...getRootProps()}
        className={cn(
          "flex justify-center items-center rounded-lg border border-dashed border-gray-900/25 relative bg-gray-50 transition-colors duration-200 mb-5",
          "h-40",
          isDragActive && "bg-gray-200",
          isUploading ? "cursor-wait" : "cursor-pointer",
          className
        )}
      >
        <input {...getInputProps()} />

        <SingleVideoView
          selectedVideo={selectedVideo}
          handleRemoveVideo={handleRemoveVideo}
          isUploading={isUploading}
          disableDelete={disableDelete}
        />

        {/* @ts-ignore */}
        <IKUpload
          id={`ikUpload-${fieldName}`}
          style={{ display: "none" }}
          onError={handleIKError}
          onSuccess={handleIKSuccess}
          onUploadStart={handleIKStart}
          useUniqueFileName={true}
        />
      </div>
    </IKContext>
  );
};

const SingleVideoView = ({ selectedVideo, handleRemoveVideo, isUploading, disableDelete }: SingleVideoViewProps) => {
  if (typeof selectedVideo === "object" && selectedVideo?.url?.length > 0) {
    return (
      <div className="p-4 relative w-full flex justify-center">
        <div className="relative">
          <VideoPreview
            video={selectedVideo as { url: string }}
            onRemove={handleRemoveVideo}
            isUploading={isUploading}
            disableDelete={disableDelete}
          />
        </div>
      </div>
    );
  }

  return <UploadPrompt isUploading={isUploading} />;
};

const UploadPrompt = ({ isUploading }: { isUploading: boolean }) => (
  <button
    className="justify-self-center p-4 w-full"
    type="button"
    aria-label="Upload video"
    role="button"
    disabled={isUploading}
  >
    {isUploading ? (
      <Spinner className="mx-auto h-12 w-12 text-gray-500" />
    ) : (
      <Video className="mx-auto h-12 w-12 text-gray-500" aria-hidden="true" />
    )}
    <div className="mt-4 mx-auto w-max flex flex-col text-sm leading-6 text-gray-600">
      <div className="relative cursor-pointer rounded-md font-semibold text-rebolt-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-rebolt-800 focus-within:ring-offset-2">
        <span>{isUploading ? "Uploading video..." : "Upload video"}</span>
      </div>
    </div>
    <p className="text-xs leading-5 text-gray-600">{MAX_FILE_SIZE_MB} MB max file size</p>
  </button>
);

// Video Preview View
const VideoPreview = ({ video, onRemove, isUploading, disableDelete }: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden border border-slate-800/40"
      style={{ width: "200px", height: "112.5px" }}
    >
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <Spinner className="h-8 w-8 text-white" />
        </div>
      )}
      <video
        ref={videoRef}
        src={video.url}
        className="object-cover rounded-lg w-full h-full"
        onClick={togglePlayPause}
      />

      {!isPlaying && !isUploading && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
          onClick={togglePlayPause}
        >
          <Play className="w-5 h-5" />
        </Button>
      )}

      {!isUploading && !disableDelete && <DeleteButton onRemove={onRemove} />}
    </div>
  );
};

const DeleteButton = ({ onRemove }: { onRemove: () => void }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="xs"
        type="button"
        variant="destructive"
        className="absolute bottom-2 right-2 p-1.5 max-w z-[1]"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">Remove</TooltipContent>
  </Tooltip>
);

export default VideoDraggerInput;
