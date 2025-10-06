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

export const googleMetricsAgencyRouter = createTRPCRouter({
  googleGetData: protectedProcedure
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
          env.BACKEND_API + "api/agency/google_ads/customer",
          requestOptions,
        );
        const data: GoogleMetricsDataProps = await response.json();
        const list = data?.data
          ?.filter((e) => e.descriptive_name !== null)
          .map((item) => {
            return {
              label: item.descriptive_name ?? "",
              value: item.customer_id?.toString(),
            };
          });

        return {
          list,
          data: data,
        };
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
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: input.token,
        customer_id: input.customer_id,
        from_date: input.from_date,
        to_date: input.to_date,
        ...getUserToken(ctx, input.entity, input.client_id),
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
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { customer_id, from_date, to_date, token } = input;
      const userToken = {
        token: token,
        customer_id: customer_id,
        from_date: from_date,
        to_date: to_date,
        ...getUserToken(ctx, input.entity, input.client_id),
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
        token: z.string(),
        column: z.string(),
        sort: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userToken = {
          token: input.token,
          customer_id: input.customer_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          ...getUserToken(ctx, input.entity, input.client_id),
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
        token: z.string(),
        column: z.string(),
        sort: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userToken = {
          token: input.token,
          customer_id: input.customer_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          ...getUserToken(ctx, input.entity, input.client_id),
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
        // if (!res.ok) {
        //   throw new TRPCClientError("API request failed");
        // }
        const data: GoogleCampaignDataProps = await res.json();
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
        token: z.string(),
        column: z.string(),
        sort: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userToken = {
          token: input.token,
          customer_id: input.customer_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          ...getUserToken(ctx, input.entity, input.client_id),
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
  resyncGoogleAdsCustomerData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userToken = {
          token: input.token,
          agency_id: ctx?.session?.user?.agency?.id,
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
          `${env.BACKEND_API + "api/agency/google_ads/customer/sync"}`,
          requestOptions,
        );
        if (!res.ok) {
          throw new TRPCClientError("API request failed");
        }
        const data = await res.json();
        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),

  getCustomers: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        customer_id: z.string(),
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
          env.BACKEND_API + "api/agency/google_ads/customer",
          requestOptions,
        );
        const data: GoogleMetricsDataProps = await response.json();
        const getSingleCustomer = data.data.filter(
          (customer) => customer.customer_id === Number(input.customer_id),
        );
        return getSingleCustomer[0];
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
});
