import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import * as Sentry from "@sentry/nextjs";
export const mailChimpMetricsClientRouter = createTRPCRouter({
  getMailchimpSearchHistory: protectedProcedure
    .input(
      z.object({
        api_key: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { api_key } = input;
      const userToken = {
        api_key: api_key,
        agency_id: ctx?.session?.user?.agency.id,
      };
      try {
        const requestOptions = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: env.BACKEND_API_AUTHORIZATION,
          },
        };
        const response = await fetch(
          `${env.BACKEND_API}api/agency/mailchimp/account/search_history=${userToken.agency_id}&api_key=${userToken.api_key}`,
          requestOptions,
        );
        const data = await response.json();
        if (!response.ok) {
          return { dataInserted: "FALSE", message: data };
        }
        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  createMailchimpEmailMetrics: protectedProcedure
    .input(
      z.object({
        api_key: z.string(),
        from_date: z.string(),
        to_date: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { from_date, to_date, api_key } = input;
      const userToken = {
        api_key: api_key,
        agency_id: ctx?.session?.user?.agency.id,
        from_date: from_date,
        to_date: to_date,
      };
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify(userToken),
      };
      const response = await fetch(
        `${env.BACKEND_API}api/agency/mailchimp/account/campaigns`,
        requestOptions,
      );
      const data = await response.json();
      if (!response.ok) {
        return { dataInserted: "FALSE", message: data };
      }
      if (data?.message == "Success") {
        return {
          customer_data: data?.data,
          dataInserted: "TRUE",
          message: data?.message,
        };
      }
      if (data?.migration) {
        return { message: "Migrating the data", dataInserted: "MIGRATING" };
      }
      if (data?.message === "Token Expired or Account Invalid") {
        return { dataInserted: "INVALID", message: data?.message };
      }
      if (data?.message === "Data Not Found") {
        return { dataInserted: "NO_DATA", message: data?.message };
      }
    }),
  syncMailchimpEmailMetrics: protectedProcedure
    .input(
      z.object({
        api_key: z.string(),
        from_date: z.string(),
        to_date: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { from_date, to_date, api_key } = input;
      const userToken = {
        api_key: api_key,
        agency_id: ctx?.session?.user?.agency.id,
        from_date: from_date,
        to_date: to_date,
      };
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify(userToken),
      };
      const response = await fetch(
        `${env.BACKEND_API}/api/mailchimp/syncData`,
        requestOptions,
      );
      const data = await response.json();
      if (!response.ok) {
        return { dataInserted: "FALSE", message: data };
      }
      if (data?.message == "Success") {
        return {
          data: data,
          dataInserted: "FALSE",
        };
      }
      if (data?.migration) {
        return { message: "Migrating the data", dataInserted: "MIGRATING" };
      }
      if (data?.message === "Token Expired or Account Invalid") {
        return { dataInserted: "INVALID", message: data?.message };
      }
      if (data?.message === "Data Not Found") {
        return { dataInserted: "NO_DATA", message: data?.message };
      }
    }),
  getMailchimpEmailMetrics: protectedProcedure
    .input(
      z.object({
        connection_id: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { from_date, to_date, connection_id, page } = input;
      const mailchimpConnection =
        await ctx.prisma.mailchimpConnection.findUnique({
          where: {
            id: connection_id,
          },
        });
      if (!mailchimpConnection) {
        throw new TRPCClientError("No connection found for this user.");
      }
      const userToken = {
        api_key: mailchimpConnection?.apiKey,
        agency_id: ctx?.session?.user?.agency.id,
        from_date: from_date,
        to_date: to_date,
        page: page || 1,
      };
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify(userToken),
      };

      const apiUrl = `${env.BACKEND_API}api/agency/mailchimp/account/campaigns`;
      const response = await fetch(apiUrl, requestOptions);
      const data = await response.json();
      if (!response.ok) {
        return { dataInserted: "FALSE", message: data };
      }
      if (data?.message == "Success") {
        return {
          data: data,
          dataInserted: "FALSE",
        };
      }
      if (data?.migration) {
        return { message: "Migrating the data", dataInserted: "MIGRATING" };
      }
      if (data?.message === "Token Expired or Account Invalid") {
        return { dataInserted: "INVALID", message: data?.message };
      }
    }),

  filterMailchimpEmailMetrics: protectedProcedure
    .input(
      z.object({
        api_key: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        search_text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { from_date, to_date, api_key, search_text } = input;
      const userToken = {
        agency_id: ctx?.session?.user?.agency.id,
        api_key: api_key,
        from_date: from_date,
        to_date: to_date,
        search_text: search_text,
      };
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.BACKEND_API_AUTHORIZATION,
        },
        body: JSON.stringify(userToken),
      };

      const response = await fetch(
        `${env.BACKEND_API}api/agency/mailchimp/account/campaigns/filter_search`,
        requestOptions,
      );
      const data = await response.json();

      if (!response.ok) {
        return { dataInserted: "FALSE", message: data };
      }
      if (data?.message == "Success") {
        return {
          data: data,
          dataInserted: "FALSE",
        };
      }
    }),
});
