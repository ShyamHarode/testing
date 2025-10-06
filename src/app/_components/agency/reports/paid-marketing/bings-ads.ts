import { z } from "zod";

import {
  type CreateContextOptions,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import * as Sentry from "@sentry/nextjs";
import { TRPCClientError } from "@trpc/client";
import { env } from "@/env";
import getUserToken from "@/utils/getUserToken";
import {
  bingAccountReport,
  bingAccountsData,
  bingAdCampaignData,
  bingAdGroupData,
  bingAdSearchData,
} from "./test";

export const bingMetricsAgencyRouter = createTRPCRouter({
  getBingData: protectedProcedure
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/bing_ads/accounts",
        //   requestOptions,
        // );
        // const data: BingMetricsData = await response.json();
        // if (!response.ok) {
        //   return {
        //     message: data,
        //     dataInserted: "FAILED",
        //     list: null,
        //     customer_data: null,
        //   };
        // }
        const data = bingAccountsData;
        const list = data?.data?.map((item) => {
          return {
            label: item.account_name,
            value: item.account_id,
          };
        });

        return {
          list,
          customer_data: data?.data,
          migration: data.migration,
          message: data?.message,
        };
      } catch (error) {
        Sentry.captureException(error);
        return {
          message: error,
          dataInserted: "FAILED",
          // list: null,
          // customer_data: null,
        };
      }
    }),
  syncBingMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userToken = {
        token: input.token,
        account_id: input.account_id,
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
          env.BACKEND_API + "api/agency/bing_ads/account/reports",
          requestOptions,
        );
        const data = await response.json();

        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error(error, "error");
        throw Error("API request failed");
      }
    }),

  getBingMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
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

        account_id: input.account_id,
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/bing_ads/account/reports",
        //   requestOptions,
        // );
        // const data: BingAdsTableDataApiResponse = await response.json();
        const data = await bingAccountReport;

        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),

  getBingAdgroup: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        account_id: z.any(),
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
      const userToken = {
        token: input.token,
        from_date: input.from_date,
        to_date: input.to_date,
        column: input.column,
        account_id: input.account_id,
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
      // const res = await fetch(
      //   `${env.BACKEND_API}api/agency/bing_ads/account/reports?data_type=adgroup&page=${input.page}`,
      //   requestOptions,
      // );
      // if (!res.ok) {
      //   throw new Error("API request failed");
      // }
      // const data: BingAdsGroupDataApiResponse = await res.json();
      const data = await bingAdGroupData;

      return data.data;
    }),
  getBingAdCampaign: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        account_id: z.any(),
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
      const userToken = {
        token: input.token,

        account_id: input.account_id,
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
      // const res = await fetch(
      //   `${env.BACKEND_API}api/agency/bing_ads/account/reports?data_type=campaigns&page=${input.page}`,
      //   requestOptions,
      // );
      // if (!res.ok) {
      //   throw new Error("API request failed");
      // }
      // const data: BingAdsCampaignDataApiResponse = await res.json();
      const data = await bingAdCampaignData;
      return data.data;
    }),
  getBingAdSearch: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        account_id: z.any(),
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
      const userToken = {
        token: input.token,
        agency_id: ctx?.session?.user?.agency?.id,
        account_id: input.account_id,
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
      // const res = await fetch(
      //   `${env.BACKEND_API}api/agency/bing_ads/account/reports?data_type=search&page=${input.page}`,
      //   requestOptions,
      // );
      // if (!res.ok) {
      //   throw new Error("API request failed");
      // }
      // const data: BingAdsSearchDataApiResponse = await res.json();
      const data = await bingAdSearchData;

      return data.data;
    }),
  resyncBingsAdsCustomerData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
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
        const res = await fetch(
          `${env.BACKEND_API}api/agency/bing_ads/accounts/sync`,
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
});

export interface BingMetricsData {
  message: string;
  migration: boolean;
  data: {
    organization: string;
    account_id: string;
    clientId: string;
    account_name: string;
    account_number: string;
    customer_id: string;
    customer_name: string;
    status: string;
    search_history: { start_date: string; end_date: string } | null;
  }[];
}

export interface BingAdsTableDataApiResponse {
  message: string;
  error: string;
  migration: boolean;
  data: Data;
}
export interface BingAdsGroupDataApiResponse {
  message: string;
  error: string;
  migration: boolean;
  data: AdGroupResponse;
}
export interface BingAdsSearchDataApiResponse {
  message: string;
  error: string;
  migration: boolean;
  data: AdSearchResponse;
}
export interface BingAdsCampaignDataApiResponse {
  message: string;
  error: string;
  migration: boolean;
  data: BingAdsCampaignResponse;
}

interface UpperTableData {
  clicks: number;
  impressions: number;
  conversions: number;
  cost: number;
  revenue: number;
  ctr: number;
  returnOnAdSpend: number;
  conversionRate: number;
  costPerConversion: number;
  averageCPC: number;
  averageCPM: number;
}

interface GraphData {
  clicks: number | null;
  impressions: number | null;
  conversions: number | null;
  cost: number | null;
  revenue: number | null;
  category: string;
  quarter: string;
  from_date: string;
  to_date: string;
  costPerConversion: number;
  averageCPC: number;
  ctr: number;
}

interface LowerTableData {
  device_type: string;
  clicks_percentage: number;
  impressions_percentage: number;
  conversions_percentage: number;
  cost_percentage: number;
}

interface Data {
  upper_table_data: UpperTableData;
  graph_data: GraphData[];
  lower_table_data: LowerTableData[];
  percentage_difference: any[]; // Specify the type if you know the structure of items in this array
}

interface AdGroup {
  ad_group_id: string;
  ad_group_name: string;
  ad_group_cost: number;
  ad_group_conversions: number;
  ad_group_clicks: number;
  ad_group_impressions: number;
  ad_group_ctr: number;
  ad_group_average_cpm: number;
  ad_group_average_cpc: number;
}

interface AdGroupResponse {
  adgroup: AdGroup[];
  max_page: number;
}

interface AdSearch {
  ad_id: string;
  final_url: string;
  short_headline: string;
  long_headline: string;
  first_ad_description: string;
  second_ad_description: string;
  ad_cost: number;
  ad_conversions: number;
  ad_clicks: number;
}

interface AdSearchResponse {
  ad: AdSearch[];
  max_page: number;
}

interface BingAdsCampaign {
  campaign_id: string;
  campaign_name: string;
  campaign_cost: number;
  campaign_conversions: number;
  campaign_clicks: number;
  campaign_impressions: number;
  campaign_ctr: number;
}

interface BingAdsCampaignResponse {
  campaign: BingAdsCampaign[];
  max_page: number;
}
