import { useCallback, useState } from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import ImageUploaderForm from "@/components/forms/ImageUploaderForm";
import { FormButtonWrapper } from "@/components/FormSubmitButton";
import useRouterQuery from "@/components/hooks/useRouterQuery";
import { useUser } from "@/components/hooks/useUser";
import { useWebsite } from "@/components/hooks/useWebsite";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { getServicePage, getServicesBySite, upsertServices } from "@/lib/queries/serviceQueries";
import { getSectionBgImageObject, handleApiRequest, logFrontendError } from "@/lib/utils";
import { imageInputSchema } from "@/lib/zod-schemas/image-input";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  services: z.array(
    z.object({
      blurb: z.string().nullable().optional(),
      name: z.string().min(1, "Service name is required"),
      id: z.string().nullable().optional(),
      serviceImg: imageInputSchema(false).nullable().optional(),
      servicePageImage: imageInputSchema(false).nullable().optional(),
    })
  ),
});

export default function ServicesEditor({ content, onSave, page }) {
  const { isSuperUser } = useUser();
  const websiteId = useRouterQuery("websiteId");
  const { website } = useWebsite(["id", "images", "industry"]);

  const [editingIndex, setEditingIndex] = useState();
  const [isLoading, setIsLoading] = useState(false);

  // to fetch a service page hero image
  const fetchServicePageImage = useCallback(
    async (serviceId) => {
      try {
        const page = await handleApiRequest({
          makeRequest: () => getServicePage(serviceId, websiteId),
          hideErrorToast: true,
        });

        if (!page) return null;

        const heroSection = page?.sections?.find(
          (section) => section.type === SECTION_TYPES.SERVICE_HERO || section.type === SECTION_TYPES.HOME_HERO
        );

        if (!heroSection?.content?.bgImage) {
          return null;
        }

        return getSectionBgImageObject(heroSection.content.bgImage);
      } catch (error) {
        return null;
      }
    },
    [websiteId]
  );

  const fetchDefaultValues = useCallback(async () => {
    if (!websiteId) {
      return logFrontendError(
        "No websiteId provided for ServicesEditor",
        new Error("No websiteId provided for ServicesEditor")
      );
    }

    setIsLoading(true);
    try {
      const services = await handleApiRequest({
        makeRequest: () => getServicesBySite(websiteId),
        hideErrorToast: true,
      });

      if (!services) {
        setIsLoading(false);
        return { header: content.header, services: [] };
      }

      // Map the services to include serviceId and fetch page images
      const servicesWithFields = await Promise.all(
        services.map(async (service) => {
          const pageImage = await fetchServicePageImage(service.id);
          return {
            serviceId: service.id,
            ...service,
            serviceImg: service.serviceImg ? getSectionBgImageObject(service.serviceImg) : null,
            servicePageImage: pageImage,
          };
        })
      );

      return {
        header: content.header,
        services: servicesWithFields,
      };
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, content.header, fetchServicePageImage]);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: fetchDefaultValues,
  });

  const { fields, remove, append } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const saveWithServices = async (data) => {
    if (checkDuplicateServices(data.services)) {
      return;
    }

    if (!website?.images?.length && !data.services.some((service) => service.serviceImg?.url)) {
      toast.error(
        <div>
          No photos found for this website.
          <br />
          <Link href={`/dashboard/sites/${websiteId}/photos`} className="underline text-ash-800 hover:text-ash-900">
            Add photos
          </Link>
        </div>
      );
      return;
    }

    setIsLoading(true);

    const servicesToSave = data.services.map((service) => ({
      ...service,
      serviceImg: service.serviceImg?.url ?? "",
    }));

    await handleApiRequest({
      makeRequest: async () => {
        const updatedServices = await upsertServices(websiteId, servicesToSave);

        // update Section model only
        await onSave({
          header: data.header,
        });

        return updatedServices;
      },
      successCallback: async (updatedServices) => {
        if (!updatedServices) {
          toast.error("Failed to update services, please try again");
          return;
        }

        // Map the updated services to include serviceId and fetch page images
        const servicesWithFields = await Promise.all(
          updatedServices.map(async (service) => ({
            serviceId: service.id,
            ...service,
            serviceImg: service.serviceImg ? getSectionBgImageObject(service.serviceImg) : null,
            servicePageImage: await fetchServicePageImage(service.id),
          }))
        );

        form.reset({
          header: data.header,
          services: servicesWithFields,
        });

        setEditingIndex(null);
      },
      finallyCallback: () => {
        setIsLoading(false);
      },
    });
  };

  const handleSortEnd = (newItems) => {
    // Map the reordered items back to their original service structure
    const reorderedServices = newItems.map((item) => {
      const originalService = fields.find((field) => field.id === item.id);
      return {
        ...originalService,
        id: originalService.serviceId, // Use the original DB id
      };
    });

    form.setValue("services", reorderedServices, { shouldDirty: true });
  };

  // End of  Selection
  return (
    <form onSubmit={form.handleSubmit(saveWithServices)}>
      <EditorInputField
        form={form}
        fieldName="header"
        label="Header"
        aiPrompt={{
          type: PROMPT_TYPES.HEADER_SUBHEADER,
          componentName: "Header",
          sectionName: SECTION_TYPES.SERVICES,
          page,
        }}
      />

      <div className="h-4" />

      <EditorInputList
        fields={fields}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        remove={remove}
        listName="Services"
        allowDelete={false}
        onSortEnd={handleSortEnd}
        onXClick={() => {
          if (!fields[editingIndex]?.serviceId) {
            remove(editingIndex);
          }
          setEditingIndex(null);
        }}
        renderDisplay={(field) => (
          <div className="flex items-start flex-col gap-2 border-ash-200 border p-3 rounded-md">
            <div className="flex flex-col gap-1">
              <p className="font-bold text-sm">{field.name}</p>
              <p className={"font-normal text-xs italic line-clamp-2"}>{field.blurb}</p>
            </div>
          </div>
        )}
        renderEdit={(_, index) => (
          <>
            <input type="hidden" {...form.register(`services.${index}.id`)} />
            <input type="hidden" {...form.register(`services.${index}.servicePageImage`)} />
            <EditorInputField
              type="text"
              disabled={form.watch(`services.${index}.serviceId`)}
              form={form}
              fieldName={`services.${index}.name`}
              label="Service Name"
              autoFocus
            />
            <EditorInputField
              aiPrompt={{
                type: PROMPT_TYPES.SERVICE_BLURB,
                service: form.watch(`services.${index}.name`),
                industry: website?.industry,
                page,
              }}
              type="textarea"
              condense
              form={form}
              fieldName={`services.${index}.blurb`}
              label="Short Blurb about this Service"
            />
            <ImageUploaderForm form={form} fieldName={`services.${index}.serviceImg`} label="Service Image" />
            {fields[index].servicePageImage && isSuperUser && (
              <RainbowButton
                type="button"
                size="sm"
                className="w-full"
                disabled={areImagesEqual(fields[index].servicePageImage, fields[index].serviceImg)}
                onClick={() => {
                  form.setValue(`services.${index}.serviceImg`, fields[index].servicePageImage, { shouldDirty: true });
                }}
              >
                {areImagesEqual(fields[index].servicePageImage, fields[index].serviceImg)
                  ? "Using Image from Page"
                  : "Use Image from Page"}
              </RainbowButton>
            )}
          </>
        )}
      />

      {fields.length === 0 && !isLoading && <p className=" text-ash-600 mb-2">No services added yet</p>}

      {isLoading && <p className="text-ash-600 mb-2">Loading...</p>}

      {!isLoading && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            append({
              name: "",
              blurb: "",
              serviceImg: null,
              servicePageImage: null,
              id: null,
              serviceId: null,
            });

            // Use setTimeout to ensure the field is added before setting the editing index
            setTimeout(() => {
              setEditingIndex(fields.length);
            }, 0);
          }}
          type="button"
          className="mb-4"
        >
          + Add a service
        </Button>
      )}
      <FormButtonWrapper form={form} isLoading={isLoading} />
    </form>
  );
}

function checkDuplicateServices(services) {
  const allServiceNames = services.map((service) => service.name.toLowerCase());

  const duplicateServiceNames = allServiceNames.filter((name, index, array) => array.indexOf(name) !== index);

  if (duplicateServiceNames.length > 0) {
    toast.error(`Cannot have duplicate service names: ${duplicateServiceNames.join(", ")}`);
    return true;
  }
  return false;
}

const areImagesEqual = (img1, img2) => {
  if (!img1 || !img2) return false;
  return img1.url === img2.url;
};
