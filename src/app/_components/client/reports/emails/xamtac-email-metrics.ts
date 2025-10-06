import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { TRPCClientError } from "@trpc/client";
// import { getHtmlFromMjmlJsonContentServer } from "@/utils/getHtmlFromMjmlServer";
// import {
//   type CreateEmailTemplate,
//   type EmailCreative,
//   type LaunchCommunicationEmailCampaign,
// } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

export const xamtacEmailMetricsClientRouter = createTRPCRouter({
  getXamtacEmailMetrics: protectedProcedure
    .input(
      z.object({
        skip: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx?.session?.user?.id)
        throw new TRPCClientError("No organizationId");
      try {
        const response = await fetch(
          `${
            env.XAMTAC_EMAIL_METRICS_API_URL
          }/api/metrics/get-metrics?organizationId=${
            ctx?.session?.user?.id
          }&skip=${input?.skip || 0}`,
        );

        if (!response.ok) {
          throw new TRPCClientError("Failed to fetch data");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCClientError("TRPCClientError fetching data");
      }
    }),
  // getCampaignDetailsFromCampaignId: protectedProcedure
  //   .input(
  //     z.object({
  //       skip: z.number().optional(),
  //     }),
  //   )
  //   .query(async ({ input, ctx }) => {
  //     if (!ctx?.session?.user?.organizationId)
  //       throw new TRPCClientError("No organizationId");
  //     try {
  //       const response = await fetch(
  //         `${
  //           env.XAMTAC_EMAIL_METRICS_API_URL
  //         }/api/metrics/get-metrics?organizationId=${
  //           ctx?.session?.user?.organizationId
  //         }&skip=${input?.skip || 0}`,
  //       );

  //       if (!response.ok) {
  //         throw new TRPCClientError("Failed to fetch data");
  //       }
  //       const data: {
  //         id: string;
  //         campaignId: string;
  //         organizationId: string;
  //         openCount: number;
  //         clicked: number;
  //         numberOfUnsubscribedUser: number;
  //         createdAt: string;
  //         updatedAt: string;
  //       }[] = await response.json();
  //       let campaignData = data.map((item) => {
  //         return {
  //           id: item.id,
  //           campaignId: item.campaignId,
  //           organizationId: item.organizationId,
  //           openCount: item.openCount,
  //           clicked: item.clicked,
  //           numberOfUnsubscribedUser: item.numberOfUnsubscribedUser,
  //           createdAt: item.createdAt,
  //           updatedAt: item.updatedAt,
  //           launchDetails: undefined,
  //           planDetails: undefined,
  //           emailTemplateDetails: undefined,
  //           emailTemplateInHtml: "",
  //         } as {
  //           id: string;
  //           campaignId: string;
  //           organizationId: string;
  //           openCount: number;
  //           clicked: number;
  //           numberOfUnsubscribedUser: number;
  //           createdAt: string;
  //           updatedAt: string;
  //           launchDetails?: LaunchCommunicationEmailCampaign;
  //           planDetails?: CreateEmailTemplate;
  //           emailTemplateDetails?: EmailCreative;
  //           emailTemplateInHtml?: string | null;
  //         };
  //       });

  //       const launchCampaigns =
  //         await ctx.prisma.launchCommunicationEmailCampaign.findMany({
  //           where: {
  //             id: {
  //               in: campaignData.map((item) => item.campaignId),
  //             },
  //           },
  //           // skip: input?.skip || 0,
  //         });

  //       campaignData = campaignData.map((item) => {
  //         const launchDetail = launchCampaigns.find(
  //           (launch) => launch.id === item.campaignId,
  //         );
  //         return {
  //           ...item,
  //           launchDetails: launchDetail || undefined,
  //         };
  //       });

  //       const planIds = launchCampaigns.map((item) => item.email);
  //       const plans = await ctx.prisma.createEmailTemplate.findMany({
  //         where: {
  //           id: {
  //             in: planIds as string[],
  //           },
  //         },
  //       });

  //       campaignData = campaignData.map((item) => {
  //         const planDetail = plans.find(
  //           (plan) => plan.id === item.launchDetails?.email,
  //         );
  //         return {
  //           ...item,
  //           planDetails: planDetail || undefined,
  //         };
  //       });

  //       const emailTemplateIds = plans.map((item) => item.emailTemplate);
  //       const emailTemplates = await ctx.prisma.emailCreative.findMany({
  //         where: {
  //           id: {
  //             in: emailTemplateIds,
  //           },
  //         },
  //       });

  //       campaignData = campaignData.map((item) => {
  //         const emailTemplateDetail = emailTemplates.find(
  //           (template) => template.id === item.planDetails?.emailTemplate,
  //         );
  //         return {
  //           ...item,
  //           emailTemplateDetails: emailTemplateDetail || undefined,
  //           emailTemplateInHtml:
  //             emailTemplateDetail?.designType === "EMAIL"
  //               ? getHtmlFromMjmlJsonContentServer(emailTemplateDetail)
  //               : emailTemplateDetail?.design,
  //         };
  //       });
  //       return {
  //         campaignData,
  //       };
  //     } catch (error) {
  //       Sentry.captureException(error);
  //       throw new TRPCClientError("TRPCClientError fetching data");
  //     }
  //   }),
  // getEmailId: protectedProcedure
  //   .input(
  //     z.object({
  //       skip: z.number().optional(),
  //     }),
  //   )
  //   .mutation(async ({ input, ctx }) => {
  //     if (!ctx?.session?.user?.organizationId)
  //       throw new TRPCClientError("No organizationId");
  //     try {
  //       const response = await fetch(
  //         `${
  //           env.XAMTAC_EMAIL_METRICS_API_URL
  //         }/api/metrics/get-email?organizationId=${
  //           ctx?.session?.user?.organizationId
  //         }&skip=${input?.skip || 0}`,
  //       );

  //       if (!response.ok) {
  //         throw new TRPCClientError("Failed to fetch data");
  //       }

  //       const data = await response.json();
  //       return data;
  //     } catch (error) {
  //       Sentry.captureException(error);
  //       throw new TRPCClientError("TRPCClientError fetching data");
  //     }
  //   }),

  // getOrganizationEmailMetrics: protectedProcedure
  //   .input(
  //     z.object({
  //       emailType: z.string(),
  //       startDate: z.string().optional(),
  //       endDate: z.string().optional(),
  //       page: z.number(),
  //     }),
  //   )
  //   .query(async ({ input, ctx }) => {
  //     const { emailType, startDate, endDate, page } = input;
  //     if (!ctx?.session?.user?.organizationId)
  //       throw new TRPCClientError("No organizationId");
  //     try {
  //       const requestOptions = {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "x-api-key": env.XAMTAC_EMAIL_METRICS_API_KEY,
  //         },
  //       };
  //       const response = await fetch(
  //         `${env.XAMTAC_EMAIL_METRICS_API_URL}/api/email-metrics/${emailType === "campaign" ? "get-bulk-emails" : emailType === "automation" ? "get-automation-emails" : "get-single-emails"}/?organizationId=${ctx?.session?.user?.organizationId}&${startDate ? `startDate=${startDate}/` : ""}${endDate ? `&endDate${endDate}/` : ""}&take=${page * 20}&skip=${(page - 1) * 20}`,

  //         requestOptions,
  //       );

  //       if (!response.ok) {
  //         throw new TRPCClientError("Failed to fetch data");
  //       }

  //       const emailData: EmailData = await response.json();

  //       const updateData = () => {
  //         const data = emailData?.aggregatedDataArray?.map(async (item) => {
  //           if (item.campaignId !== null) {
  //             const data =
  //               await ctx.prisma.launchCommunicationEmailCampaign.findUnique({
  //                 where: {
  //                   id: item?.campaignId ?? "",
  //                   // id: "clwgxio610002adc97j1axwvn",
  //                 },
  //               });
  //             const email = await ctx.prisma.createEmailTemplate.findUnique({
  //               where: {
  //                 id: data?.email ?? "",
  //                 // id: "clwgxio610002adc97j1axwvn",
  //               },
  //             });
  //             const preview = await ctx.prisma.emailCreative.findUnique({
  //               where: {
  //                 id: email?.emailTemplate ?? "",
  //               },
  //             });
  //             return {
  //               ...item,
  //               campaignName: data?.name,
  //               preview: preview,
  //             };
  //           }
  //           if (item.automationId !== null) {
  //             const data =
  //               await ctx.prisma.launchCommunicationAutomation.findUnique({
  //                 where: {
  //                   id: item.automationId ?? "",
  //                 },
  //               });

  //             return {
  //               ...item,
  //               campaignName: data?.name,
  //               preview: data?.emailTriggers,
  //             };
  //           }
  //         });

  //         return data;
  //       };
  //       const newDataPromise = await Promise.all(updateData());
  //       return {
  //         ...emailData,
  //         aggregatedDataArray: newDataPromise,
  //         maxPage: Math.ceil(emailData.count / 20) || 1,
  //       };
  //     } catch (error) {
  //       Sentry.captureException(error);
  //       throw new TRPCClientError("TRPCClientError fetching data");
  //     }
  //   }),
});
// type EmailData = {
//   message: string;
//   count: number;
//   aggregatedDataArray: AggregatedEmailData[];
// };
// export type AggregatedEmailData = {
//   id: string;
//   delivery: number;
//   sent: number;
//   opened: number;
//   clicked: number;
//   bounced: number;
//   rejected: number;
//   spam: number;
//   unsubscribed: number;
//   deliveryDelay: number;
//   organizationId: string;
//   campaignId?: string | null;
//   automationId?: string | null;
//   campaignName?: string;
//   preview?: EmailCreative;
// };
