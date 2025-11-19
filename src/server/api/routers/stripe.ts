import { env } from "@/env";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import {
  PrismaClient,
  type BookingType,
  DurationType,
  BookingStatus,
  type Prisma,
} from "@prisma/client";
import { Redis } from "@upstash/redis";
import mailgun from "mailgun.js";
import formData from "form-data";

const mg = new mailgun(formData);
const mailgunClient = mg.client({
  username: "api",
  key: env.MAILGUN_API_KEY ?? "",
});

import { calculatePriceBreakdown } from "@/utils/priceCalculation";
import { generateFinalBookingPaidHtml } from "@/utils/generateEmail";
import type { BookingDetailsAsStatic } from "@/type/booking.type";
import {
  createGoogleCalendarEvent,
  refreshGoogleAccessToken,
} from "@/server/services/google-calendar";

const prisma = new PrismaClient();

interface ServiceDetails {
  quantity: number;
  additionalService: {
    id: string;
    price: number;
    name: string;
  };
}

interface CheckoutSessionCompleted {
  id: string;
  metadata: {
    type: string;
    data: string;
  };
}
interface OrderData {
  redisOrderId: string;
}

interface YachtBookingData {
  yachtId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  startDate: string;
  endDate: string;
  cityLocalStartDate: string;
  cityLocalStartTime: string;
  cityLocalEndDate: string;
  guestCount: number;
  bookingType: BookingType;
  priceId: string;
  affiliateId?: string;
  taxBreakdown: Array<{ name: string; amount: number }>;
  additionalServices?: Array<{
    additionalServiceId: string;
    quantity: number;
  }>;
  termsAccepted: boolean;
  paymentAccepted: boolean;
  processingFeeRequired: boolean;
  bookingDetailsAsStatic: BookingDetailsAsStatic;
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-10-28.acacia",
});

