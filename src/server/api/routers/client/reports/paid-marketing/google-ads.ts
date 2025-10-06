import { z } from "zod";
import getUserToken from "@/utils/getUserToken";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import * as Sentry from "@sentry/nextjs";
import {
  GoogleAdGroupTypes,
  GoogleAdSearchData,
  GoogleAdsMetricsDataProps,
  GoogleCampaignDataProps,
  GoogleMetricsDataProps,
} from "@/types/google-ads";
export const googleMetricsClientRouter = createTRPCRouter({
  googleGetData: protectedProcedure.query(async ({ ctx, input }) => {
    const userToken = {
      token: "google_ads",
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
        env.BACKEND_API + "api/agency/google_ads/customer",
        requestOptions,
      );
      const data: {
        message: string;
        migration: boolean;
        data: GoogleMetricsDataProps["data"]["0"];
      } = await response.json();

      return data;
    } catch (error) {
      Sentry.captureException(error);
      console.error("error", error);
      throw new TRPCClientError(JSON.stringify(error));
    }
  }),

  getGoogleMetricsData: protectedProcedure
    .input(
      z.object({
        customer_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),

        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: "google_ads",
        customer_id: input.customer_id,
        from_date: input.from_date,
        to_date: input.to_date,
        ...getUserToken(ctx, "AGENCY", ctx.session.user.client.id),
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
          env.BACKEND_API + "api/agency/google_ads/adsdata",
          requestOptions,
        );
        const data: GoogleAdsMetricsDataProps = await response.json();
        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),

  googlePaidMarketingSyncCustomerData: protectedProcedure
    .input(
      z.object({
        customer_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),

        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { customer_id, from_date, to_date } = input;
      const userToken = {
        token: "google_ads",
        customer_id: customer_id,
        from_date: from_date,
        to_date: to_date,
        ...getUserToken(ctx, "AGENCY", ctx.session.user.client.id),
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
          env.BACKEND_API + "api/agency/google_ads/adsdata",
          requestOptions,
        );
        // XAS-Reports-Integration
        const data: {
          data: any[];
          error: string;
          message: string;
          migration: boolean;
        } = await response.json();

        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),

  getGoogleGroups: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        customer_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        column: z.string(),
        sort: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userToken = {
          token: "google_ads",

          customer_id: input.customer_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          ...getUserToken(ctx, "AGENCY", ctx.session.user.client.id),
        };
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: env.BACKEND_API_AUTHORIZATION,
          },
          body: JSON.stringify(userToken),
        };

        const res = await fetch(
          env.BACKEND_API +
            `api/agency/google_ads/adsdata?data_type=adgroup&page=${input.page}`,
          requestOptions,
        );
        if (!res.ok) {
          throw new Error("API request failed");
        }
        const data: GoogleAdGroupTypes = await res.json();
        // if (data?.error) {
        //   throw new TRPCClientError(data?.error);
        // }
        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
  getGoogleAdCampaign: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        customer_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),

        column: z.string(),
        sort: z.string(),

        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userToken = {
          token: "google_ads",

          customer_id: input.customer_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          ...getUserToken(ctx, "AGENCY", ctx.session.user.client.id),
        };
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: env.BACKEND_API_AUTHORIZATION,
          },
          body: JSON.stringify(userToken),
        };

        const res = await fetch(
          env.BACKEND_API +
            `api/agency/google_ads/adsdata?data_type=campaign&page=${input.page}`,
          requestOptions,
        );

        const data: GoogleCampaignDataProps = await res.json();

        console.log(data, "data");
        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
  getGoogleAdSearch: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        customer_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),

        column: z.string(),
        sort: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userToken = {
          token: "google_ads",

          customer_id: input.customer_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          ...getUserToken(ctx, "AGENCY", ctx.session.user.client.id),
        };
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: env.BACKEND_API_AUTHORIZATION,
          },
          body: JSON.stringify(userToken),
        };
        const res = await fetch(
          env.BACKEND_API +
            `api/agency/google_ads/adsdata?data_type=search&page=${input.page}`,
          requestOptions,
        );
        if (!res.ok) {
          throw new TRPCClientError("API request failed");
        }
        const data: GoogleAdSearchData = await res.json();

        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
});
