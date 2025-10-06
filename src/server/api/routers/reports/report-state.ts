import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCClientError } from "@trpc/client";

import { MetricsStateInput, MetricsStateInputType } from "@/types/metrics";

export const reportsStateAgencyRouter = createTRPCRouter({
  saveGoogleAdsStatus: protectedProcedure
    .input(MetricsStateInput)
    .mutation(async ({ ctx, input }) => {
      const data: MetricsStateInputType["data"] = input.data;
      await ctx.prisma.client.update({
        where: {
          id: input.clientId,
        },
        data: {
          googleAdsMigrationReport: data,
        },
      });
    }),
  saveGoogleAnalyticsStatus: protectedProcedure
    .input(MetricsStateInput)
    .mutation(async ({ ctx, input }) => {
      const data: MetricsStateInputType["data"] = input.data;
      await ctx.prisma.client.update({
        where: {
          id: input.clientId,
        },
        data: {
          googleAnalyticsMigrationReport: data,
        },
      });
    }),
  saveGoogleSearchStatus: protectedProcedure
    .input(MetricsStateInput)
    .mutation(async ({ ctx, input }) => {
      const data: MetricsStateInputType["data"] = input.data;
      await ctx.prisma.client.update({
        where: {
          id: input.clientId,
        },
        data: {
          googleSearchMigrationReport: data,
        },
      });
    }),
  saveBingAdsStatus: protectedProcedure
    .input(MetricsStateInput)
    .mutation(async ({ ctx, input }) => {
      const data: MetricsStateInputType["data"] = input.data;
      await ctx.prisma.client.update({
        where: {
          id: input.clientId,
        },
        data: {
          bingAdsMigrationReport: data,
        },
      });
    }),
  saveLinkedinAdsStatus: protectedProcedure
    .input(MetricsStateInput)
    .mutation(async ({ ctx, input }) => {
      const data: MetricsStateInputType["data"] = input.data;
      await ctx.prisma.client.update({
        where: {
          id: input.clientId,
        },
        data: {
          linkedinAdsMigrationReport: data,
        },
      });
    }),
  saveBingWebmasterStatus: protectedProcedure
    .input(MetricsStateInput)
    .mutation(async ({ ctx, input }) => {
      const data: MetricsStateInputType["data"] = input.data;
      await ctx.prisma.client.update({
        where: {
          id: input.clientId,
        },
        data: {
          bingWebMasterMigrationReport: data,
        },
      });
    }),
  savefaceBookAdsStatus: protectedProcedure
    .input(MetricsStateInput)
    .mutation(async ({ ctx, input }) => {
      const data: MetricsStateInputType["data"] = input.data;
      await ctx.prisma.client.update({
        where: {
          id: input.clientId,
        },
        data: {
          faceBookAdsMigrationReport: data,
        },
      });
    }),
  getAllReportsStatus: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const data = await ctx.prisma.client.findUnique({
        where: {
          id: input.clientId,
        },
        select: {
          googleAdsMigrationReport: true,
          bingAdsMigrationReport: true,
          faceBookAdsMigrationReport: true,
          linkedinAdsMigrationReport: true,
          googleSearchMigrationReport: true,
          googleAnalyticsMigrationReport: true,
          bingWebMasterMigrationReport: true,
        },
      });
      const allData = {
        googleAdsMigrationReport:
          data?.googleAdsMigrationReport as MetricsStateInputType["data"],
        bingAdsMigrationReport:
          data?.bingAdsMigrationReport as MetricsStateInputType["data"],
        faceBookAdsMigrationReport:
          data?.faceBookAdsMigrationReport as MetricsStateInputType["data"],
        linkedinAdsMigrationReport:
          data?.linkedinAdsMigrationReport as MetricsStateInputType["data"],
        googleSearchMigrationReport:
          data?.googleSearchMigrationReport as MetricsStateInputType["data"],
        googleAnalyticsMigrationReport:
          data?.googleAnalyticsMigrationReport as MetricsStateInputType["data"],
        bingWebMasterMigrationReport:
          data?.bingWebMasterMigrationReport as MetricsStateInputType["data"],
      };

      return allData;
    }),
});
