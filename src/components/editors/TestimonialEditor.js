import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import { Button } from "@/components/ui/button";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import { SECTION_TYPES } from "@/lib/constants/sections";
import { deleteReview, getReviews, insertReview, updateReview } from "@/lib/queries/reviewQueries";
import { handleApiRequest } from "@/lib/utils";
import { FormButtonWrapper } from "../FormSubmitButton";

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().optional(),
  reviews: z
    .array(
      z.object({
        id: z.string().optional(),
        websiteId: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
        source: z.string().optional(),
        rating: z.number().optional(),
        starred: z.boolean().optional(),
        author: z.string().min(1, "Author is required"),
        content: z.string().min(1, "Content is required"),
      })
    )
    .optional(),
});

export default function TestimonialEditor({ content, onSave, page, pages }) {
  const [editingIndex, setEditingIndex] = useState();
  const [initialReviews, setInitialReviews] = useState([]);

  const fetchReviews = async () => {
    return await handleApiRequest({
      makeRequest: async () => {
        return getReviews(pages[0].websiteId);
      },
      successCallback: (reviews) => {
        setInitialReviews(reviews);
        return reviews;
      },
      hideErrorToast: true,
    });
  };

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: async () => {
      const reviews = await fetchReviews();
      return {
        header: content.header,
        subheader: content.subheader,
        reviews: reviews || [],
      };
    },
  });

  const onFormSubmit = async (data) => {
    const changedReviews = [];
    const deletedReviews = [];

    // Check for updated and new reviews
    data.reviews.forEach((review) => {
      const initialReview = initialReviews.find((r) => r.id === review.id);
      if (!initialReview || review.author !== initialReview.author || review.content !== initialReview.content) {
        changedReviews.push(review);
      }
    });

    // Check for deleted reviews
    initialReviews.forEach((review) => {
      if (!data.reviews.some((r) => r.id === review.id)) {
        deletedReviews.push(review);
      }
    });

    await handleApiRequest({
      makeRequest: async () => {
        // Handle changed reviews
        for (const review of changedReviews) {
          if (review.id) {
            await updateReview(pages[0].websiteId, review);
          } else {
            await insertReview(pages[0].websiteId, review);
          }
        }

        // Handle deleted reviews
        for (const review of deletedReviews) {
          await deleteReview(pages[0].websiteId, review.id);
        }

        // Fetch the latest reviews after all operations
        const updatedReviews = await getReviews(pages[0].websiteId);
        data.reviews = updatedReviews;

        return data;
      },
      successCallback: async (updatedData) => {
        await onSave(updatedData);
        setInitialReviews(updatedData.reviews);
        form.reset(updatedData);
        setEditingIndex(null);
      },
    });
  };

  const { control, handleSubmit } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "reviews",
  });

  const handleSortEnd = (newItems) => {
    form.setValue("reviews", newItems, { shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <EditorInputField
        form={form}
        fieldName="header"
        label="Header"
        aiPrompt={{
          type: PROMPT_TYPES.HEADER_SUBHEADER,
          componentName: "Header",
          sectionName: SECTION_TYPES.TESTIMONIALS,
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
          sectionName: SECTION_TYPES.TESTIMONIALS,
          page,
        }}
      />

      <EditorInputList
        fields={fields}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        remove={remove}
        listName="Testimonials"
        onSortEnd={handleSortEnd}
        allowReorder={false}
        onXClick={() => {
          if (!fields[editingIndex]?.author) {
            remove(editingIndex);
          }
          setEditingIndex(null);
        }}
        renderDisplay={(field) => (
          <div className="flex flex-col gap-2 border-ash-200 border p-3 rounded-md">
            <div className="flex flex-col gap-1">
              <p className="font-normal text-sm text-ash-800">{field.content}</p>
              <p className="font-bold text-sm">- {field.author}</p>
            </div>
          </div>
        )}
        renderEdit={(_, index) => (
          <>
            <EditorInputField form={form} fieldName={`reviews.${index}.author`} label="Author" />
            <EditorInputField form={form} fieldName={`reviews.${index}.content`} label="Review" type="textarea" />
          </>
        )}
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        className={`${form.formState.isDirty ? "mb-[69px]" : ""}`}
        onClick={() => {
          append({
            author: "",
            content: "",
          });
          setEditingIndex(fields.length);
        }}
      >
        Add Testimonial
      </Button>

      <FormButtonWrapper form={form} />
    </form>
  );
}
