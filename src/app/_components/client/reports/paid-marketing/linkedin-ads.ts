import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import getUserToken from "@/utils/getUserToken";
import * as Sentry from "@sentry/nextjs";
import { linkedInAccountsData, linkedInAnalyticsData } from "../test";
export const linkedInAdsMetricsClientRouter = createTRPCRouter({
  linkedInAnalyticsGetCustomerData: protectedProcedure.query(
    async ({ input, ctx }) => {
      const userToken = {
        token: "linkedin_ads",
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/linkedin_ads/accounts",
        //   requestOptions,
        // );
        // const data: LinkedinCreateProps = await response.json();
        const data = await linkedInAccountsData;

        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    },
  ),
  linkedInAnalyticsGetCustomerMetricsDataSync: protectedProcedure
    .input(
      z.object({
        account_id: z.number(),
        from_date: z.string(),
        to_date: z.string(),

        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { account_id, from_date, to_date } = input;
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
          token: "linkedin_ads",
          ...getUserToken(ctx, input.entity, ctx.session?.user?.client?.id),
        }),
      };
      try {
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/linkedin_ads/account/analytics",
        //   requestOptions,
        // );
        const data = await linkedInAnalyticsData;
        console.log(data, "data");
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

        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { account_id, from_date, to_date } = input;
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
          token: "linkedin_ads",
          ...getUserToken(ctx, input.entity, ctx.session?.user?.client?.id),
        }),
      };
      try {
        //    const response = await fetch(
        //   env.BACKEND_API + "api/agency/linkedin_ads/account/analytics",
        //   requestOptions,
        // );
        const data = await linkedInAnalyticsData;
        if (data?.message) {
          throw new TRPCClientError(data.message);
        }
        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
});

export interface LinkedinCreateProps {
  message: string;
  error: string;
  migration: boolean;
  data: LinkedinCreateDataProps;
}
interface LinkedinCreateDataProps {
  organization: number;
  account_id: string;
  currency: string;
  name: string;
  reference: string;
  status: string;
  type: string;
  test: boolean;
  search_history: { start_date: string; end_date: string } | null;
}

export interface LinkedinMetricsDataProps {
  message: string;
  error: string;
  migration: boolean;
  data: {
    ad_analytics_data: {
      account: number;
      approximateUniqueImpressions: null;
      clicks: number;
      comments: number;
      conversionValueInLocalCurrency: null;
      costInLocalCurrency: string;
      costInUsd: string;
      externalWebsiteConversions: number;
      externalWebsitePostClickConversions: null;
      externalWebsitePostViewConversions: null;
      follows: number;
      impressions: number;
      likes: number;
      linkedin_created_date: string;
      sends: number;
      shares: number;
      totalEngagements: number;
      videoViews: number;
      viralImpressions: number;
      viralTotalEngagements: number;
      dateRange: {
        end: {
          day: number;
          year: number;
          month: number;
        };
        start: {
          day: number;
          year: number;
          month: number;
        };
      };
    }[];
    upper_table_data: {
      clicks: number;
      impressions: number;
      cost: number;
      cost_local: number;
      revenue: number;
      conversions: number;
      ctr: number;
      returnOnAdSpend: number;
      conversionRate: number;
      costPerConversion: number;
      averageCPC: number;
      averageCPM: number;
    };
    graph_data: {
      clicks: number;
      impressions: number;
      cost: number;
      revenue: number;
      conversions: number;
      category: string;
      quarter: string;
      from_date: string;
      to_date: string;
      costPerConversion: number;
      averageCPC: number;
      ctr: number;
    }[];
    percentage_increase: never[];
  };
  current_page: number;
  max_page: number;
}
