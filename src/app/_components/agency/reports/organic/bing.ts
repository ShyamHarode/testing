import { z } from "zod";
import getUserToken from "@/utils/getUserToken";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import * as Sentry from "@sentry/nextjs";
import {
  bingOrganicData,
  bingOrganicKeywordsData,
  bingOrganicPagesData,
  bingOrganicSiteData,
} from "../paid-marketing/test";
export const bingOrganicMetricsAgencyRouter = createTRPCRouter({
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
      console.log(userToken, "userToken");
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
        //   env.BACKEND_API + "api/agency/bing_webmaster/sites",
        //   requestOptions,
        // );
        // const data: BingOrganicCustomerData = await response.json();
        const data = bingOrganicSiteData;
        const list = data?.data?.map((item) => {
          return {
            label: item.siteurl,
            value: item.id,
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
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
  syncBingOrganicCustomerData: protectedProcedure
    .input(
      z.object({
        site_url: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { site_url, from_date, to_date, token } = input;
      const userToken = {
        token: token,
        site_url: site_url,
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/bing_webmaster/data",
        //   requestOptions,
        // );
        // const data: BingOrganicCustomerData = await response.json();

        const data = await bingOrganicData;
        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),

  getBingOrganicCustomerMetricsData: protectedProcedure
    .input(
      z.object({
        site_url: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { site_url, from_date, to_date, token } = input;
      const userToken = {
        token: token,
        site_url: site_url,
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/bing_webmaster/data",
        //   requestOptions,
        // );
        // const data: BingOrganicMetricsData = await response.json();
        const data = await bingOrganicData;
        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getBingOrganicKeywordsData: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        site_url: z.string(),
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
        site_url: input.site_url,
        from_date: input.from_date,
        to_date: input.to_date,
        column: input.column,
        sort: input.sort,
        ...getUserToken(ctx, input.entity, input.client_id),
      };
      try {
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: env.BACKEND_API_AUTHORIZATION,
          },
          body: JSON.stringify(userToken),
        };
        // const res = await fetch(
        //   `${env.BACKEND_API}api/agency/bing_webmaster/data?data_type=keywords&page=${input.page}`,
        //   requestOptions,
        // );

        // const data: BingOrganicKeywordData = await res.json();
        const data = await bingOrganicKeywordsData;
        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.log(error, "error");
        throw new Error("API request failed");
      }
    }),
  getBingOrganicPagesData: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        site_url: z.string(),
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
        site_url: input.site_url,
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
      //   `${env.BACKEND_API}api/agency/bing_webmaster/data?data_type=pages&page=${input.page}`,
      //   requestOptions,
      // );
      // if (!res.ok) {
      //   throw new Error("API request failed");
      // }
      // const data: BingOrganicPagesData = await res.json();
      const data = await bingOrganicPagesData;
      return data;
    }),
});

export type BingOrganicCustomerData = {
  message: string;
  error?: string;
  migration: boolean;
  data: {
    id: string;
    organization: string;
    clientId: string;
    created_date: string;
    siteurl: string;
    is_verified: string;
    dns_verification_code: string;
    search_history: {
      start_date: string;
      end_date: string;
    } | null;
  }[];
};

export interface BingOrganicMetricsData {
  data: {
    upper_table: {
      clicks: number;
      impressions: number;
      ctr: number;
      AvgPosition: number;
      AvgClickPosition: number;
      AvgImpressionPosition: number;
    };
    graph_data: {
      // month: number;
      // clicks: number;
      // impressions: number;
      // category: string;
      // quarter: string;
      // from_date: string;
      // to_date: string;

      month?: number;
      quarter?: number;
      from_date?: string;
      to_date?: string;
      category: string;
      clicks: number;
      impressions: number;
    }[];

    percentage_difference: {
      clicks: number;
      impressions: number;
      AvgClickPosition: number;
      AvgImpressionPosition: number;
    };
  };
  message: string;
  migration: boolean;
}
export interface BingOrganicPagesData {
  message: string;
  migration: boolean;
  data: {
    pages: {
      page: string;
      clicks: number;
      impressions: number;
      ctr: number;
      AvgClickPosition: number;
      AvgImpressionPosition: number;
    }[];
    max_page: number;
  };
}
export interface BingOrganicKeywordData {
  message: string;
  migration: boolean;
  data: {
    keywords: {
      keyword: string;
      clicks: number;
      impressions: number;
      ctr: number;
      click_position: number;
      impression_position: number;

      AvgPosition: number;
      AvgClickPosition: number;
      AvgImpressionPosition: number;
    }[];
    max_page: number;
  };
}
