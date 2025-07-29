import { useCallback } from "react";

import { PageType } from "@prisma/client";
import useSWR, { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";

import useRouterQuery from "@/components/hooks/useRouterQuery";
import * as blogPostQueries from "@/lib/queries/blogPostQueries";
import { handleApiRequest } from "@/lib/utils";
import { type BlogPostWithPage, type CreateOrUpdateBlogPostFormData } from "@/types/blog-post";

const getBlogPostsKey = (websiteId: string) => `/api/sites/${websiteId}/blog-posts`;
const getSingleBlogPostKey = (websiteId: string, postId: string) => `/api/sites/${websiteId}/blog-posts/${postId}`;

export function useBlogPosts() {
  const websiteId = useRouterQuery("websiteId") as string;
  const cacheKey = getBlogPostsKey(websiteId);

  const fetcher = async () => {
    return await handleApiRequest({
      makeRequest: async () => blogPostQueries.getBlogPosts(websiteId),
    } as any);
  };

  const { data: blogPosts, error, isLoading } = useSWR<BlogPostWithPage[]>(websiteId ? cacheKey : null, fetcher);

  const createBlogPost = useCallback(
    async (data: CreateOrUpdateBlogPostFormData) => {
      const now = new Date();
      const pageId = uuidv4();
      // create fully typed optimistic post
      const optimisticPost: BlogPostWithPage = {
        ...data,
        id: uuidv4(),
        websiteId,
        createdAt: now,
        updatedAt: now,
        pageId,
        page: {
          id: pageId,
          name: data.title,
          slug: data.slug,
          type: PageType.BLOG,
          metaTitle: data.metaTitle || null,
          ogImageId: null,
          metaDescription: data.metaDescription || null,
          script: null,
          adminPrompt: null,
          websiteId,
          createdAt: now,
          updatedAt: now,
        },
      };

      return await handleApiRequest({
        makeRequest: async () => {
          const createdPost = await Promise.all([
            mutate(
              cacheKey,
              async (posts: BlogPostWithPage[] = []) => {
                const newPost = await blogPostQueries.createBlogPost(websiteId, data);
                // await mutate(getSingleBlogPostKey(websiteId, newPost.id), newPost);
                return [newPost, ...posts];
              },
              { optimisticData: [optimisticPost, ...(blogPosts || [])] }
            ),
            // also mutate the individual post cache
            mutate(getSingleBlogPostKey(websiteId, optimisticPost.id), optimisticPost, { revalidate: false }),
          ]);

          return createdPost?.[1];
        },
      } as any);
    },
    [websiteId, blogPosts, cacheKey]
  );

  const updateBlogPost = useCallback(
    async (postId: string, data: CreateOrUpdateBlogPostFormData) => {
      const postKey = getSingleBlogPostKey(websiteId, postId);
      const existingPost = blogPosts?.find((post) => post.id === postId);
      if (!existingPost) throw new Error("Post not found");

      const now = new Date();
      // create typed optimistic post
      const optimisticPost: BlogPostWithPage = {
        ...existingPost,
        ...data,
        updatedAt: now,
        page: {
          ...existingPost.page,
          slug: data.slug,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          updatedAt: now,
        },
      };

      return await handleApiRequest({
        makeRequest: async () => {
          // mutate both the list and individual post
          const updatedPosts = await Promise.all([
            mutate(
              cacheKey,
              async (posts: BlogPostWithPage[] = []) => {
                const updatedPost = await blogPostQueries.updateBlogPost(websiteId, postId, data);
                await mutate(postKey, updatedPost);
                return [updatedPost, ...posts.filter((post) => post.id !== postId)];
              },
              {
                optimisticData: [optimisticPost, ...(blogPosts?.filter((post) => post.id !== postId) || [])],
              }
            ),
            mutate(postKey, optimisticPost, { revalidate: false }), // mutate the individual post cache
          ]);

          return updatedPosts?.[1]; // return the updated post from the individual blog post cache
        },
      } as any);
    },
    [websiteId, blogPosts, cacheKey]
  );

  const deleteBlogPost = useCallback(
    async (postId: string) => {
      const postKey = getSingleBlogPostKey(websiteId, postId);

      return await handleApiRequest({
        makeRequest: async () => {
          // mutate both the list and individual post
          return await Promise.all([
            mutate(
              cacheKey,
              async (posts: BlogPostWithPage[] = []) => {
                await blogPostQueries.deleteBlogPost(websiteId, postId);
                await mutate(postKey, null); // clear individual post cache
                return posts.filter((post) => post.id !== postId);
              },
              { optimisticData: blogPosts?.filter((post) => post.id !== postId) }
            ),
            mutate(postKey, null, { revalidate: false }),
          ]);
        },
      } as any);
    },
    [websiteId, blogPosts, cacheKey]
  );

  const getBlogPost = useCallback(
    async (postId: string) => {
      const postKey = getSingleBlogPostKey(websiteId, postId);
      const cachedPost = blogPosts?.find((post) => post.id === postId);

      // if we have it in the list cache, use that
      if (cachedPost) {
        // update individual cache with list data
        await mutate(postKey, cachedPost, false);
        return cachedPost;
      }

      return await handleApiRequest({
        makeRequest: async () => {
          const post = await blogPostQueries.getBlogPost(websiteId, postId);
          // cache the individual post
          await mutate(postKey, post, false);
          return post;
        },
      } as any);
    },
    [websiteId, blogPosts]
  );

  return {
    blogPosts: blogPosts || [],
    isLoading,
    error,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    getBlogPost,
  };
}
