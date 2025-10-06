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

export const googleAnalyticsClientRouter = createTRPCRouter({
  getAllGoogleAnalyticMetrics: protectedProcedure.query(
    async ({ ctx, input }) => {
      const userToken = {
        token: "google_analytics",
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
        const data: AnalyticsAccountDataPropsClient = await response.json();
        console.log(data, "data");
        const responseproperties = await fetch(
          env.BACKEND_API + "api/agency/google_analytics/account/properties",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: env.BACKEND_API_AUTHORIZATION,
            },
            body: JSON.stringify({
              token: "google_analytics",
              agency_id: ctx.session.user.client.agencyId,
              account_id: data.data.account,
            }),
          },
        );
        const properties: AnalyticsProperties = await responseproperties.json();
        console.log(
          properties.data.find(
            (n) => n.client_id === ctx.session.user.client.id,
          ),
          "properties",
        );
        const filterProperties = properties.data.find(
          (n) => n.client_id === ctx.session.user.client.id,
        );
        if (filterProperties) {
          const metrics = await fetch(
            env.BACKEND_API +
              "api/agency/google_analytics/account/property/metrics",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: env.BACKEND_API_AUTHORIZATION,
              },
              body: JSON.stringify({
                token: "google_analytics",
                // agency_id: ctx?.session?.user?.client?.agencyId,
                // client_id: ctx?.session?.user?.client?.id,
                account_id: filterProperties?.parent,
                from_date: filterProperties?.search_history?.start_date,
                to_date: filterProperties?.search_history?.end_date,
                property_id: filterProperties?.property,
                // entity: "CLIENT",
                ...getUserToken(ctx, "AGENCY", ctx.session.user.client.id),
              }),
            },
          );
          console.log(metrics, "metrics");
          return {
            account: data,
            properties,
            metrics: (await metrics.json()) as AnalyticsMetricData,
          };
        }

        return {
          account: data,
          properties,
          // metrics: (await metrics.json()) as AnalyticsMetricData,
        };
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    },
  ),

  googleAnalyticsGetCustomerMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        property_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { account_id, from_date, to_date, property_id } = input;
      const userToken = {
        token: "google_analytics",

        account_id: account_id,
        from_date: from_date,
        to_date: to_date,

        property_id,
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

  getGoogleEvents: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        account_id: z.string(),
        property_id: z.string(),
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
          token: "google_analytics",
          account_id: input.account_id,
          property_id: input.property_id,
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
        column: z.string(),
        sort: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      // try {

      // } catch (error) {
      //   Sentry.captureException(error);
      //   // throw new TRPCClientError(
      //   //   `"API request failed" ${JSON.stringify(error)}`,
      //   // );
      // }

      const userToken = {
        token: "google_analytics",
        account_id: input.account_id,
        property_id: input.property_id,
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
          `api/agency/google_analytics/account/property/metrics?data_type=pages&page=${input.page}`,
        requestOptions,
      );
      // console.log(JSON.stringify(await res.json()), "await res.json(); from getGooglePages ");
      // if (!res.ok) {
      //   throw new TRPCClientError("API request failed");
      // }
      const data: {
        message: string;
        migration: boolean;
        data: {
          events: {
            eventName: string;
            totalUsers: number;
            eventCount: number;
            eventCountPerUser: number;
            newUsers: number;
          }[];
          max_page: number;
        };
      } = await res.json();
      console.log(data, "data ");
      return data ?? {};
    }),
  getGoogleSources: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        account_id: z.string(),
        property_id: z.string(),
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
          token: "google_analytics",
          account_id: input.account_id,
          property_id: input.property_id,
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
            `api/agency/google_analytics/account/property/metrics?data_type=sources&page=${input.page}`,
          requestOptions,
        );

        const data = await res.json();

        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
});

export interface AnalyticsAccountDataPropsClient {
  message: string;
  migration: boolean;
  data: {
    id: string;
    agency: string;
    name: string;
    created_date: string;
    account: string;
    account_displayName: string;
  };
}
