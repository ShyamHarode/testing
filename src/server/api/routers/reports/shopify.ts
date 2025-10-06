import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
import * as Sentry from "@sentry/nextjs";

export const shopifyAnalyticsMetricsAgencyRouter = createTRPCRouter({
  createShopifyCustomerData: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        shop_url: z.string(),
        sync: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { token, shop_url, sync } = input;
      function userToken() {
        if (ctx.session.user?.type?.includes("agency")) {
          return {
            token: token,

            shop_url: shop_url,
            sync: sync || "no",
          };
        } else {
          return {
            token: token,
            shop_url: shop_url,
            sync: sync || "no",
          };
        }
      }
      //   const userToken = {
      //     token: token,
      //
      //     shop_url: shop_url,
      //     sync: sync || "no",
      //   };
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
          `${env.BACKEND_API}api/shopify/shop/create`,
          requestOptions,
        );
        const data = await response.json();
        if (!response.ok) {
          return { dataInserted: "FALSE", message: data };
        }
        return {
          data: data.data,
        };
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getShopifyCustomerData: protectedProcedure
    .input(
      z.object({
        shop_url: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        token: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { shop_url, from_date, to_date, token } = input;
      const userToken = {
        shop_url: shop_url,
        token: token,
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
      try {
        const response = await fetch(
          `${env.BACKEND_API}api/agency/shopify/data`,
          requestOptions,
        );
        const data = await response.json();
        if (!response.ok) {
          return { dataInserted: "FALSE", message: data };
        }
        if (data?.message == "Success") {
          return {
            data: data?.data,
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
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getShopifyVendorSalesData: protectedProcedure
    .input(
      z.object({
        shop_url: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { shop_url, from_date, to_date, page } = input;
      const userToken = {
        shop_url: shop_url,
        from_date: from_date,
        to_date: to_date,
        page: page,
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
          `${env.BACKEND_API}api/agency/shopify/data?data_type=total_sales_by_vendor&page=${page}`,
          requestOptions,
        );
        const data = await response.json();
        if (!response.ok) {
          return { dataInserted: "FALSE", message: data };
        }
        if (data?.message == "Success") {
          return {
            data: data?.data,
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
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getShopifyChannelSalesData: protectedProcedure
    .input(
      z.object({
        shop_url: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { shop_url, from_date, to_date, page } = input;
      const userToken = {
        shop_url: shop_url,
        from_date: from_date,
        to_date: to_date,
        page: page,
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
          `${env.BACKEND_API}api/agency/shopify/data?data_type=total_sales_by_channels&page=${page}`,
          requestOptions,
        );
        const data = await response.json();
        if (!response.ok) {
          return { dataInserted: "FALSE", message: data };
        }
        if (data?.message == "Success") {
          return {
            data: data?.data,
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
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getShopifyOrderIdData: protectedProcedure
    .input(
      z.object({
        shop_url: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { shop_url, from_date, to_date, page } = input;
      const userToken = {
        shop_url: shop_url,
        from_date: from_date,
        to_date: to_date,
        page: page,
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
          `${env.BACKEND_API}api/agency/shopify/data?data_type=total_sales_and_items_sold_and_order_count_by_order_id&page=${page}`,
          requestOptions,
        );
        const data = await response.json();
        if (!response.ok) {
          return { dataInserted: "FALSE", message: data };
        }
        if (data?.message == "Success") {
          return {
            data: data?.data,
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
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getShopifyProductData: protectedProcedure
    .input(
      z.object({
        shop_url: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { shop_url, from_date, to_date, page } = input;
      const userToken = {
        shop_url: shop_url,
        from_date: from_date,
        to_date: to_date,
        page: page,
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
          `${env.BACKEND_API}api/agency/shopify/data?data_type=inventory_quantity_and_inventory_value_by_product_name&page=${page}`,
          requestOptions,
        );
        const data = await response.json();
        if (!response.ok) {
          return { dataInserted: "FALSE", message: data };
        }
        if (data?.message == "Success") {
          return {
            data: data?.data,
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
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
  getShopifyCustomerDetails: protectedProcedure
    .input(
      z.object({
        shop_url: z.string(),
        from_date: z.string(),
        to_date: z.string(),
        page: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { shop_url, from_date, to_date, page } = input;
      const userToken = {
        shop_url: shop_url,
        from_date: from_date,
        to_date: to_date,
        page: page,
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
          `${env.BACKEND_API}api/agency/shopify/data?data_type=total_sales_and_orders_count_by_customer_details&page=${page}`,
          requestOptions,
        );
        const data = await response.json();
        if (!response.ok) {
          return { dataInserted: "FALSE", message: data };
        }
        if (data?.message == "Success") {
          return {
            data: data?.data,
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
      } catch (error) {
        Sentry.captureException(error);
        console.error("error", error);
        throw new TRPCClientError(JSON.stringify(error));
      }
    }),
});
