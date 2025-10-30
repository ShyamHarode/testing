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

export const bingMetricsAgencyRouter = createTRPCRouter({
  getBingData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        selected_client_id: z.string().optional(),
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
        const data = bingAdsAccountsResponse;

        let checkIfClientIdExistis = null;
        if (input.selected_client_id) {
          checkIfClientIdExistis = data.data?.find(
            (n) => n.client_id === input.selected_client_id,
          );
        }
        const list = data?.data?.map((item) => {
          return {
            label: item.account_name,
            value: item.account_id,
            client_id: item.client_id,
          };
        });

        return {
          list,
          customer_data: data?.data,
          migration: data.migration,
          message: data?.message,
          client_data: checkIfClientIdExistis,
          isMetricDataExist: checkIfClientIdExistis ? true : false,
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
        const data = await bingAdsAccountReports;

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
      const data = await bingAdsAccountReportsAdgroup;
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
      const data = await bingAdsAccountReportsCampaign;
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
      const data = await bingAdsAccountReportsSearch;
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
    agency: string;
    client_id: string | null;
    account_id: number;
    account_name: string;
    account_number: string;
    customer_id: number;
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
  averageCPA: number;
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
  averageCPM: number;
  ctr: number;
  returnOnAdSpend: number;
}

interface DeviceSegments {
  campaign_device: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  adgroup_device: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

interface Data {
  upper_table: UpperTableData;
  graph_data: GraphData[];
  device_segments: DeviceSegments;
}

interface Action {
  action_type: string;
  value: string;
  conversion_type: string;
  conversion_name: string;
  conversion_category: string;
  cost_per_action: string;
}

interface AdGroup {
  ad_group_id: string;
  ad_group_name: string;
  ad_group_metric_cost: number;
  ad_group_metric_revenue: number;
  ad_group_metric_conversions: number;
  ad_group_metric_clicks: number;
  ad_group_metric_impressions: number;
  ad_group_metric_returnOnAdSpend: number;
  ad_group_metric_ctr: number;
  ad_group_metric_conversion_rate: number;
  ad_group_metric_cost_per_conv: number;
  ad_group_metric_avg_cpm: number;
  ad_group_metric_avg_cpc: number;
  actions: Action[];
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
  ad_metric_cost: number;
  ad_metric_revenue: number;
  ad_metric_conversions: number;
  ad_metric_clicks: number;
  ad_metric_impressions: number;
  ad_metric_returnOnAdSpend: number;
  ad_metric_ctr: number;
  ad_metric_conversion_rate: number;
  ad_metric_cost_per_conv: number;
  ad_metric_avg_cpm: number;
  ad_metric_avg_cpc: number;
  actions: Action[];
}

interface AdSearchResponse {
  ad: AdSearch[];
  max_page: number;
}

interface BingAdsCampaign {
  campaign_id: string;
  campaign_name: string;
  campaign_metric_cost: number;
  campaign_metric_revenue: number;
  campaign_metric_conversions: number;
  campaign_metric_clicks: number;
  campaign_metric_impressions: number;
  campaign_metric_returnOnAdSpend: number;
  campaign_metric_ctr: number;
  campaign_metric_conversion_rate: number;
  campaign_metric_cost_per_conv: number;
  campaign_metric_avg_cpm: number;
  campaign_metric_avg_cpc: number;
  actions: Action[];
}

interface BingAdsCampaignResponse {
  campaign: BingAdsCampaign[];
  max_page: number;
}

// POST /api/agency/bing_ads/accounts

// Request Body:

// {
//     "agency_id":"agency_1",
//     "token":"eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoicW5OWFZEMW0xeWVWcGNiVGZVMmdma0U0cDdiYnJBVHk0aTFPZG5teExDZyIsInppcCI6IkRFRiJ9..GZQkaie34OtFDIWAOUNyFg.GmyWxd80kfmHrdgXf8hl31JY9ed0MtPNJLgKd4k5DEaOUm3gaKcFMc0M6lOc3fx4s5R85JZ6ulRz8wtyDnAWv0PStEWUg8bAy5UwcTyFY_14MgbowCaJKCcR6YcIxm9vC1YcYcqCLeZkZ9MxL4Wde9hXKDkc2o5jzrcpIQDC9U5QLzllhwRNIGugrV4Fe_uTST88Z85LU0ZkR0X1EI9QTvxpTvAl1FEJZvQ4eQmFJSoZzqaPIzCkUc8JN1KsaTvdM3ZrgieJEOxIr4FR5ksYY83YIhxSs0Rckjr9g69_Jbq2ynfq8UpXT-YJFcwM7oVepiocjZePiJgtjM8Nucan1jbaGpKSD9qvQ0UuvIbr8k0-MPhaVC3SOTARkHwoIiBlSfytWiBoUe2hmMdQf1jOA5AcR_ouvqXfDTmYU6lbC2AudVVZvzbC8esrq6HxRCs4x4K9d4kWYIQ0uDTrnDkAfnUI4u_IJ1qnOLu53GshB2HNYRz_4JurzAWRkbtUz2RSpQvm51sfGoc8gzlTa5I5Hp55eT7gZ5CXhe8RNJx8EMt4R45RnQyzqC3sTcXf8GQaF9NlwRWol5th9NUWwpdRYL7uGLVJFVydPeddeqj6HqFiYqagesAMQVsJZb2zrWdsLuG4VW9A-ixL33aRzhNp9ynVkmEfqbU2xAW0SOstIyxn4yJVppAWetDxByICqTGIOqmGHARdXAabGSGCX4qOz_aMucNxgAhlwQw1B5rALbRBO-iHSrprBVEm0OQS-EnPXLYiNr-u4Z3o5ZlpBAjB8gxmA_53749EDpkSBlz61CJq88vYtZ4KKAAxXF5Hfx5S_zYESu6pr2tlXWO_0-h3J9nzf3uhkDevHqL2ck7Aqe6dm6DjqwZOSWH9c8Iaoqfa_j7PMw7BI3kqyHbILZ_Ds0sq8yUMgS5NU5RmL-nHGMfrCBFYhVrx1Ouf13_9yGdJ0-aJi1-xYVeNTwjIIAYCpKyMf0BKFtZ1dYFz4e2a2R0t0YhKO6DkbZwhiYWfjNsIc7CPxwD0j5KuMD7QdSmDcveuAXFoRQsCEaR8gdBYYstlWyayQLqgv0fNMUPoajvD4pDqCY9rwbt9rnCEzvzv3Fmkgjt1vKwAHPwvPb6w4iQ3uk2VtQxvDfirVYMEZ598vf41BNFbxIRz_Qa4Z-LDHUgYegBgOycUDVDFLQdVQ3Edp8oaZrhbyM_LT0oX9nOXpQFUCwmZnrYGUI2z6hNW5pUE22MwZ14xy6UBoAqnMBGllU8u3JJGee33gqQT-8BD1ju_mYaGlPJa3HeUh7TQuaNm2BLuQNxVzLiItgZToyIn95dkT7I0e0WiiFwyH7f2pDZgIUcxgpO4D3ZqqS3lzKqCabuun2RLn6JEqz3TE5o_oUTsFiSWcfG-fJtD78RwsuP6p1rKAbSWS-gMSgPH2A.M-nkA2sX24b0ngymncqTqRwQx3i9gW9KqFYJJkHY0hs"
// }

const bingAdsAccountsResponse = {
  message: "Success",
  migration: false,
  data: [
    {
      agency: "0db7a9a1-8829-4b36-a2d1-2010e7d232ae",
      client_id: null,
      account_id: 141944976,
      account_name: "Drones Insurance",
      account_number: "F110BEDU",
      customer_id: 251959631,
      customer_name: "Xamtac Consulting",
      status: "Active",
      search_history: null,
    },
    {
      agency: "0db7a9a1-8829-4b36-a2d1-2010e7d232ae",
      client_id: "123",
      account_id: 141858569,
      account_name: "Xamtac Consulting",
      account_number: "F1102KFP",
      customer_id: 251959631,
      customer_name: "Xamtac Consulting",
      status: "Active",
      search_history: null,
    },
    {
      agency: "0db7a9a1-8829-4b36-a2d1-2010e7d232ae",
      client_id: null,
      account_id: 150346268,
      account_name: "Dermaesthetics",
      account_number: "F1191E35",
      customer_id: 250510814,
      customer_name: "Dermaesthetics",
      status: "Active",
      search_history: null,
    },
    {
      agency: "0db7a9a1-8829-4b36-a2d1-2010e7d232ae",
      client_id: null,
      account_id: 141872278,
      account_name: "Inspirit Learning, Inc.",
      account_number: "F110B9UK",
      customer_id: 251990845,
      customer_name: "Inspirit Learning, Inc.",
      status: "Active",
      search_history: null,
    },
  ],
};

// POST api/agency/bing_ads/account/reports

// Request Body:

// {
//     "token": "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoicW5OWFZEMW0xeWVWcGNiVGZVMmdma0U0cDdiYnJBVHk0aTFPZG5teExDZyIsInppcCI6IkRFRiJ9..GZQkaie34OtFDIWAOUNyFg.GmyWxd80kfmHrdgXf8hl31JY9ed0MtPNJLgKd4k5DEaOUm3gaKcFMc0M6lOc3fx4s5R85JZ6ulRz8wtyDnAWv0PStEWUg8bAy5UwcTyFY_14MgbowCaJKCcR6YcIxm9vC1YcYcqCLeZkZ9MxL4Wde9hXKDkc2o5jzrcpIQDC9U5QLzllhwRNIGugrV4Fe_uTST88Z85LU0ZkR0X1EI9QTvxpTvAl1FEJZvQ4eQmFJSoZzqaPIzCkUc8JN1KsaTvdM3ZrgieJEOxIr4FR5ksYY83YIhxSs0Rckjr9g69_Jbq2ynfq8UpXT-YJFcwM7oVepiocjZePiJgtjM8Nucan1jbaGpKSD9qvQ0UuvIbr8k0-MPhaVC3SOTARkHwoIiBlSfytWiBoUe2hmMdQf1jOA5AcR_ouvqXfDTmYU6lbC2AudVVZvzbC8esrq6HxRCs4x4K9d4kWYIQ0uDTrnDkAfnUI4u_IJ1qnOLu53GshB2HNYRz_4JurzAWRkbtUz2RSpQvm51sfGoc8gzlTa5I5Hp55eT7gZ5CXhe8RNJx8EMt4R45RnQyzqC3sTcXf8GQaF9NlwRWol5th9NUWwpdRYL7uGLVJFVydPeddeqj6HqFiYqagesAMQVsJZb2zrWdsLuG4VW9A-ixL33aRzhNp9ynVkmEfqbU2xAW0SOstIyxn4yJVppAWetDxByICqTGIOqmGHARdXAabGSGCX4qOz_aMucNxgAhlwQw1B5rALbRBO-iHSrprBVEm0OQS-EnPXLYiNr-u4Z3o5ZlpBAjB8gxmA_53749EDpkSBlz61CJq88vYtZ4KKAAxXF5Hfx5S_zYESu6pr2tlXWO_0-h3J9nzf3uhkDevHqL2ck7Aqe6dm6DjqwZOSWH9c8Iaoqfa_j7PMw7BI3kqyHbILZ_Ds0sq8yUMgS5NU5RmL-nHGMfrCBFYhVrx1Ouf13_9yGdJ0-aJi1-xYVeNTwjIIAYCpKyMf0BKFtZ1dYFz4e2a2R0t0YhKO6DkbZwhiYWfjNsIc7CPxwD0j5KuMD7QdSmDcveuAXFoRQsCEaR8gdBYYstlWyayQLqgv0fNMUPoajvD4pDqCY9rwbt9rnCEzvzv3Fmkgjt1vKwAHPwvPb6w4iQ3uk2VtQxvDfirVYMEZ598vf41BNFbxIRz_Qa4Z-LDHUgYegBgOycUDVDFLQdVQ3Edp8oaZrhbyM_LT0oX9nOXpQFUCwmZnrYGUI2z6hNW5pUE22MwZ14xy6UBoAqnMBGllU8u3JJGee33gqQT-8BD1ju_mYaGlPJa3HeUh7TQuaNm2BLuQNxVzLiItgZToyIn95dkT7I0e0WiiFwyH7f2pDZgIUcxgpO4D3ZqqS3lzKqCabuun2RLn6JEqz3TE5o_oUTsFiSWcfG-fJtD78RwsuP6p1rKAbSWS-gMSgPH2A.M-nkA2sX24b0ngymncqTqRwQx3i9gW9KqFYJJkHY0hs",
//     "agency_id": "agency_1",
//     "account_id": "150346268",
//     "from_date": "2023-01-01",
//     "to_date": "2025-09-30",
//     // "column": "",
//     // "sort": "",
//     "client_id": "1_client_1",
//     "entity": "AGENCY"
// }

const bingAdsAccountReports = {
  message: "Success",
  migration: false,
  data: {
    upper_table: {
      clicks: 2016.0,
      impressions: 154753.0,
      conversions: 5.0,
      cost: 2822.7400000000016,
      revenue: 0.0,
      ctr: 1.3027211104146608,
      returnOnAdSpend: 0.0,
      conversionRate: 0.248015873015873,
      costPerConversion: 564.5480000000003,
      averageCPC: 1.4001686507936515,
      averageCPM: 18.24029259529703,
      averageCPA: 564.5480000000003,
    },
    graph_data: [
      {
        clicks: 1240.0,
        impressions: 102033.0,
        conversions: 5.0,
        cost: 1819.369999999999,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "1",
        from_date: "2023-01-01",
        to_date: "2023-04-30",
        costPerConversion: 363.8739999999998,
        averageCPC: 1.467233870967741,
        averageCPM: 17.83119186929718,
        ctr: 1.215293091450805,
        returnOnAdSpend: 0.0,
      },
      {
        clicks: 776.0,
        impressions: 52720.0,
        conversions: 0.0,
        cost: 1003.3699999999999,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "2",
        from_date: "2023-05-01",
        to_date: "2023-08-28",
        costPerConversion: 0,
        averageCPC: 1.2930025773195875,
        averageCPM: 19.032056145675263,
        ctr: 1.4719271623672232,
        returnOnAdSpend: 0.0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        conversions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "3",
        from_date: "2023-08-29",
        to_date: "2023-12-26",
        costPerConversion: 0,
        averageCPC: 0,
        averageCPM: 0,
        ctr: 0,
        returnOnAdSpend: 0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        conversions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "4",
        from_date: "2023-12-27",
        to_date: "2024-04-24",
        costPerConversion: 0,
        averageCPC: 0,
        averageCPM: 0,
        ctr: 0,
        returnOnAdSpend: 0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        conversions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "5",
        from_date: "2024-04-25",
        to_date: "2024-08-22",
        costPerConversion: 0,
        averageCPC: 0,
        averageCPM: 0,
        ctr: 0,
        returnOnAdSpend: 0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        conversions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "6",
        from_date: "2024-08-23",
        to_date: "2024-12-20",
        costPerConversion: 0,
        averageCPC: 0,
        averageCPM: 0,
        ctr: 0,
        returnOnAdSpend: 0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        conversions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "7",
        from_date: "2024-12-21",
        to_date: "2025-04-19",
        costPerConversion: 0,
        averageCPC: 0,
        averageCPM: 0,
        ctr: 0,
        returnOnAdSpend: 0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        conversions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "8",
        from_date: "2025-04-20",
        to_date: "2025-08-17",
        costPerConversion: 0,
        averageCPC: 0,
        averageCPM: 0,
        ctr: 0,
        returnOnAdSpend: 0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        conversions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        category: "quarter_wise",
        quarter: "9",
        from_date: "2025-08-18",
        to_date: "2025-09-30",
        costPerConversion: 0,
        averageCPC: 0,
        averageCPM: 0,
        ctr: 0,
        returnOnAdSpend: 0,
      },
    ],
    device_segments: {
      campaign_device: {
        mobile: 189,
        desktop: 188,
        tablet: 184,
      },
      adgroup_device: {
        mobile: 188,
        desktop: 188,
        tablet: 182,
      },
    },
  },
};

// POST /api/agency/bing_ads/account/reports?data_type=campaign&page=1

// Response Body:

const bingAdsAccountReportsCampaign = {
  message: "Success",
  migration: false,
  data: {
    campaign: [
      {
        campaign_id: "429606028",
        campaign_name: "Spectre | Search | Branded",
        campaign_metric_cost: 2822.74,
        campaign_metric_revenue: 0.0,
        campaign_metric_conversions: 5.0,
        campaign_metric_clicks: 2016,
        campaign_metric_impressions: 154753,
        campaign_metric_returnOnAdSpend: 0.0,
        campaign_metric_ctr: 1.3027211104146608,
        campaign_metric_conversion_rate: 0.24801587301587302,
        campaign_metric_cost_per_conv: 564.548,
        campaign_metric_avg_cpm: 18.24029259529702,
        campaign_metric_avg_cpc: 1.4001686507936508,
        actions: [
          {
            action_type: "Destination URL",
            value: "2.0",
            conversion_type: "Destination URL",
            conversion_name: "Conversion",
            conversion_category: "Unknown",
            cost_per_action: "2822.74",
          },
        ],
      },
    ],
    max_page: 1,
  },
};

// POST /api/agency/bing_ads/account/reports?data_type=adgroup&page=1

// Response Body:

const bingAdsAccountReportsAdgroup = {
  message: "Success",
  migration: false,
  data: {
    adgroup: [
      {
        ad_group_id: "1312818372248752",
        ad_group_name: "Branded",
        ad_group_metric_cost: 2822.74,
        ad_group_metric_revenue: 0.0,
        ad_group_metric_conversions: 5.0,
        ad_group_metric_clicks: 2016,
        ad_group_metric_impressions: 154753,
        ad_group_metric_returnOnAdSpend: 0.0,
        ad_group_metric_ctr: 1.3027211104146608,
        ad_group_metric_conversion_rate: 0.24801587301587302,
        ad_group_metric_cost_per_conv: 564.548,
        ad_group_metric_avg_cpm: 18.24029259529702,
        ad_group_metric_avg_cpc: 1.4001686507936508,
        actions: [],
      },
    ],
    max_page: 1,
  },
};

// POST /api/agency/bing_ads/account/reports?data_type=search&page=1

// Response Body:

const bingAdsAccountReportsSearch = {
  message: "Success",
  migration: false,
  data: {
    ad: [
      {
        ad_id: "82051386784477",
        final_url:
          "https://dermaestheticsusa.com/?utm_source=bing&utm_medium=dermaestheticsusa&utm_campaign=Search&utm_id=123",
        short_headline: "",
        long_headline: "",
        first_ad_description:
          "Clinically Tested And Scientifically Proven Formulations. Achieve Healthier Skin Today",
        second_ad_description:
          "Korean-American Skin Care, Combining Western and Eastern Medicine For Healthier Skin!",
        ad_metric_cost: 1830.69,
        ad_metric_revenue: 0.0,
        ad_metric_conversions: 1.0,
        ad_metric_clicks: 1061,
        ad_metric_impressions: 68284,
        ad_metric_returnOnAdSpend: 0.0,
        ad_metric_ctr: 1.553804698025892,
        ad_metric_conversion_rate: 0.0942507068803016,
        ad_metric_cost_per_conv: 1830.69,
        ad_metric_avg_cpm: 26.80994083533478,
        ad_metric_avg_cpc: 1.7254382657869933,
        actions: [],
      },
      {
        ad_id: "82051386784478",
        final_url:
          "https://dermaestheticsusa.com/?utm_source=bing&utm_medium=dermaestheticsusa&utm_campaign=Search&utm_id=123",
        short_headline: "",
        long_headline: "",
        first_ad_description:
          "Clinically Tested And Scientifically Proven Formulations. Achieve Healthier Skin Today",
        second_ad_description:
          "Korean-American Skin Care, Combining Western and Eastern Medicine For Healthier Skin!",
        ad_metric_cost: 290.51,
        ad_metric_revenue: 0.0,
        ad_metric_conversions: 2.0,
        ad_metric_clicks: 367,
        ad_metric_impressions: 38461,
        ad_metric_returnOnAdSpend: 0.0,
        ad_metric_ctr: 0.9542133589870259,
        ad_metric_conversion_rate: 0.5449591280653951,
        ad_metric_cost_per_conv: 145.255,
        ad_metric_avg_cpm: 7.55336574712046,
        ad_metric_avg_cpc: 0.7915803814713896,
        actions: [],
      },
      {
        ad_id: "82051389403715",
        final_url:
          "https://dermaestheticsusa.com/?utm_source=bing&utm_medium=dermaestheticsusa&utm_campaign=Search&utm_id=123",
        short_headline: "",
        long_headline: "",
        first_ad_description: "",
        second_ad_description: "",
        ad_metric_cost: 701.54,
        ad_metric_revenue: 0.0,
        ad_metric_conversions: 2.0,
        ad_metric_clicks: 588,
        ad_metric_impressions: 48008,
        ad_metric_returnOnAdSpend: 0.0,
        ad_metric_ctr: 1.2247958673554407,
        ad_metric_conversion_rate: 0.3401360544217687,
        ad_metric_cost_per_conv: 350.77,
        ad_metric_avg_cpm: 14.612981169805032,
        ad_metric_avg_cpc: 1.1930952380952382,
        actions: [],
      },
    ],
    max_page: 1,
  },
};