export const config = {
  api: {
    bodyParser: false,
  },
};
const redis = new Redis({
  url: env.UPSTASH_REDIS_URL,
  token: env.UPSTASH_REDIS_TOKEN,
});
const handleYachtBooking = async (data: YachtBookingData) => {
  const yacht = await prisma.yacht.findUnique({
    where: { id: data.yachtId },
    include: {
      city: {
        include: {
          taxes: {
            where: {
              bookingType: data.bookingType,
            },
          },
          yatrFees: {
            where: {
              bookingType: data.bookingType,
            },
          },
        },
      },
    },
  });

  if (!yacht) {
    throw new Error("Yacht not found");
  }
  if (!yacht.city) {
    throw new Error("City not found");
  }

  const customer = await prisma.customer.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
    },
  });

  const price = await prisma.price.findUnique({
    where: { id: data.priceId },
    include: {
      duration: true,
    },
  });

  if (!price) {
    throw new Error("Price not found");
  }
  let nights;
  let basePrice = price.amount;

  if (price.duration.durationType === DurationType.SingleDay) {
    basePrice = price.amount;
  } else {
    nights = Math.ceil(
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (price.duration.name === "Nightly") {
      basePrice = price.amount * nights;
    } else {
      const durationMatch = /(\d+)/.exec(price.duration.name);
      if (durationMatch) {
        const packageDays = parseInt(durationMatch[1]!);
        if (nights > packageDays) {
          const additionalDays = nights - packageDays;
          const dailyRate = price.amount / packageDays;
          basePrice = price.amount + dailyRate * additionalDays;
        }
      }
    }
  }

  let additionalServicesDetails: ServiceDetails[] = [];
  if (data.additionalServices?.length) {
    additionalServicesDetails = await Promise.all(
      data.additionalServices.map(async (service) => {
        const serviceDetails = await prisma.additionalService.findUnique({
          where: { id: service.additionalServiceId },
          select: { price: true, name: true, id: true },
        });
        if (!serviceDetails) {
          throw new Error(
            `Additional service not found: ${service.additionalServiceId}`,
          );
        }
        return {
          quantity: service.quantity,
          additionalService: serviceDetails,
        };
      }),
    );
  }

  const priceBreakdown = calculatePriceBreakdown(
    basePrice,
    yacht.length,
    {
      ...yacht.city,
      taxes: yacht.city.taxes.map((tax) => ({
        id: tax.id,
        name: tax.name,
        value: tax.value,
        bookingType: tax.bookingType,
      })),
      yatrFees: yacht.city.yatrFees.map((fee) => ({
        id: fee.id,
        type: fee.type,
        value: fee.value,
        bookingType: fee.bookingType,
      })),
    },
    data.bookingType,
    {
      additionalServices: additionalServicesDetails,
      deliveryCharge: additionalServicesDetails.length > 0 ? 50 : 0,
    },
  );

  const booking = await prisma.booking.create({
    data: {
      bookingDetailsAsStatic: {
        ...data.bookingDetailsAsStatic,
        additionalServicesDetails: additionalServicesDetails,
      } as unknown as Prisma.InputJsonValue,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      guestCount: data.guestCount,
      totalPrice: priceBreakdown.totalPrice,
      basePrice: priceBreakdown.basePrice,
      yatrFee: priceBreakdown.yatrFee,
      affiliateId: data.affiliateId,
      cityLocalStartDate: data.cityLocalStartDate,
      cityLocalStartTime: data.cityLocalStartTime,
      cityLocalEndDate: data.cityLocalEndDate,
      processingFee: priceBreakdown.processingFee,
      deliveryCharge: priceBreakdown.deliveryCharge ?? 0,
      bookingType: data.bookingType,
      bookingStatus: BookingStatus.Confirmed,
      termsAccepted: data.termsAccepted,
      paymentAccepted: data.paymentAccepted,
      processingFeeRequired: data.processingFeeRequired,
      prePaid: true,
      yacht: {
        connect: { id: yacht.id },
      },
      customer: {
        connect: { id: customer.id },
      },
      price: {
        connect: { id: price.id },
      },
      taxes: {
        connect: yacht.city.taxes.map((tax) => ({ id: tax.id })),
      },
      ...(data.additionalServices?.length
        ? {
            services: {
              create: data.additionalServices.map((service) => ({
                quantity: service.quantity,
                additionalService: {
                  connect: { id: service.additionalServiceId },
                },
              })),
            },
          }
        : {}),
    },
    include: {
      yacht: {
        include: {
          city: true,
          marina: true,
        },
      },
      customer: true,
      price: {
        include: {
          duration: true,
        },
      },
      services: {
        include: {
          additionalService: true,
        },
      },
    },
  });

  const emailHtml = await generateFinalBookingPaidHtml({
    userName: `${booking.customer?.firstName ?? ""} ${booking.customer?.lastName ?? ""}`,
    checkInDate: booking.cityLocalStartDate ?? "",
    pickUpTime: booking.cityLocalStartTime ?? "",
    charterDate: `${new Date(booking.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} - ${new Date(booking.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    location: `${booking.yacht?.city?.name ? booking.yacht?.city?.name + ", " : ""}${booking.yacht?.marina?.name ?? ""}`,
    yachtName:
      `${booking.yacht?.length ? booking.yacht?.length + `' ` : ""}` +
      (booking.yacht?.name ?? ""),
    duration: booking.price?.duration.name ?? "",
    basePrice: (booking.basePrice + booking.yatrFee).toFixed(2),
    additionalServices: booking.services.map((service) => ({
      name: service.additionalService.name,
      quantity: service.quantity.toString(),
      value: (service.additionalService.price * service.quantity).toFixed(2),
    })),
    taxesAndFees: priceBreakdown.taxBreakdown.map((tax) => ({
      name: tax.name,
      value: tax.amount.toString(),
    })),
    total: booking.totalPrice.toFixed(2),
    bankProcessingFee: booking.processingFeeRequired
      ? booking.processingFee.toFixed(2)
      : undefined,
    deliveryFee: booking.deliveryCharge
      ? booking.deliveryCharge.toFixed(2)
      : undefined,
  });

  try {
    await mailgunClient.messages.create(env.MAILGUN_DOMAIN ?? "", {
      from: "Yatr Booking Confirmation <booking@yatr.co>",
      to: [booking.customer?.email ?? "anish+noemailfoundyatr@xamtac.com"],
      subject: `Your ${booking.cityLocalStartDate} Booking Details`,
      html: emailHtml,
    });
    await mailgunClient.messages.create(env.MAILGUN_DOMAIN ?? "", {
      from: "New Yatr booking confirmation <booking@yatr.co>",
      to: ["booking@yatr.co"],
      subject: `New booking has been made`,
      html: `
      <h2>New Booking Details</h2>
      <p>Yacht: <a href="${env.NEXT_PUBLIC_SITE_URL}/${booking.yacht?.city?.slug + "-yachts-rental"}/${booking.yacht?.slug}">${booking.yacht?.name}</a></p>
      <p>Charter Date: ${booking.cityLocalStartDate}</p>
      <p>Customer First Name: ${booking.customer?.firstName ?? "N/A"}</p>
      <p>Customer Last Name: ${booking.customer?.lastName ?? "N/A"}</p>
      <p>Phone Number: ${booking.customer?.phoneNumber ?? "N/A"}</p>
      <p>Email: ${booking.customer?.email ?? "N/A"}</p>
      <p>Booking Total: $${booking.totalPrice.toFixed(2)}</p>
      <p>Booking ID: ${booking.bookingId}</p>
    `,
    });
  } catch (error) {
    console.error("Failed to send email", error);
    throw new Error("Failed to send email");
  }

  // Create Google Calendar event for yacht owner
  try {
    if (yacht.helmId) {
      const account = await prisma.account.findFirst({
        where: {
          userId: yacht.helmId,
          provider: "google",
        },
      });

      if (account?.refresh_token) {
        const now = Date.now();
        const expiresAt = account.expires_at
          ? account.expires_at * 1000
          : undefined;
        let accessToken = account.access_token ?? "";

        if (!accessToken || !expiresAt || expiresAt <= now + 60 * 1000) {
          const refreshed = await refreshGoogleAccessToken(
            account.refresh_token,
          );
          accessToken = refreshed.access_token;

          await prisma.account.update({
            where: { id: account.id },
            data: {
              access_token: refreshed.access_token,
              expires_at: Math.floor(
                (now + refreshed.expires_in * 1000) / 1000,
              ),
              scope: refreshed.scope ?? account.scope,
              token_type: refreshed.token_type ?? account.token_type,
              refresh_token: refreshed.refresh_token ?? account.refresh_token,
            },
          });
        }

        const eventSummary = `${yacht.name ?? "Yacht"} - Booking by ${customer.firstName} ${customer.lastName}`;
        const eventDescription = `Guest: ${customer.firstName} ${customer.lastName}\nEmail: ${customer.email}\nPhone: ${customer.phoneNumber}\nGuests: ${booking.guestCount}\nDuration: ${price.duration.name}\nBooking ID: ${booking.bookingId}`;
        const eventLocation = yacht.marina?.name
          ? `${yacht.marina.name}, ${yacht.city?.name ?? ""}`
          : (yacht.city?.name ?? "");

        const isAllDay = data.bookingType === BookingType.MultiDay;

        await createGoogleCalendarEvent({
          accessToken,
          calendarId: "primary",
          summary: eventSummary,
          description: eventDescription,
          location: eventLocation,
          start: isAllDay
            ? (booking.startDate.toISOString().split("T")[0] ?? "")
            : booking.startDate.toISOString(),
          end: isAllDay
            ? (booking.endDate.toISOString().split("T")[0] ?? "")
            : booking.endDate.toISOString(),
          allDay: isAllDay,
          timeZone: "UTC",
        });
      }
    }
  } catch (error) {
    // Silently fail - Google Calendar event creation is optional
    console.error("Failed to create Google Calendar event:", error);
  }
};

const webhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"] as string;

    const event = stripe.webhooks.constructEvent(
      buf,
      sig,
      env.STRIPE_WEB_HOOK_SECRET,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as unknown as CheckoutSessionCompleted;

      if (session.metadata.type === "yacht-booking") {
        const orderData = JSON.parse(session.metadata.data) as OrderData;
        const bookingData: YachtBookingData = (await redis.get(
          orderData.redisOrderId,
        ))!;

        if (!bookingData) {
          throw new Error("Booking data not found");
        }
        await handleYachtBooking(bookingData);
        await redis.del(orderData.redisOrderId);
      } else {
        console.warn(`Unhandled metadata type: ${session.metadata.type}`);
      }
    } else {
      console.warn(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return res.status(400).json({ error: errorMessage });
  }
};

export default webhook;
