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

import type { Page } from "@prisma/client";

const reviewSchema = z.object({
  id: z.string().optional(),
  websiteId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  source: z.string().optional(),
  rating: z.number().optional(),
  starred: z.boolean().optional(),
  author: z.string().min(1, "Author is required"),
  content: z.string().min(1, "Content is required"),
});

const validationSchema = z.object({
  header: z.string().min(1, "Header is required"),
  subheader: z.string().optional(),
  reviews: z.array(reviewSchema).optional(),
});

type ReviewInput = z.infer<typeof reviewSchema>;
type FormData = z.infer<typeof validationSchema>;

interface Content {
  header?: string;
  subheader?: string;
}

interface TestimonialEditorProps {
  content: Content;
  onSave: (data: FormData) => Promise<void>;
  page: Page;
  pages: Array<Pick<Page, "websiteId">>;
}

type ReviewField = ReviewInput & { id: string };

export default function TestimonialEditor({ content, onSave, page, pages }: TestimonialEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [initialReviews, setInitialReviews] = useState<ReviewInput[]>([]);

  const fetchReviews = async (): Promise<ReviewInput[] | undefined> => {
    return handleApiRequest<ReviewInput[]>({
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

  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: async () => {
      const reviews = (await fetchReviews()) ?? [];
      return {
        header: content.header,
        subheader: content.subheader,
        reviews,
      };
    },
  });

  const onFormSubmit = async (data: FormData) => {
    const changedReviews: ReviewInput[] = [];
    const deletedReviews: ReviewInput[] = [];

    (data.reviews ?? []).forEach((review) => {
      const initialReview = initialReviews.find((r) => r.id === review.id);
      if (!initialReview || review.author !== initialReview.author || review.content !== initialReview.content) {
        changedReviews.push(review);
      }
    });

    initialReviews.forEach((review) => {
      if (!(data.reviews ?? []).some((r) => r.id === review.id)) {
        deletedReviews.push(review);
      }
    });

    await handleApiRequest({
      makeRequest: async () => {
        for (const review of changedReviews) {
          if (review.id) {
            await updateReview(pages[0].websiteId, review);
          } else {
            await insertReview(pages[0].websiteId, review);
          }
        }

        for (const review of deletedReviews) {
          if (review.id) {
            await deleteReview(pages[0].websiteId, review.id);
          }
        }

        const updatedReviews = await getReviews(pages[0].websiteId);
        const updatedData: FormData = { ...data, reviews: updatedReviews };
        return updatedData;
      },
      successCallback: async (updatedData: FormData) => {
        await onSave(updatedData);
        setInitialReviews(updatedData.reviews ?? []);
        form.reset(updatedData);
        setEditingIndex(null);
      },
    });
  };

  const { control, handleSubmit } = form;

  const { fields, append, remove } = useFieldArray<FormData, "reviews">({
    control,
    name: "reviews",
  });

  const handleSortEnd = (newItems: ReviewField[]) => {
    const withoutIds = newItems.map(({ id: _, ...rest }) => rest);
    form.setValue("reviews", withoutIds, { shouldDirty: true });
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

      <EditorInputList<ReviewField>
        fields={fields as unknown as ReviewField[]}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        remove={remove}
        listName="Testimonials"
        onSortEnd={handleSortEnd}
        allowReorder={false}
        onXClick={() => {
          if (editingIndex !== null && !fields[editingIndex]?.author) {
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
        renderEdit={(_field, index) => (
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
          } as ReviewInput);
          setEditingIndex(fields.length);
        }}
      >
        Add Testimonial
      </Button>

      <FormButtonWrapper form={form} />
    </form>
  );
}
