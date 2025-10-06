import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type {
  FacebookSocialMetricsDataProps,
  FacebookSocialClientProps,
} from "@/types";
import { env } from "@/env";
import getUserToken from "@/utils/getUserToken";
import { backendApiPaths } from "@/constants";
export const facebookSocialMetricsRouterForClient = createTRPCRouter({
  facebookSocialClientData: protectedProcedure.query(async ({ ctx, input }) => {
    const userToken = {
      token: "facebook_social",
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
        env.BACKEND_API + backendApiPaths.METRICS_META_SOCIAL_PAGES_CLIENT_API,
        requestOptions,
      );

      const data: FacebookSocialClientProps = await response.json();

      if (data?.message == "Success") {
        const list = data?.data.map((item) => {
          return {
            label: item.name,
            value: item.page_id,
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

  facebookSocialMetricsSyncData: protectedProcedure
    .input(
      z.object({
        page_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userToken = {
        token: "facebook_social",
        page_id: input.page_id,
        from_date: input.from_date,
        to_date: input.to_date,
        ...getUserToken(ctx, input.entity, ctx.session.user.client.id),
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
            backendApiPaths.METRICS_META_SOCIAL_PAGES_METRICS_API,
          requestOptions,
        );
        const data: FacebookSocialMetricsDataProps = await response.json();

        return { data };
      } catch (error) {
        Sentry.captureException(error);
        return { message: error, dataInserted: "FAILED" };
      }
    }),
  facebookSocialMetricsData: protectedProcedure
    .input(
      z.object({
        page_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: "facebook_social",
        page_id: input.page_id,
        from_date: input.from_date,
        to_date: input.to_date,
        ...getUserToken(ctx, input.entity, ctx.session.user.client.id),
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
            backendApiPaths.METRICS_META_SOCIAL_PAGES_METRICS_API +
            `?page=${input.page}`,
          requestOptions,
        );
        const data: FacebookSocialMetricsDataProps = await response.json();

        return data.data;
      } catch (error) {
        Sentry.captureException(error);
        return { message: error, dataInserted: "FAILED" };
      }
    }),
});
