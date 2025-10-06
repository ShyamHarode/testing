import { z } from "zod";
import getUserToken from "@/utils/getUserToken";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import * as Sentry from "@sentry/nextjs";
import {
  googleOrganicSearchData,
  googleOrganicPagesData,
  googleOrganicSiteData,
  googleOrganicKeywordsData,
} from "../paid-marketing/test";
export const googleOrganicMetricsRouterAgency = createTRPCRouter({
  getGoogleOrganicCustomerData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { token } = input;
      const userToken = {
        token: token,
        ...getUserToken(ctx),
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/google_search/sites",
        //   requestOptions,
        // );
        // const data: GoogleOrganicCustomerData = await response.json();
        const data = googleOrganicSiteData;
        const list = data?.data?.map((item) => {
          if (item.siteurl.startsWith("sc-domain:")) {
            // item.siteurl = item.siteurl.replace(/^sc-domain:/, "");
            return {
              label: item.siteurl.replace(/^sc-domain:/, ""),
              value: item.id,
            };
          }
          return {
            label: item.siteurl,
            value: item.id,
          };
        });
        return {
          list,
          ...data,
        };
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getGoogleOrganicCustomerMetricsData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        site_url: z.any(),
        from_date: z.string(),
        to_date: z.string(),
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
        //   env.BACKEND_API + "api/agency/google_search/data",
        //   requestOptions,
        // );
        // const data = await response.json();
        // if (!response.ok) {
        //   return { dataInserted: "FALSE", message: data };
        // }
        const data = await googleOrganicSearchData;

        if (data?.message === "Token Expired or Account Invalid") {
          return {
            dataInserted: "Invalid",
            message: data?.message,
            data: data,
          };
        }
        if (data?.migration) {
          return {
            message: "Migrating the data",
            dataInserted: "MIGRATING",
            data: data,
          };
        }
        if (data?.message == "Success") {
          return { data: data.data, dataInserted: "SUCCESS" };
        }
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  syncGoogleOrganicCustomerData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        site_url: z.any(),
        from_date: z.string(),
        to_date: z.string(),
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
        const response = await fetch(
          env.BACKEND_API + "api/agency/google_search/data",
          requestOptions,
        );
        const data = (await response.json()) as {
          message: string;
          error: string;
          migration: boolean;
          data: [{}];
        };

        return data;
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),

  getGoogleOrganicKeywords: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        token: z.string(),
        site_url: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
      // const res = await fetch(
      //   `${env.BACKEND_API}api/agency/google_search/data?data_type=keywords&page=${input.page}`,
      //   requestOptions,
      // );
      // const data = await res.json();

      // if (!res.ok) {
      //   throw new Error("API request failed");
      // }
      const data = await googleOrganicKeywordsData;
      return data.data as {
        keyword: {
          keyword: string;
          clicks: number;
          impressions: number;
          ctr: number;
          position: number;
        }[];
        max_page: number;
      };
    }),
  getGoogleOrganicKeywordsQuery: protectedProcedure
    .input(
      z.object({
        page: z.number(),
        token: z.string(),
        site_url: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        column: z.string(),
        sort: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { site_url, from_date, to_date, token, column, sort } = input;
      const userToken = {
        token: token,
        site_url: site_url,
        from_date: from_date,
        to_date: to_date,
        column: column,
        sort: sort,
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
      //   `${env.BACKEND_API}api/agency/google_search/data?data_type=keywords&page=${input.page}`,
      //   requestOptions,
      // );
      // const data = await res.json();

      // if (!res.ok) {
      //   throw new Error("API request failed");
      // }
      const data = await googleOrganicKeywordsData;
      return data.data as {
        keyword: {
          keyword: string;
          clicks: number;
          impressions: number;
          ctr: number;
          position: number;
        }[];
        max_page: number;
      };
    }),

  getGoogleOrganicPages: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        site_url: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
      // const res = await fetch(
      //   `${env.BACKEND_API}api/agency/google_search/data?data_type=pages&page=${input.page}`,
      //   requestOptions,
      // );
      // if (!res.ok) {
      //   throw new Error("API request failed");
      // }
      // const data = await res.json();
      const data = await googleOrganicPagesData;
      return data.data as {
        pages: {
          page: string;
          clicks: number;
          impressions: number;
          ctr: number;
          position: number;
        }[];
        max_page: number;
      };
    }),
  getGoogleOrganicPagesQuery: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        site_url: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
        column: z.string(),
        sort: z.string(),
        client_id: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { site_url, from_date, to_date, token, column, sort } = input;
      const userToken = {
        token: token,
        site_url: site_url,
        from_date: from_date,
        to_date: to_date,
        column: column,
        sort: sort,
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
      //   `${env.BACKEND_API}api/agency/google_search/data?data_type=pages&page=${input.page}`,
      //   requestOptions,
      // );
      // if (!res.ok) {
      //   throw new Error("API request failed");
      // }
      // const data = await res.json();
      const data = await googleOrganicPagesData;
      return data.data as {
        pages: {
          page: string;
          clicks: number;
          impressions: number;
          ctr: number;
          position: number;
        }[];
        max_page: number;
      };
    }),

  resyncGoogleConsoleCustomerData: protectedProcedure
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
          `${env.BACKEND_API}/api/gconsole/client/sync`,
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

  getSingleCustomerData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        site_url: z.any(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { token } = input;
      const userToken = {
        token: token,
        ...getUserToken(ctx),
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
        // const response = await fetch(
        //   env.BACKEND_API + "api/agency/google_search/sites",
        //   requestOptions,
        // );
        // const data: GoogleOrganicCustomerData = await response.json();
        const data = await googleOrganicSiteData;

        const getSingleCustomerData = data.data.filter(
          (item) => item.siteurl === input.site_url,
        );

        return getSingleCustomerData[0];
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
});

interface GoogleOrganicCustomerData {
  message: string;
  migration: boolean;
  data: {
    id: string;
    organization: string;
    created_date: string;
    client_id: string;
    siteurl: string;
    permissionLevel: string;
    search_history: {
      start_date: string;
      end_date: string;
    } | null;
  }[];
}

const data = {
  message: "Success",
  migration: false,
  data: [
    {
      id: "954ed531-6140-41dd-b134-fd6dfba2391a",
      organization: "5e1216b0-03bd-4725-a867-c31e38126727",
      created_date: "2024-03-08T15:33:23.497943Z",
      siteurl: "xamtac.com",
      permissionLevel: "siteOwner",
      search_history: {
        start_date: "2024-01-01",
        end_date: "2024-03-08",
      },
    },
  ],
};
