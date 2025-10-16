import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import getUserToken from "@/utils/getUserToken";
import { captureException } from "@sentry/nextjs";
import { LinkedinCreateProps, LinkedinMetricsDataProps } from "@/types/metrics";

export const linkedInAdsMetricsAgencyRouter = createTRPCRouter({
  linkedInAnalyticsGetCustomerData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        selected_client_id: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/linkedin_ads/accounts",
        //   requestOptions,
        // );
        // const data: LinkedinCreateProps = await response.json();
        const data: LinkedinCreateProps = await linkedInAdsAccountsData;

        if (data?.error) {
          throw new TRPCClientError(data.error);
        }
        let checkIfClientIdExists = null;
        if (input.selected_client_id) {
          checkIfClientIdExists = data.data?.find(
            (n) => n.client_id === input.selected_client_id
          );
        }
        const list = data?.data?.map((item) => {
          return {
            label: item.name,
            value: item.account_id,
            client_id: item.client_id,
          };
        });
        return {
          list,
          data,
          client_data: checkIfClientIdExists,
          isMetricDataExist: checkIfClientIdExists ? true : false,
        };
      } catch (error) {
        captureException(error);
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
      })
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
        // return data;
        return await linkedInAdsAnalyticsData;
      } catch (error) {
        captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),

  linkedInAnalyticsMetricsData: protectedProcedure
    .input(
      z.object({
        account_id: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        column: z.string(),
        sort: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        account_id: input.account_id,
        from_date: input.from_date,
        to_date: input.to_date,
        column: input.column,
        sort: input.sort,
        token: input.token,
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
        //   env.BACKEND_API + "api/agency/linkedin_ads/account/analytics",
        //   requestOptions,
        // );
        // const data: LinkedinMetricsDataProps = await response.json();
        // return data;
        return await linkedInAdsAnalyticsData;
      } catch (error) {
        captureException(error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  linkedInAnalyticsCreativeData: protectedProcedure
    .input(
      z.object({
        account_id: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
        page: z.number(),
        column: z.string(),
        sort: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        account_id: input.account_id,
        from_date: input.from_date,
        to_date: input.to_date,
        token: input.token,
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
      try {
        // const response = await fetch(
        //   env.BACKEND_API +
        //     `api/agency/linkedin_ads/account/analytics?data_type=creative&page=${input.page}`,
        //   requestOptions,
        // );
        // const data: LinkedinCreativeDataProps = await response.json();
        // return data;
        return await linkedInAnalyticsCreativesData;
      } catch (error) {
        captureException(error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  linkedInAnalyticsCampaignGroupsData: protectedProcedure
    .input(
      z.object({
        account_id: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
        client_id: z.string(),
        page: z.number(),
        column: z.string(),
        sort: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        account_id: input.account_id,
        from_date: input.from_date,
        to_date: input.to_date,
        token: input.token,
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
      try {
        // const response = await fetch(
        //   env.BACKEND_API +
        //     `api/agency/linkedin_ads/account/analytics?data_type=campaign_group&page=${input.page}`,
        //   requestOptions,
        // );
        // const data: LinkedinCampaignGroupDataProps = await response.json();
        // return data;
        return await linkedInAnalyticsCampaignGroupsData;
      } catch (error) {
        captureException(error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  linkedInAnalyticsCampaignsData: protectedProcedure
    .input(
      z.object({
        account_id: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
        client_id: z.string(),
        page: z.number(),
        column: z.string(),
        sort: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userToken = {
        account_id: input.account_id,
        from_date: input.from_date,
        to_date: input.to_date,
        token: input.token,
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
      try {
        // const response = await fetch(
        //   env.BACKEND_API +
        //     `api/agency/linkedin_ads/account/analytics?data_type=campaign&page=${input.page}`,
        //   requestOptions,
        // );
        // const data: LinkedinCampaignDataProps = await response.json();
        // return data;
        return await linkedInAnalyticsCampaignsData;
      } catch (error) {
        captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
});

// /api/agency/linkedin_ads/account/analytics?data_type=creative&page=1
const linkedInAnalyticsCreativesData = {
  message: "Success",
  migration: false,
  data: {
    creative: [
      {
        creative_id: 218756303,
        creative_name: "Marketing is a Science | Copy V1 | Xamtac Website",
        campaign_id: 193280096,
        creative_status: "ACTIVE",
        creative_content: {
          reference: "urn:li:share:6995484727319150593",
        },
        creative_is_serving: false,
        creative_metric_cost: 31.59113953,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 62,
        creative_metric_impressions: 3373,
        creative_metric_engagement: 62,
        creative_metric_video_views: 0,
        creative_metric_likes: 3,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 2,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 1.8381262970649275,
        creative_metric_avg_cpc: 0.5095345085483871,
        creative_metric_avg_cpm: 9.365887794248444,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 1.8381262970649275,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 222179576,
        creative_name: "SEO | Copy V1",
        campaign_id: 193278976,
        creative_status: "PAUSED",
        creative_content: {
          reference: "urn:li:share:6992980179983761408",
        },
        creative_is_serving: false,
        creative_metric_cost: 3.19888941,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 6,
        creative_metric_impressions: 280,
        creative_metric_engagement: 6,
        creative_metric_video_views: 0,
        creative_metric_likes: 0,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 0,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 2.142857142857143,
        creative_metric_avg_cpc: 0.533148235,
        creative_metric_avg_cpm: 11.424605035714286,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 2.142857142857143,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 223462206,
        creative_name: "Marketing is a Science | Copy V1 | Xamtac Website",
        campaign_id: 193278976,
        creative_status: "ACTIVE",
        creative_content: {
          reference: "urn:li:share:6995484727319150593",
        },
        creative_is_serving: false,
        creative_metric_cost: 5.75273311,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 9,
        creative_metric_impressions: 226,
        creative_metric_engagement: 9,
        creative_metric_video_views: 0,
        creative_metric_likes: 0,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 0,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 3.982300884955752,
        creative_metric_avg_cpc: 0.6391925677777778,
        creative_metric_avg_cpm: 25.454571283185842,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 3.982300884955752,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 223462296,
        creative_name: "Build your Brand | Copy V1",
        campaign_id: 193278976,
        creative_status: "PAUSED",
        creative_content: {
          reference: "urn:li:share:6995485015258132480",
        },
        creative_is_serving: false,
        creative_metric_cost: 4.19585976,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 5,
        creative_metric_impressions: 279,
        creative_metric_engagement: 5,
        creative_metric_video_views: 0,
        creative_metric_likes: 0,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 0,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 1.7921146953405016,
        creative_metric_avg_cpc: 0.839171952,
        creative_metric_avg_cpm: 15.038923870967743,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 1.7921146953405016,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 223462386,
        creative_name: "Email | Copy V1",
        campaign_id: 193278976,
        creative_status: "PAUSED",
        creative_content: {
          reference: "urn:li:share:6995485255742734336",
        },
        creative_is_serving: false,
        creative_metric_cost: 2.25251771,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 4,
        creative_metric_impressions: 185,
        creative_metric_engagement: 4,
        creative_metric_video_views: 0,
        creative_metric_likes: 0,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 0,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 2.1621621621621623,
        creative_metric_avg_cpc: 0.5631294275,
        creative_metric_avg_cpm: 12.175771405405404,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 2.1621621621621623,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 223488066,
        creative_name: "Blog 1 | Copy V2",
        campaign_id: 193280096,
        creative_status: "PAUSED",
        creative_content: {
          reference: "urn:li:share:6995490069339942912",
        },
        creative_is_serving: false,
        creative_metric_cost: 17.19458861,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 33,
        creative_metric_impressions: 2663,
        creative_metric_engagement: 33,
        creative_metric_video_views: 0,
        creative_metric_likes: 0,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 2,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 1.2392039053698836,
        creative_metric_avg_cpc: 0.5210481396969697,
        creative_metric_avg_cpm: 6.456848895981976,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 1.2392039053698836,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 225079036,
        creative_name: "Blog 1 | Copy V3",
        campaign_id: 193280096,
        creative_status: "ACTIVE",
        creative_content: {
          reference: "urn:li:share:6998382858310479872",
        },
        creative_is_serving: false,
        creative_metric_cost: 8.84563177,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 3,
        creative_metric_impressions: 270,
        creative_metric_engagement: 3,
        creative_metric_video_views: 0,
        creative_metric_likes: 0,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 0,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 1.1111111111111112,
        creative_metric_avg_cpc: 2.9485439233333337,
        creative_metric_avg_cpm: 32.76159914814815,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 1.1111111111111112,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 225079296,
        creative_name: "Blog 2 | Copy V3",
        campaign_id: 193280096,
        creative_status: "ACTIVE",
        creative_content: {
          reference: "urn:li:share:6998383367448645632",
        },
        creative_is_serving: false,
        creative_metric_cost: 8.36363596,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 4,
        creative_metric_impressions: 250,
        creative_metric_engagement: 4,
        creative_metric_video_views: 0,
        creative_metric_likes: 1,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 1,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 1.6,
        creative_metric_avg_cpc: 2.09090899,
        creative_metric_avg_cpm: 33.45454384,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 1.6,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 225082696,
        creative_name: "Carousel Ad | Copy V3 | Own LinkedIn Page",
        campaign_id: 194220076,
        creative_status: "ACTIVE",
        creative_content: {
          reference: "urn:li:share:6998391917189226496",
        },
        creative_is_serving: false,
        creative_metric_cost: 10.55,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 1,
        creative_metric_impressions: 381,
        creative_metric_engagement: 1,
        creative_metric_video_views: 0,
        creative_metric_likes: 0,
        creative_metric_comments: 0,
        creative_metric_shares: 0,
        creative_metric_follows: 0,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 0.26246719160104987,
        creative_metric_avg_cpc: 10.55,
        creative_metric_avg_cpm: 27.690288713910764,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 0.26246719160104987,
        creative_metric_roas: 0.0,
      },
      {
        creative_id: 233586306,
        creative_name: "Creative 233586306",
        campaign_id: 196294226,
        creative_status: "REMOVED",
        creative_content: {
          reference: "urn:li:share:7014326379634724864",
        },
        creative_is_serving: false,
        creative_metric_cost: 9.55,
        creative_metric_conversions: 0.0,
        creative_metric_clicks: 25,
        creative_metric_impressions: 2987,
        creative_metric_engagement: 129,
        creative_metric_video_views: 0,
        creative_metric_likes: 6,
        creative_metric_comments: 1,
        creative_metric_shares: 0,
        creative_metric_follows: 0,
        creative_metric_external_conversions: 0,
        creative_metric_conversion_value: 0.0,
        creative_metric_ctr: 0.8369601606963508,
        creative_metric_avg_cpc: 0.382,
        creative_metric_avg_cpm: 3.1971878138600607,
        creative_metric_conversion_rate: 0.0,
        creative_metric_cost_per_conv: 0,
        creative_metric_engagement_rate: 4.318714429193171,
        creative_metric_roas: 0.0,
      },
    ],
    max_page: 2,
  },
};

// POST /api/agency/linkedin_ads/account/analytics?data_type=campaign&page=1

const linkedInAnalyticsCampaignsData = {
  message: "Success",
  migration: false,
  data: {
    campaign: [
      {
        campaign_id: 198234226,
        campaign_name: "Dashboard SaaS | Prospecting | Research | Updated",
        campaign_group_id: 625389816,
        campaign_status: "ACTIVE",
        campaign_type: "SPONSORED_UPDATES",
        campaign_metric_cost: 19.85,
        campaign_metric_conversions: 0.0,
        campaign_metric_clicks: 1,
        campaign_metric_impressions: 826,
        campaign_metric_engagement: 6,
        campaign_metric_video_views: 0,
        campaign_metric_likes: 0,
        campaign_metric_comments: 0,
        campaign_metric_shares: 0,
        campaign_metric_follows: 0,
        campaign_metric_external_conversions: 0,
        campaign_metric_conversion_value: 0.0,
        campaign_metric_ctr: 0.12106537530266344,
        campaign_metric_avg_cpc: 19.85,
        campaign_metric_avg_cpm: 24.031476997578693,
        campaign_metric_conversion_rate: 0.0,
        campaign_metric_cost_per_conv: 0,
        campaign_metric_engagement_rate: 0.7263922518159807,
        campaign_metric_roas: 0.0,
      },
      {
        campaign_id: 198369046,
        campaign_name: "Prospecting | Research | Video",
        campaign_group_id: 625389816,
        campaign_status: "ACTIVE",
        campaign_type: "SPONSORED_UPDATES",
        campaign_metric_cost: 10.79,
        campaign_metric_conversions: 0.0,
        campaign_metric_clicks: 1,
        campaign_metric_impressions: 346,
        campaign_metric_engagement: 4,
        campaign_metric_video_views: 86,
        campaign_metric_likes: 1,
        campaign_metric_comments: 0,
        campaign_metric_shares: 0,
        campaign_metric_follows: 0,
        campaign_metric_external_conversions: 0,
        campaign_metric_conversion_value: 0.0,
        campaign_metric_ctr: 0.2890173410404624,
        campaign_metric_avg_cpc: 10.79,
        campaign_metric_avg_cpm: 31.184971098265894,
        campaign_metric_conversion_rate: 0.0,
        campaign_metric_cost_per_conv: 0,
        campaign_metric_engagement_rate: 1.1560693641618496,
        campaign_metric_roas: 0.0,
      },
      {
        campaign_id: 198369666,
        campaign_name: "Website conversions - Feb 7, 2023",
        campaign_group_id: 625389816,
        campaign_status: "DRAFT",
        campaign_type: "SPONSORED_INMAILS",
        campaign_metric_cost: 0.0,
        campaign_metric_conversions: 0.0,
        campaign_metric_clicks: 0,
        campaign_metric_impressions: 0,
        campaign_metric_engagement: 0,
        campaign_metric_video_views: 0,
        campaign_metric_likes: 0,
        campaign_metric_comments: 0,
        campaign_metric_shares: 0,
        campaign_metric_follows: 0,
        campaign_metric_external_conversions: 0,
        campaign_metric_conversion_value: 0.0,
        campaign_metric_ctr: 0,
        campaign_metric_avg_cpc: 0,
        campaign_metric_avg_cpm: 0,
        campaign_metric_conversion_rate: 0,
        campaign_metric_cost_per_conv: 0,
        campaign_metric_engagement_rate: 0,
        campaign_metric_roas: 0,
      },
      {
        campaign_id: 203773536,
        campaign_name: "Dashboard Prospecting",
        campaign_group_id: 625389816,
        campaign_status: "DRAFT",
        campaign_type: "SPONSORED_UPDATES",
        campaign_metric_cost: 0.0,
        campaign_metric_conversions: 0.0,
        campaign_metric_clicks: 0,
        campaign_metric_impressions: 0,
        campaign_metric_engagement: 0,
        campaign_metric_video_views: 0,
        campaign_metric_likes: 0,
        campaign_metric_comments: 0,
        campaign_metric_shares: 0,
        campaign_metric_follows: 0,
        campaign_metric_external_conversions: 0,
        campaign_metric_conversion_value: 0.0,
        campaign_metric_ctr: 0,
        campaign_metric_avg_cpc: 0,
        campaign_metric_avg_cpm: 0,
        campaign_metric_conversion_rate: 0,
        campaign_metric_cost_per_conv: 0,
        campaign_metric_engagement_rate: 0,
        campaign_metric_roas: 0,
      },
      {
        campaign_id: 193280096,
        campaign_name: "Specific Companies Test",
        campaign_group_id: 625393616,
        campaign_status: "ACTIVE",
        campaign_type: "SPONSORED_UPDATES",
        campaign_metric_cost: 83.18,
        campaign_metric_conversions: 0.0,
        campaign_metric_clicks: 119,
        campaign_metric_impressions: 8033,
        campaign_metric_engagement: 119,
        campaign_metric_video_views: 0,
        campaign_metric_likes: 6,
        campaign_metric_comments: 0,
        campaign_metric_shares: 0,
        campaign_metric_follows: 5,
        campaign_metric_external_conversions: 0,
        campaign_metric_conversion_value: 0.0,
        campaign_metric_ctr: 1.4813892692642847,
        campaign_metric_avg_cpc: 0.6989915966386555,
        campaign_metric_avg_cpm: 10.354786505664137,
        campaign_metric_conversion_rate: 0.0,
        campaign_metric_cost_per_conv: 0,
        campaign_metric_engagement_rate: 1.4813892692642847,
        campaign_metric_roas: 0.0,
      },
      {
        campaign_id: 196294226,
        campaign_name: "Job Post PPC | Research | Prospecting",
        campaign_group_id: 626635696,
        campaign_status: "ACTIVE",
        campaign_type: "SPONSORED_UPDATES",
        campaign_metric_cost: 39.55,
        campaign_metric_conversions: 0.0,
        campaign_metric_clicks: 28,
        campaign_metric_impressions: 4420,
        campaign_metric_engagement: 145,
        campaign_metric_video_views: 0,
        campaign_metric_likes: 6,
        campaign_metric_comments: 1,
        campaign_metric_shares: 0,
        campaign_metric_follows: 0,
        campaign_metric_external_conversions: 0,
        campaign_metric_conversion_value: 0.0,
        campaign_metric_ctr: 0.6334841628959276,
        campaign_metric_avg_cpc: 1.4124999999999999,
        campaign_metric_avg_cpm: 8.947963800904978,
        campaign_metric_conversion_rate: 0.0,
        campaign_metric_cost_per_conv: 0,
        campaign_metric_engagement_rate: 3.2805429864253397,
        campaign_metric_roas: 0.0,
      },
      {
        campaign_id: 206790786,
        campaign_name: "Brand awareness - Jun 29, 2023",
        campaign_group_id: 646451476,
        campaign_status: "DRAFT",
        campaign_type: "SPONSORED_UPDATES",
        campaign_metric_cost: 0.0,
        campaign_metric_conversions: 0.0,
        campaign_metric_clicks: 0,
        campaign_metric_impressions: 0,
        campaign_metric_engagement: 0,
        campaign_metric_video_views: 0,
        campaign_metric_likes: 0,
        campaign_metric_comments: 0,
        campaign_metric_shares: 0,
        campaign_metric_follows: 0,
        campaign_metric_external_conversions: 0,
        campaign_metric_conversion_value: 0.0,
        campaign_metric_ctr: 0,
        campaign_metric_avg_cpc: 0,
        campaign_metric_avg_cpm: 0,
        campaign_metric_conversion_rate: 0,
        campaign_metric_cost_per_conv: 0,
        campaign_metric_engagement_rate: 0,
        campaign_metric_roas: 0,
      },
    ],
    max_page: 1,
  },
};

// POST /api/agency/linkedin_ads/account/analytics?data_type=campaign_group&page=1
const linkedInAnalyticsCampaignGroupsData = {
  message: "Success",
  migration: false,
  data: {
    campaign_group: [
      {
        campaign_group_id: 625460876,
        campaign_group_name: "DataTech Labs Campaign Group",
        campaign_group_status: "DRAFT",
        campaign_group_metric_cost: 0.0,
        campaign_group_metric_conversions: 0.0,
        campaign_group_metric_clicks: 0,
        campaign_group_metric_impressions: 0,
        campaign_group_metric_engagement: 0,
        campaign_group_metric_video_views: 0,
        campaign_group_metric_likes: 0,
        campaign_group_metric_comments: 0,
        campaign_group_metric_shares: 0,
        campaign_group_metric_follows: 0,
        campaign_group_metric_external_conversions: 0,
        campaign_group_metric_conversion_value: 0.0,
        campaign_group_metric_ctr: 0,
        campaign_group_metric_avg_cpc: 0,
        campaign_group_metric_avg_cpm: 0,
        campaign_group_metric_conversion_rate: 0,
        campaign_group_metric_cost_per_conv: 0,
        campaign_group_metric_engagement_rate: 0,
        campaign_group_metric_roas: 0,
      },
      {
        campaign_group_id: 646402206,
        campaign_group_name: "Do Not Use - Tests",
        campaign_group_status: "ACTIVE",
        campaign_group_metric_cost: 0.0,
        campaign_group_metric_conversions: 0.0,
        campaign_group_metric_clicks: 0,
        campaign_group_metric_impressions: 0,
        campaign_group_metric_engagement: 0,
        campaign_group_metric_video_views: 0,
        campaign_group_metric_likes: 0,
        campaign_group_metric_comments: 0,
        campaign_group_metric_shares: 0,
        campaign_group_metric_follows: 0,
        campaign_group_metric_external_conversions: 0,
        campaign_group_metric_conversion_value: 0.0,
        campaign_group_metric_ctr: 0,
        campaign_group_metric_avg_cpc: 0,
        campaign_group_metric_avg_cpm: 0,
        campaign_group_metric_conversion_rate: 0,
        campaign_group_metric_cost_per_conv: 0,
        campaign_group_metric_engagement_rate: 0,
        campaign_group_metric_roas: 0,
      },
      {
        campaign_group_id: 646451476,
        campaign_group_name: "test-Don't Use",
        campaign_group_status: "ACTIVE",
        campaign_group_metric_cost: 0.0,
        campaign_group_metric_conversions: 0.0,
        campaign_group_metric_clicks: 0,
        campaign_group_metric_impressions: 0,
        campaign_group_metric_engagement: 0,
        campaign_group_metric_video_views: 0,
        campaign_group_metric_likes: 0,
        campaign_group_metric_comments: 0,
        campaign_group_metric_shares: 0,
        campaign_group_metric_follows: 0,
        campaign_group_metric_external_conversions: 0,
        campaign_group_metric_conversion_value: 0.0,
        campaign_group_metric_ctr: 0,
        campaign_group_metric_avg_cpc: 0,
        campaign_group_metric_avg_cpm: 0,
        campaign_group_metric_conversion_rate: 0,
        campaign_group_metric_cost_per_conv: 0,
        campaign_group_metric_engagement_rate: 0,
        campaign_group_metric_roas: 0,
      },
      {
        campaign_group_id: 646470536,
        campaign_group_name: "Test Do Not Use - Website Visits",
        campaign_group_status: "ACTIVE",
        campaign_group_metric_cost: 0.0,
        campaign_group_metric_conversions: 0.0,
        campaign_group_metric_clicks: 0,
        campaign_group_metric_impressions: 0,
        campaign_group_metric_engagement: 0,
        campaign_group_metric_video_views: 0,
        campaign_group_metric_likes: 0,
        campaign_group_metric_comments: 0,
        campaign_group_metric_shares: 0,
        campaign_group_metric_follows: 0,
        campaign_group_metric_external_conversions: 0,
        campaign_group_metric_conversion_value: 0.0,
        campaign_group_metric_ctr: 0,
        campaign_group_metric_avg_cpc: 0,
        campaign_group_metric_avg_cpm: 0,
        campaign_group_metric_conversion_rate: 0,
        campaign_group_metric_cost_per_conv: 0,
        campaign_group_metric_engagement_rate: 0,
        campaign_group_metric_roas: 0,
      },
    ],
    max_page: 1,
  },
};

// POST /api/agency/linkedin_ads/account/analytics

// Request Body:

// {
//     "agency_id":"agency_1",
//     "client_id":"1_client_1",
//     "account_id":"509886933",
//     "token":"AQUZ2IiqXQWMZFR78lNZwSi6-CcSTcQxMxeivC3l0aSwmGWcyN-H2bWbhRaane263WYXgZL0KgmLkVPAYZ-uJX0_usANAMPqB9qqjjQEyMlZgXuIY7H3FXkSd0jGH1tDkkM7F6TkUs-EFGAqmA8R6NGucftA38bcvHzFnretWjXQAg5UrUjRsSYOJVBSzvNKjiqPwKpTPiQfcfBjIKpuuWUXxUF_DfkoxxlFqj0Q-uTQTgM11DygThf3t1XcpeUrsnO6Bq4Rp8dnuE_DLm1O2FrTSMtyhp7tAC_nGsLB0wjCf49ouY-7Xe4_RdbtBxhTomu8drw06bqq6PMPLZecLuhzRzQTOA",
//     "from_date":"2022-01-01",
//     "to_date":"2023-10-09",
//     "entity":"AGENCY"
//     // "column":"",
//     // "sort":"asc"
// }

const linkedInAdsAnalyticsData = {
  message: "Success",
  migration: false,
  data: {
    ad_analytics_data: [
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 85,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "45.4000000000",
        costInUsd: "45.4000000000",
        dateRange: {
          end: {
            day: 10,
            year: 2022,
            month: 11,
          },
          start: {
            day: 10,
            year: 2022,
            month: 11,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 3,
        impressions: 4804,
        likes: 2,
        linkedin_created_date: "2022-11-10",
        sends: 0,
        shares: 0,
        totalEngagements: 85,
        videoViews: 0,
        viralImpressions: 1,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 41,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "18.5100000000",
        costInUsd: "18.5100000000",
        dateRange: {
          end: {
            day: 11,
            year: 2022,
            month: 11,
          },
          start: {
            day: 11,
            year: 2022,
            month: 11,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 0,
        impressions: 3146,
        likes: 0,
        linkedin_created_date: "2022-11-11",
        sends: 0,
        shares: 0,
        totalEngagements: 41,
        videoViews: 0,
        viralImpressions: 0,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 18,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "45.2200000000",
        costInUsd: "45.2200000000",
        dateRange: {
          end: {
            day: 1,
            year: 2022,
            month: 12,
          },
          start: {
            day: 1,
            year: 2022,
            month: 12,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 2,
        impressions: 1434,
        likes: 4,
        linkedin_created_date: "2022-12-01",
        sends: 0,
        shares: 0,
        totalEngagements: 18,
        videoViews: 0,
        viralImpressions: 0,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 25,
        comments: 1,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "9.5500000000",
        costInUsd: "9.5500000000",
        dateRange: {
          end: {
            day: 29,
            year: 2022,
            month: 12,
          },
          start: {
            day: 29,
            year: 2022,
            month: 12,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 0,
        impressions: 2987,
        likes: 6,
        linkedin_created_date: "2022-12-29",
        sends: 0,
        shares: 0,
        totalEngagements: 126,
        videoViews: 0,
        viralImpressions: 3,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 0,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "0.0000000000",
        costInUsd: "0.0000000000",
        dateRange: {
          end: {
            day: 30,
            year: 2022,
            month: 12,
          },
          start: {
            day: 30,
            year: 2022,
            month: 12,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 0,
        impressions: 0,
        likes: 0,
        linkedin_created_date: "2022-12-30",
        sends: 0,
        shares: 0,
        totalEngagements: 3,
        videoViews: 0,
        viralImpressions: 3,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 0,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "0.0000000000",
        costInUsd: "0.0000000000",
        dateRange: {
          end: {
            day: 6,
            year: 2023,
            month: 1,
          },
          start: {
            day: 6,
            year: 2023,
            month: 1,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 0,
        impressions: 0,
        likes: 0,
        linkedin_created_date: "2023-01-06",
        sends: 0,
        shares: 0,
        totalEngagements: 0,
        videoViews: 0,
        viralImpressions: 1,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 0,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "0.0000000000",
        costInUsd: "0.0000000000",
        dateRange: {
          end: {
            day: 8,
            year: 2023,
            month: 1,
          },
          start: {
            day: 8,
            year: 2023,
            month: 1,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 0,
        impressions: 0,
        likes: 0,
        linkedin_created_date: "2023-01-08",
        sends: 0,
        shares: 0,
        totalEngagements: 0,
        videoViews: 0,
        viralImpressions: 1,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 0,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "0.0000000000",
        costInUsd: "0.0000000000",
        dateRange: {
          end: {
            day: 11,
            year: 2023,
            month: 1,
          },
          start: {
            day: 11,
            year: 2023,
            month: 1,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 0,
        impressions: 0,
        likes: 0,
        linkedin_created_date: "2023-01-11",
        sends: 0,
        shares: 0,
        totalEngagements: 0,
        videoViews: 0,
        viralImpressions: 1,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 2,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "30.6400000000",
        costInUsd: "30.6400000000",
        dateRange: {
          end: {
            day: 8,
            year: 2023,
            month: 2,
          },
          start: {
            day: 8,
            year: 2023,
            month: 2,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 0,
        impressions: 1172,
        likes: 1,
        linkedin_created_date: "2023-02-08",
        sends: 0,
        shares: 0,
        totalEngagements: 10,
        videoViews: 86,
        viralImpressions: 0,
        viralTotalEngagements: 0,
      },
      {
        account: "ef0c3b16-6127-41c3-879d-d9a97bd85efe",
        approximateUniqueImpressions: null,
        clicks: 3,
        comments: 0,
        conversionValueInLocalCurrency: null,
        costInLocalCurrency: "30.0000000000",
        costInUsd: "30.0000000000",
        dateRange: {
          end: {
            day: 15,
            year: 2023,
            month: 2,
          },
          start: {
            day: 15,
            year: 2023,
            month: 2,
          },
        },
        externalWebsiteConversions: 0,
        externalWebsitePostClickConversions: null,
        externalWebsitePostViewConversions: null,
        follows: 0,
        impressions: 1433,
        likes: 0,
        linkedin_created_date: "2023-02-15",
        sends: 0,
        shares: 0,
        totalEngagements: 16,
        videoViews: 0,
        viralImpressions: 0,
        viralTotalEngagements: 0,
      },
    ],
    upper_table_data: {
      clicks: 174.0,
      impressions: 14976.0,
      cost: 179.32,
      cost_local: 179.32,
      revenue: 0.0,
      conversions: 0.0,
      ctr: 1.1618589743589745,
      returnOnAdSpend: 0.0,
      conversionRate: 0.0,
      costPerConversion: 0,
      averageCPC: 1.0305747126436782,
      averageCPM: 11.973824786324785,
    },
    graph_data: [
      {
        clicks: 0.0,
        impressions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        conversions: 0.0,
        category: "quarter_wise",
        quarter: "1",
        from_date: "2022-01-01",
        to_date: "2022-04-30",
        costPerConversion: 0,
        averageCPC: 0,
        ctr: 0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        conversions: 0.0,
        category: "quarter_wise",
        quarter: "2",
        from_date: "2022-05-01",
        to_date: "2022-08-28",
        costPerConversion: 0,
        averageCPC: 0,
        ctr: 0,
      },
      {
        clicks: 144.0,
        impressions: 9384.0,
        cost: 109.13,
        revenue: 0.0,
        conversions: 0.0,
        category: "quarter_wise",
        quarter: "3",
        from_date: "2022-08-29",
        to_date: "2022-12-26",
        costPerConversion: 0,
        averageCPC: 0.7578472222222222,
        ctr: 1.5345268542199488,
      },
      {
        clicks: 30.0,
        impressions: 5592.0,
        cost: 70.19,
        revenue: 0.0,
        conversions: 0.0,
        category: "quarter_wise",
        quarter: "4",
        from_date: "2022-12-27",
        to_date: "2023-04-25",
        costPerConversion: 0,
        averageCPC: 2.3396666666666666,
        ctr: 0.5364806866952789,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        conversions: 0.0,
        category: "quarter_wise",
        quarter: "5",
        from_date: "2023-04-26",
        to_date: "2023-08-23",
        costPerConversion: 0,
        averageCPC: 0,
        ctr: 0,
      },
      {
        clicks: 0.0,
        impressions: 0.0,
        cost: 0.0,
        revenue: 0.0,
        conversions: 0.0,
        category: "quarter_wise",
        quarter: "6",
        from_date: "2023-08-24",
        to_date: "2023-10-09",
        costPerConversion: 0,
        averageCPC: 0,
        ctr: 0,
      },
    ],
    current_page: 1,
    max_page: 1,
  },
};

// POST /api/agency/linkedin_ads/accounts

// Request Body:
// {
//     "agency_id":"agency_1",
//     "token":"AQUZ2IiqXQWMZFR78lNZwSi6-CcSTcQxMxeivC3l0aSwmGWcyN-H2bWbhRaane263WYXgZL0KgmLkVPAYZ-uJX0_usANAMPqB9qqjjQEyMlZgXuIY7H3FXkSd0jGH1tDkkM7F6TkUs-EFGAqmA8R6NGucftA38bcvHzFnretWjXQAg5UrUjRsSYOJVBSzvNKjiqPwKpTPiQfcfBjIKpuuWUXxUF_DfkoxxlFqj0Q-uTQTgM11DygThf3t1XcpeUrsnO6Bq4Rp8dnuE_DLm1O2FrTSMtyhp7tAC_nGsLB0wjCf49ouY-7Xe4_RdbtBxhTomu8drw06bqq6PMPLZecLuhzRzQTOA"
// }

const linkedInAdsAccountsData = {
  message: "Success",
  migration: false,
  data: [
    {
      agency: "309e02b1-a312-4f31-88fb-8247380b2026",
      client_id: null,
      account_id: 509886933,
      currency: "USD",
      name: "Xamtac Consulting ",
      reference: "urn:li:organization:82838675",
      status: "ACTIVE",
      type: "BUSINESS",
      test: false,
      search_history: null,
    },
    // {
    //   agency: "309e02b1-a312-4f31-88fb-8247380b2026",
    //   client_id: "1_client_1",
    //   account_id: 509886933,
    //   currency: "USD",
    //   name: "Xamtac Consulting ",
    //   reference: "urn:li:organization:82838675",
    //   status: "ACTIVE",
    //   type: "BUSINESS",
    //   test: false,
    //   search_history: {
    //     start_date: "2022-01-01",
    //     end_date: "2025-10-09",
    //   },
    // },
  ],
};
