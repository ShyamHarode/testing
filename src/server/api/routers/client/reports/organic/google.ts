import { z } from "zod";
import getUserToken from "@/utils/getUserToken";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import * as Sentry from "@sentry/nextjs";
export const googleOrganicMetricsRouterClient = createTRPCRouter({
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
        const response = await fetch(
          env.BACKEND_API + "api/agency/google_search/sites",
          requestOptions,
        );
        const data: GoogleOrganicCustomerData = await response.json();

        return {
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
        token: z.string().optional(),
        site_url: z.string().optional(),
        from_date: z.string().optional(),
        to_date: z.string().optional(),
        client_id: z.string().optional(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { site_url, from_date, to_date, token } = input;
      // const requestOptionsInitial = {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: env.BACKEND_API_AUTHORIZATION,
      //   },
      //   body: JSON.stringify({
      //     token: token ?? "test",
      //     ...getUserToken(ctx, input.entity, input.client_id),
      //   }),
      // };
      // const allSites = await fetch(
      //   env.BACKEND_API + "api/agency/google_search/sites",
      //   requestOptionsInitial,
      // );
      // const allSitesData: GoogleOrganicCustomerData = await allSites.json();

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
        const data: GoogleOrganicCustomerMetricsData = await response.json();
        return data;
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
        const data = await response.json();
        return { data: data };
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
      const res = await fetch(
        `${env.BACKEND_API}api/agency/google_search/data?data_type=keywords&page=${input.page}`,
        requestOptions,
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error("API request failed");
      }
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
        site_url: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        column: z.string(),
        sort: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { site_url, from_date, to_date, column, sort } = input;
      const userToken = {
        token: "token",
        site_url: site_url,
        from_date: from_date,
        to_date: to_date,
        column: column,
        sort: sort,
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
      const res = await fetch(
        `${env.BACKEND_API}api/agency/google_search/data?data_type=keywords&page=${input.page}`,
        requestOptions,
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error("API request failed");
      }
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
      const res = await fetch(
        `${env.BACKEND_API}api/agency/google_search/data?data_type=pages&page=${input.page}`,
        requestOptions,
      );
      if (!res.ok) {
        throw new Error("API request failed");
      }
      const data = await res.json();
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
        site_url: z.any(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
        column: z.string(),
        sort: z.string(),
        entity: z.enum(["AGENCY", "CLIENT"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { site_url, from_date, to_date, column, sort } = input;
      const userToken = {
        token: "token",
        site_url: site_url,
        from_date: from_date,
        to_date: to_date,
        column: column,
        sort: sort,
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
      const res = await fetch(
        `${env.BACKEND_API}api/agency/google_search/data?data_type=pages&page=${input.page}`,
        requestOptions,
      );
      if (!res.ok) {
        throw new Error("API request failed");
      }
      const data = await res.json();
      return data.data as {
        search_history: any;
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
});

interface GoogleOrganicCustomerData {
  message: string;
  migration: boolean;
  data: {
    id: string;
    agency: string;
    client_id: string;
    created_date: string;
    siteurl: string;
    permissionLevel: string;
    search_history: {
      start_date: string;
      end_date: string;
    };
  };
}

export interface GoogleOrganicCustomerMetricsData {
  message: string;
  migration: boolean;
  data: {
    upper_table: {
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    };
    graph_data: {
      month: number;
      year: number;
      clicks: number;
      impressions: number;
      category: string;
    }[];
  };
}

const data = {
  message: "Success",
  migration: false,
  data: {
    upper_table: {
      clicks: 602,
      impressions: 210180,
      ctr: 0.29,
      position: 53.24334045990503,
    },
    graph_data: [
      {
        month: 2,
        year: 2024,
        clicks: 145,
        impressions: 33898,
        category: "month_wise",
      },
      {
        month: 3,
        year: 2024,
        clicks: 149,
        impressions: 36503,
        category: "month_wise",
      },
      {
        month: 4,
        year: 2024,
        clicks: 100,
        impressions: 45067,
        category: "month_wise",
      },
      {
        month: 5,
        year: 2024,
        clicks: 129,
        impressions: 67113,
        category: "month_wise",
      },
      {
        month: 6,
        year: 2024,
        clicks: 79,
        impressions: 27599,
        category: "month_wise",
      },
    ],
  },
};
