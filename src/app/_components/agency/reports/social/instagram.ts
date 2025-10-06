import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";

import type {
  InstagramSocialMetricsDataProps,
  InstagramSocialClientProps,
} from "@/types";
import * as Sentry from "@sentry/nextjs";
import getUserToken from "@/utils/getUserToken";
import { backendApiPaths } from "@/constants";

export const instagramSocialMetricsRouterForAgency = createTRPCRouter({
  instagramSocialClientData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: input.token,
        ...getUserToken(ctx),
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify(userToken),
      };

      try {
        const response = await fetch(
          env.BACKEND_API +
            backendApiPaths.METRICS_INSTAGRAM_SOCIAL_PAGES_CLIENT_API,
          requestOptions,
        );
        console.log(response, "response");
        const data: InstagramSocialClientProps = await response.json();
        if (data?.message == "Success") {
          const list = data?.data.map((item) => {
            return {
              label: item.name,
              value: item.user_id,
            };
          });

          return {
            list,
            data: data.data,
          };
        }
      } catch (error) {
        Sentry.captureException(error);
        return { message: error };
      }
    }),

  instagramSocialMetricsSyncData: protectedProcedure
    .input(
      z.object({
        user_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
        client_id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userToken = {
        token: input.token,
        ...getUserToken(ctx, input.entity, input.client_id),
        user_id: input.user_id,
        from_date: input.from_date,
        to_date: input.to_date,
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify(userToken),
      };

      try {
        const response = await fetch(
          env.BACKEND_API +
            backendApiPaths.METRICS_INSTAGRAM_SOCIAL_PAGES_METRICS_API,
          requestOptions,
        );
        const data: InstagramSocialMetricsDataProps = await response.json();

        return { data };
      } catch (error) {
        Sentry.captureException(error);
        return { message: error, dataInserted: "FAILED" };
      }
    }),
  instagramSocialMetricsData: protectedProcedure
    .input(
      z.object({
        user_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        page: z.number(),
        entity: z.enum(["AGENCY", "CLIENT"]),
        client_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: input.token,
        ...getUserToken(ctx, input.entity, input.client_id),
        user_id: input.user_id,
        from_date: input.from_date,
        to_date: input.to_date,
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify(userToken),
      };

      try {
        const response = await fetch(
          env.BACKEND_API +
            backendApiPaths.METRICS_INSTAGRAM_SOCIAL_PAGES_METRICS_API +
            "?page=" +
            String(input.page),
          requestOptions,
        );
        const data: InstagramSocialMetricsDataProps = await response.json();

        return data.data;
      } catch (error) {
        Sentry.captureException(error);
        return { message: error, dataInserted: "FAILED" };
      }
    }),
});
