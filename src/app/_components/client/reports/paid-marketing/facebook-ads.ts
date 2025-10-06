import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import * as Sentry from "@sentry/nextjs";
import {
  type MetaAdSetMetricsType,
  type MetaCampaignMetricsType,
  type MetaAdsCustomerType,
  type MetaAdsMetricsType,
  MetaAdMetricsType,
} from "@/types";
import { TRPCClientError } from "@trpc/client";
import getUserToken from "@/utils/getUserToken";
import {
  metaAdsCustomerData,
  metaInsightsData,
  metaInsightsCampaignData,
  metaInsightsAdsetData,
  metaInsightsAdData,
} from "../test";

export const facebookMetricsClientRouter = createTRPCRouter({
  facebookClientData: protectedProcedure.query(async ({ ctx, input }) => {
    const userToken = {
      token: "facebook_ads",
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
      //   env.BACKEND_API + "api/agency/meta_ads/accounts",
      //   requestOptions,
      // );
      // const data: MetaAdsCustomerTypeClient = await response.json();
      const data = await metaAdsCustomerData;
      return data;
    } catch (error) {
      Sentry.captureException(error);
      throw new TRPCClientError(
        `"API request failed" ${JSON.stringify(error)}`,
      );
    }
  }),

  facebookMetricsSyncData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),

        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userToken = {
        token: "facebook_ads",
        account_id: input.account_id,
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/meta_ads/account/insights",
        //   requestOptions,
        // );
        // const data: MetaAdsMetricsType = await response.json();
        // if (data.error) {
        //   throw new TRPCClientError(data.error);
        // }
        const data = await metaInsightsData;
        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
  facebookMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),

        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: "facebook_ads",
        account_id: input.account_id,
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/meta_ads/account/insights",
        //   requestOptions,
        // );
        // const data: MetaAdsMetricsType = await response.json();
        const data = await metaInsightsData;

        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
  facebookAdSetMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: "facebook_ads",
        account_id: input.account_id,
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
        // const response = await fetch(
        //   env.BACKEND_API +
        //     `api/agency/meta_ads/account/insights?data_type=adset&page=${input.page}`,
        //   requestOptions,
        // );
        // const data: MetaAdSetMetricsType = await response.json();
        const data = await metaInsightsAdsetData;

        return { data: data.data };
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
  facebookAdMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: "facebook_ads",
        account_id: input.account_id,
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
        // const response = await fetch(
        //   env.BACKEND_API +
        //     `api/agency/meta_ads/account/insights?data_type=ad&page=${input.page}`,
        //   requestOptions,
        // );
        // const data: MetaAdMetricsType = await response.json();
        const data = await metaInsightsAdData;

        return { data: data.data };
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
  facebookCampaignsMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),

        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        token: "facebook_ads",
        account_id: input.account_id,
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
        //  const response = await fetch(
        //   env.BACKEND_API +
        //     `api/agency/meta_ads/account/insights?data_type=campaign&page=${input.page}`,
        //   requestOptions,
        // );
        // const data: MetaCampaignMetricsType = await response.json();
        const data = await metaInsightsCampaignData;

        return { data: data.data };
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
  facebookAdPreviewData: protectedProcedure
    .input(
      z.object({
        ad_id: z.string(),
        token: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify({
          ad_id: input.ad_id,
          token: input.token,
        }),
      };

      try {
        const response = await fetch(
          env.BACKEND_API + "api/agency/meta_ads/ad/preview",
          requestOptions,
        );
        const data = await response.json();

        if (data.error) {
          throw new TRPCClientError(data.error);
        }

        return { data };
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(
          `"API request failed" ${JSON.stringify(error)}`,
        );
      }
    }),
});

const t = {
  message: "Success",
  migration: false,
  data: {
    id: "e6f93606-c297-424e-b866-d01869306329",
    agency: "731bcc5b-5971-4fed-9f0c-50537bcaea3d",
    account_id: "act_1581518482661692",
    name: "Xamtac Marketing Dashboard",
    search_history: {
      start_date: "2023-12-01",
      end_date: "2024-06-15",
    },
    client_id: "clxf7xe2y0001d1yymo0kus22",
  },
};

export type MetaAdsCustomerTypeClient = {
  message: string;
  migration: boolean;
  data: {
    id: number;
    organization: number;
    account_id: string;
    name: string;
    account_status: string;
    amount_spent: string;
    meta_created_time: string;
    currency: string;
    owner: string;
    age: string;
    search_history: { start_date: string; end_date: string } | null;
  };
};

export interface ClientDataTypes {
  message: string;
  migration: boolean;
  data: {
    id: string;
    agency: string;
    account_id: string;
    name: string;
    search_history: {
      start_date: string;
      end_date: string;
    };
    client_id: string;
  };
}
