import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

import {
  type AnalyticsAccountDataProps,
  type AnalyticsMetricData,
  type AnalyticsProperties,
} from "@/types";

import { TRPCClientError } from "@trpc/client";
import { env } from "@/env";

import * as Sentry from "@sentry/nextjs";
import getUserToken from "@/utils/getUserToken";

export const googleAnalyticsAgencyRouter = createTRPCRouter({
  getAllGoogleAnalyticsAccount: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { token } = input;
      const userToken = {
        token: token,
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
          env.BACKEND_API + "api/agency/google_analytics/account/create",
          requestOptions,
        );
        const data: AnalyticsAccountDataProps = await response.json();

        const list = data?.data?.map((item) => {
          return {
            label: item.account_displayName,
            value: item.account,
          };
        });

        return { data, list };
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),

  getAllGoogleAnalyticsProperties: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        account_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { token, account_id } = input;
      const userToken = {
        token: token,
        agency_id: ctx?.session?.user?.agency?.id,
        account_id: account_id,
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
          env.BACKEND_API + "api/agency/google_analytics/account/properties",
          requestOptions,
        );
        const data: AnalyticsProperties = await response.json();

        const list = data?.data?.map((item) => {
          return {
            label: item.displayName,
            value: item.property,
          };
        });
        return {
          list,
          data,
        };
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),

  googleAnalyticsGetCustomerMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        property_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { account_id, from_date, to_date, token, property_id } = input;
      const userToken = {
        token: token,
        agency_id: ctx?.session?.user?.agency?.id,
        account_id: account_id,
        from_date: from_date,
        to_date: to_date,
        client_id: input.client_id,
        entity: input.entity,

        property_id,
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
            "api/agency/google_analytics/account/property/metrics",
          requestOptions,
        );
        const data: AnalyticsMetricData = await response.json();
        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),

  googleAnalyticsSyncCustomerData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        property_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { account_id, from_date, to_date, token, property_id } = input;
      const userToken = {
        token: token,
        agency_id: ctx?.session?.user?.agency?.id,
        account_id: account_id,
        from_date: from_date,
        to_date: to_date,
        client_id: input.client_id,
        entity: input.entity,
        property_id,
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
            "api/agency/google_analytics/account/property/metrics",
          requestOptions,
        );

        const data = (await response.json()) as {
          message: string;
          migration: boolean;
          data: never[];
          error: string;
        };

        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getGoogleEvents: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        account_id: z.string(),
        property_id: z.string(),
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
          agency_id: ctx?.session?.user?.agency?.id,
          account_id: input.account_id,
          property_id: input.property_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          client_id: input.client_id,
          entity: input.entity,
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
            `api/agency/google_analytics/account/property/metrics?data_type=events&page=${input.page}`,
          requestOptions,
        );
        if (!res.ok) {
          throw new Error("API request failed");
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
  getGooglePages: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        account_id: z.string(),
        property_id: z.string(),
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
          agency_id: ctx?.session?.user?.agency?.id,
          account_id: input.account_id,
          property_id: input.property_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          client_id: input.client_id,
          entity: input.entity,
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
            `api/agency/google_analytics/account/property/metrics?data_type=pages&page=${input.page}`,
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
  getGoogleSources: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        account_id: z.string(),
        property_id: z.string(),
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
          agency_id: ctx?.session?.user?.agency?.id,
          account_id: input.account_id,
          property_id: input.property_id,
          from_date: input.from_date,
          to_date: input.to_date,
          column: input.column,
          sort: input.sort,
          client_id: input.client_id,
          entity: input.entity,
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
            `api/agency/google_analytics/account/property/metrics?data_type=sources&page=${input.page}`,
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
  resyncGoogleAnalyticsPropertyData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        account_id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userToken = {
          token: input.token,
          agency_id: ctx?.session?.user?.agency?.id,
          account_id: input.account_id,
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
          env.BACKEND_API + "api/agency/google_analytics/account/property/sync",
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
  resyncGoogleAnalyticsCustomerData: protectedProcedure
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
          env.BACKEND_API + "api/agency/google_analytics/account/sync",
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
  getSingleProperty: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        account_id: z.string(),
        property_id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { token, account_id, property_id } = input;
      const userToken = {
        token: token,
        agency_id: ctx?.session?.user?.agency?.id,
        account_id: account_id,
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
          env.BACKEND_API + "api/agency/google_analytics/account/properties",
          requestOptions,
        );
        const data: AnalyticsProperties = await response.json();
        const singleProperty = data.data.filter(
          (item) => item.property === property_id,
        );

        return singleProperty[0];
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
});
