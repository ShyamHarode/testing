import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import getUserToken from "@/utils/getUserToken";
import * as Sentry from "@sentry/nextjs";
import { LinkedinCreateProps, LinkedinMetricsDataProps } from "@/types/metrics";
import { linkedInAccountsData, linkedInAnalyticsData } from "./test";
export const linkedInAdsMetricsAgencyRouter = createTRPCRouter({
  linkedInAnalyticsGetCustomerData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { token } = input;
      const userToken = {
        token: token,
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
      try {
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/linkedin_ads/accounts",
        //   requestOptions,
        // );
        // const data: LinkedinCreateProps = await response.json();
        // if (data?.error) {
        //   throw new TRPCClientError(data.error);
        // }
        const data = linkedInAccountsData;
        const list = data?.data?.map((item) => {
          return {
            label: item.name,
            value: item.account_id,
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
  linkedInAnalyticsGetCustomerMetricsDataSync: protectedProcedure
    .input(
      z.object({
        account_id: z.number(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { account_id, from_date, to_date, token } = input;
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify({
          account_id: account_id,
          from_date: from_date,
          to_date: to_date,
          token: token,
          ...getUserToken(ctx, input.entity, input.client_id),
        }),
      };
      try {
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/linkedin_ads/account/analytics",
        //   requestOptions,
        // );
        // const data: LinkedinMetricsDataProps = await response.json();
        // if (data?.error) {
        //   throw new TRPCClientError(data.error);
        // }
        const data = await linkedInAnalyticsData;
        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  linkedInAnalyticsGetCustomerMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { account_id, from_date, to_date, token } = input;
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify({
          account_id: account_id,
          from_date: from_date,
          to_date: to_date,
          token: token,
          ...getUserToken(ctx, input.entity, input.client_id),
        }),
      };
      try {
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/linkedin_ads/account/analytics",
        //   requestOptions,
        // );
        // const data: LinkedinMetricsDataProps = await response.json();
        // if (data?.error) {
        //   throw new TRPCClientError(data.error);
        // }
        const data = await linkedInAnalyticsData;
        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
});
