import { type BookingDetailsAsStatic } from "./../../../type/booking.type";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCClientError } from "@trpc/client";
import _stripe from "stripe";
import { env } from "@/env";
import {
  calculatePriceBreakdown,
  calculatePriceBreakdownWithoutProcessingFee,
} from "@/utils/priceCalculation";
import {
  BookingStatus,
  BookingType,
  DurationType,
  type Prisma,
} from "@prisma/client";
import { Redis } from "@upstash/redis";
import mailgun from "mailgun.js";
import formData from "form-data";
import { nanoid } from "nanoid";
import { generateFinalBookingInquiryHtml } from "@/utils/generateEmail";
import { algoliaClient } from "@/lib/algolia";
import { sendFormDataToGHL } from "@/utils/sendFormDataToGHL";
import {
  createGoogleCalendarEvent,
  refreshGoogleAccessToken,
} from "@/server/services/google-calendar";
const stripe = new _stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-10-28.acacia",
});

const redis = new Redis({
  url: env.UPSTASH_REDIS_URL,
  token: env.UPSTASH_REDIS_TOKEN,
});

const mg = new mailgun(formData);
const mailgunClient = mg.client({
  username: "api",
  key: env.MAILGUN_API_KEY ?? "",
});

const bookYachtInputSchema = z.object({
  yachtId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().min(10),
  startDate: z.date(),
  endDate: z.date(),
  cityLocalStartDate: z.string(),
  affiliateId: z.string().optional(),
  cityLocalStartTime: z.string(),
  cityLocalEndDate: z.string(),
  guestCount: z.number().int().positive(),
  bookingType: z.nativeEnum(BookingType),
  priceId: z.string(),
  additionalServices: z
    .array(
      z.object({
        additionalServiceId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
  termsAccepted: z.boolean(),
  paymentAccepted: z.boolean(),
  bookingDetailsAsStatic: z.custom<BookingDetailsAsStatic>(),
});

const filteredYachtsSchema = z.object({
  priceLte: z.number().optional(),
  priceGte: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  sortBy: z
    .array(z.enum(["price_asc", "price_desc", "length_asc", "length_desc"]))
    .optional(),
  city: z.string().optional(),
  marina: z.string().optional(),
  duration: z.enum(["SingleDay", "MultiDay"]).optional(),
  lengthLte: z.number().optional(),
  lengthGte: z.number().optional(),
});

interface AlgoliaYacht {
  objectID: string;
  name: string;
  description: string;
  length: number;
  city:
    | string
    | {
        name: string;
        slug: string;
        yatrFees?: Array<{
          type: string;
          value: number;
          bookingType: string;
        }>;
      };
  cityId: string;
  marina:
    | string
    | {
        name: string;
      };
  marinaId: string;
  amenities: string[];
  amenityIds: string[];
  profileImage: string;
  _geoloc: {
    lat: number;
    lng: number;
  };
  active: boolean;
  featured: boolean;
  popular: boolean;
  cabins: number;
  heads: number;
  crew: number;
  guests: number;
  builder: string;
  prices: Array<{
    amount: number;
    durationType: string;
    duration?: {
      durationType: string;
    };
  }>;
  slug?: string;
  _highlightResult?: {
    name: {
      value: string;
      matchLevel: string;
      fullyHighlighted: boolean;
      matchedWords: string[];
    };
    description: {
      value: string;
      matchLevel: string;
      fullyHighlighted: boolean;
      matchedWords: string[];
    };
    [key: string]: {
      value: string;
      matchLevel: string;
      fullyHighlighted?: boolean;
      matchedWords: string[];
    };
  };
  id?: string;
}

interface AlgoliaSearchResult<T> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
  params: string;
  exhaustiveNbHits: boolean;
  facets?: Record<string, Record<string, number>>;
  facets_stats?: Record<
    string,
    { min: number; max: number; avg: number; sum: number }
  >;
}

export const yachtRouter = createTRPCRouter({
  getAllYachts: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.yacht.findMany({
      select: {
        id: true,
        yachtId: true,
        slug: true,
        name: true,
        length: true,
        profileImage: true,
        galleryImages: true,
        maxDayGuests: true,
        popular: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
        seo: {
          select: {
            metaTitle: true,
          },
        },
        city: {
          include: {
            yatrFees: true,
            taxes: true,
          },
        },
        marina: {
          select: {
            id: true,
            name: true,
          },
        },
        amenities: {
          where: {
            active: true,
          },
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        prices: {
          include: {
            duration: true,
          },
          orderBy: {
            amount: "asc",
          },
          take: 1,
        },
        additionalServiceList: {
          select: {
            id: true,
          },
          take: 0,
        },
      },
    });
  }),
  getAllPopularYachts: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.yacht.findMany({
      where: {
        popular: true,
        active: true,
      },
      orderBy: [
        { popularRank: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        yachtId: true,
        slug: true,
        name: true,
        length: true,
        profileImage: true,
        galleryImages: true,
        maxDayGuests: true,
        popular: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
        seo: {
          select: {
            metaTitle: true,
          },
        },
        city: {
          include: {
            yatrFees: true,
            taxes: true,
          },
        },
        marina: {
          select: {
            id: true,
            name: true,
          },
        },
        amenities: {
          where: {
            active: true,
          },
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        prices: {
          include: {
            duration: true,
          },
          orderBy: {
            amount: "asc",
          },
          take: 1,
        },
        additionalServiceList: {
          select: {
            id: true,
          },
          take: 0,
        },
      },
    });
  }),
  getAllFeaturedYachts: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.yacht.findMany({
      where: {
        active: true,
        featured: true,
      },
      orderBy: [
        { featuredRank: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        yachtId: true,
        slug: true,
        name: true,
        length: true,
        profileImage: true,
        galleryImages: true,
        maxDayGuests: true,
        popular: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
        seo: {
          select: {
            metaTitle: true,
          },
        },
        city: {
          include: {
            yatrFees: true,
            taxes: true,
          },
        },
        marina: {
          select: {
            id: true,
            name: true,
          },
        },
        amenities: {
          where: {
            active: true,
          },
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        prices: {
          include: {
            duration: true,
          },
          orderBy: {
            amount: "asc",
          },
          take: 1,
        },
        additionalServiceList: {
          select: {
            id: true,
          },
          take: 0,
        },
      },
    });
  }),
  getMinMaxPrices: publicProcedure
    .input(
      z.object({
        citySlug: z.string().optional(),
        marinaId: z.string().optional(),
        durationType: z.enum(["SingleDay", "MultiDay"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { citySlug, durationType, marinaId } = input;

      const prices = await ctx.db.price.findMany({
        where: {
          yacht: {
            active: true,
            ...(citySlug && {
              city: {
                slug: citySlug,
                active: true,
              },
            }),
            ...(marinaId && {
              marina: {
                id: marinaId,
              },
            }),
          },
          ...(durationType && {
            duration: {
              durationType,
            },
          }),
        },
        include: {
          duration: true,
          yacht: {
            include: {
              city: {
                include: {
                  yatrFees: true,
                },
              },
              prices: true,
              marina: true,
              amenities: {
                where: {
                  active: true,
                },
              },
              additionalServiceList: true,
              seo: true,
            },
          },
        },
      });

      let minPrice = Number.POSITIVE_INFINITY;
      let maxPrice = Number.NEGATIVE_INFINITY;
      let minPriceYacht = null;
      let maxPriceYacht = null;

      // biome-ignore lint/complexity/noForEach: <explanation>
      prices.forEach((price) => {
        const yacht = price.yacht;
        const city = yacht?.city;
        const yatrFees = city?.yatrFees;

        if (!yacht || !city || !yatrFees?.length || yacht.length === null) {
          const amount = price.amount;
          if (amount < minPrice) {
            minPrice = amount;
            minPriceYacht = yacht;
          }
          if (amount > maxPrice) {
            maxPrice = amount;
            maxPriceYacht = yacht;
          }
          return;
        }

        const bookingType =
          price.duration.durationType === "SingleDay"
            ? "SingleDay"
            : "MultiDay";
        const applicableFee = yatrFees.find(
          (fee) => fee.bookingType === bookingType,
        );

        if (!applicableFee) {
          const amount = price.amount;
          if (amount < minPrice) {
            minPrice = amount;
            minPriceYacht = yacht;
          }
          if (amount > maxPrice) {
            maxPrice = amount;
            maxPriceYacht = yacht;
          }
          return;
        }

        const finalYatrFee =
          city.name === "MIAMI" && yacht.length < 70
            ? 1000
            : applicableFee.type === "PERCENTAGE"
              ? price.amount * (applicableFee.value / 100)
              : applicableFee.value;

        const totalAmount = price.amount + finalYatrFee;

        if (totalAmount < minPrice) {
          minPrice = totalAmount;
          minPriceYacht = yacht;
        }
        if (totalAmount > maxPrice) {
          maxPrice = totalAmount;
          maxPriceYacht = yacht;
        }
      });

      if (
        minPrice === Number.POSITIVE_INFINITY ||
        maxPrice === Number.NEGATIVE_INFINITY
      ) {
        return {
          minPrice: 0,
          maxPrice: 0,
          minPriceYacht: null,
          maxPriceYacht: null,
        };
      }

      return {
        minPrice,
        maxPrice,
        minPriceYacht,
        maxPriceYacht,
      };
    }),

  getFilteredYachts: publicProcedure
    .input(filteredYachtsSchema)
    .query(async ({ ctx, input }) => {
      const {
        priceLte,
        priceGte,
        amenities,
        sortBy,
        city,
        marina,
        duration,
        lengthLte,
        lengthGte,
      } = input;

      const whereClause: Prisma.YachtWhereInput = {
        active: true,
      };

      if (typeof lengthGte === "number" || typeof lengthLte === "number") {
        whereClause.length = {};

        if (typeof lengthGte === "number") {
          whereClause.length = {
            ...whereClause.length,
            gte: lengthGte,
          };
        }

        if (typeof lengthLte === "number") {
          whereClause.length = {
            ...whereClause.length,
            lte: lengthLte,
          };
        }
      }

      if (duration) {
        whereClause.prices = {
          some: {
            duration: {
              durationType: duration === "SingleDay" ? "SingleDay" : "MultiDay",
            },
          },
        };
      }

      if (city) {
        whereClause.city = {
          slug: city,
          active: true,
        };
      }

      if (marina) {
        whereClause.marina = {
          id: marina,
        };
      }

      if (priceLte !== undefined || priceGte !== undefined) {
        whereClause.prices = {
          some: {
            amount: {
              ...(priceLte !== undefined && { lte: priceLte }),
              ...(priceGte !== undefined && { gte: priceGte - 1000 }),
            },
            ...(duration && {
              duration: {
                durationType:
                  duration === "SingleDay" ? "SingleDay" : "MultiDay",
              },
            }),
          },
        };
      }

      if (amenities && amenities.length > 0) {
        whereClause.amenities = {
          some: {
            id: {
              in: amenities,
            },
          },
        };
      }

      const yachts = await ctx.db.yacht.findMany({
        where: whereClause,
        include: {
          city: {
            include: {
              yatrFees: true,
              taxes: true,
            },
          },
          marina: true,
          amenities: {
            where: {
              active: true,
            },
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          prices: {
            where: duration
              ? {
                  duration: {
                    durationType:
                      duration === "SingleDay" ? "SingleDay" : "MultiDay",
                  },
                }
              : undefined,
            include: {
              duration: true,
            },
            orderBy: {
              amount: "asc",
            },
          },
          additionalServiceList: {
            include: {
              services: true,
              categories: true,
            },
            take: 0,
          },
          seo: true,
        },
      });

      if (sortBy && sortBy.length > 0) {
        const sortKeys = sortBy;
        return yachts.sort((a, b) => {
          for (const key of sortKeys) {
            if (key.startsWith("price_")) {
              const aPrice = Math.min(...a.prices.map((p) => p.amount));
              const bPrice = Math.min(...b.prices.map((p) => p.amount));
              const diff =
                key === "price_asc" ? aPrice - bPrice : bPrice - aPrice;
              if (diff !== 0) return diff;
            } else if (key.startsWith("length_")) {
              const aLength = a.length ?? 0;
              const bLength = b.length ?? 0;
              const diff =
                key === "length_asc" ? aLength - bLength : bLength - aLength;
              if (diff !== 0) return diff;
            }
          }
          return 0;
        });
      }

      return yachts;
    }),
  getNumberOfYachtsInPriceRange: publicProcedure
    .input(
      z.object({
        citySlug: z.string().optional(),
        durationType: z.enum(["SingleDay", "MultiDay"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { citySlug, durationType } = input;
      const numRanges = 50;

      const yachts = await ctx.db.yacht.findMany({
        where: {
          active: true,
          ...(citySlug && {
            city: {
              slug: citySlug,
              active: true,
            },
          }),
          prices: {
            some: {
              duration: {
                durationType:
                  durationType === "SingleDay" ? "SingleDay" : "MultiDay",
              },
            },
          },
        },
        include: {
          prices: {
            include: {
              duration: true,
            },
          },
        },
      });
      const allPrices = yachts.flatMap((yacht) =>
        yacht.prices
          .filter(
            (price) =>
              !durationType ||
              (durationType === "SingleDay" &&
                price.duration.durationType === "SingleDay") ||
              (durationType === "MultiDay" &&
                price.duration.durationType === "MultiDay"),
          )
          .map((p) => p.amount),
      );

      if (allPrices.length === 0) {
        return Array.from({ length: numRanges }, (_, i) => ({
          id: i + 1,
          numberOfYachts: 0,
        }));
      }

      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const rangeSize = (maxPrice - minPrice) / numRanges;

      const ranges = Array.from({ length: numRanges }, (_, i) => ({
        id: i + 1,
        numberOfYachts: 0,
      }));

      yachts.forEach((yacht) => {
        const relevantPrices = yacht.prices.filter(
          (price) =>
            !durationType ||
            (durationType === "SingleDay" &&
              price.duration.durationType === "SingleDay") ||
            (durationType === "MultiDay" &&
              price.duration.durationType === "MultiDay"),
        );

        if (relevantPrices.length > 0) {
          const minYachtPrice = Math.min(
            ...relevantPrices.map((p) => p.amount),
          );
          const rangeIndex = Math.floor((minYachtPrice - minPrice) / rangeSize);
          if (rangeIndex >= 0 && rangeIndex < numRanges) {
            ranges[rangeIndex]!.numberOfYachts++;
          }
        }
      });

      return ranges;
    }),
  getMinMaxLengths: publicProcedure
    .input(
      z.object({
        citySlug: z.string().optional(),
        marinaId: z.string().optional(),
        priceGte: z.number().optional(),
        priceLte: z.number().optional(),
        durationType: z.enum(["SingleDay", "MultiDay"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { citySlug, durationType, marinaId, priceGte, priceLte } = input;

      const lengths = await ctx.db.yacht.findMany({
        where: {
          active: true,
          ...(citySlug && {
            city: {
              slug: citySlug,
              active: true,
            },
          }),
          ...(marinaId && {
            marina: {
              id: marinaId,
            },
          }),
          ...(durationType && {
            prices: {
              some: {
                duration: {
                  durationType,
                },
              },
            },
          }),
          ...(priceGte && {
            prices: {
              some: { amount: { gte: priceGte } },
            },
          }),
          ...(priceLte && {
            prices: {
              some: { amount: { lte: priceLte } },
            },
          }),
        },
        select: {
          length: true,
        },
      });

      let minLength = Number.POSITIVE_INFINITY;
      let maxLength = Number.NEGATIVE_INFINITY;
      let minLengthYacht = null;
      let maxLengthYacht = null;

      lengths.forEach((length) => {
        if (length.length) {
          if (length.length < minLength) {
            minLength = length.length;
            minLengthYacht = length;
          }
          if (length.length > maxLength) {
            maxLength = length.length;
            maxLengthYacht = length;
          }
        }
      });

      return {
        minLength,
        maxLength,
        minLengthYacht,
        maxLengthYacht,
      };
    }),
  getNumberOfYachtsInLengthRange: publicProcedure
    .input(
      z.object({
        citySlug: z.string().optional(),
        marinaId: z.string().optional(),
        priceGte: z.number().optional(),
        priceLte: z.number().optional(),
        durationType: z.enum(["SingleDay", "MultiDay"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { citySlug, durationType, marinaId, priceGte, priceLte } = input;
      const numRanges = 50;

      const yachts = await ctx.db.yacht.findMany({
        where: {
          active: true,
          ...(citySlug && {
            city: {
              slug: citySlug,
              active: true,
            },
          }),
          prices: {
            some: {
              duration: {
                durationType:
                  durationType === "SingleDay" ? "SingleDay" : "MultiDay",
              },
            },
          },
          ...(priceGte && {
            prices: {
              some: { amount: { gte: priceGte } },
            },
          }),
          ...(priceLte && {
            prices: {
              some: { amount: { lte: priceLte } },
            },
          }),
          ...(marinaId && {
            marina: {
              id: marinaId,
            },
          }),
        },
        select: {
          length: true,
        },
      });

      const allLengths = yachts.flatMap((yacht) => yacht.length);

      if (allLengths.length === 0) {
        return Array.from({ length: numRanges }, (_, i) => ({
          id: i + 1,
          numberOfYachts: 0,
        }));
      }

      const minLength = Math.min(
        ...allLengths.filter((length) => length !== null),
      );
      const maxLength = Math.max(
        ...allLengths.filter((length) => length !== null),
      );
      const rangeSize = (maxLength - minLength) / numRanges;

      const ranges = Array.from({ length: numRanges }, (_, i) => ({
        id: i + 1,
        numberOfYachts: 0,
      }));

      yachts.forEach((yacht) => {
        const relevantLengths = yacht.length;
        if (relevantLengths) {
          const rangeIndex = Math.floor(
            (relevantLengths - minLength) / rangeSize,
          );
          if (rangeIndex >= 0 && rangeIndex < numRanges) {
            ranges[rangeIndex]!.numberOfYachts++;
          }
        }
      });

      return ranges;
    }),

  getAllAmenities: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.amenity.findMany();
  }),
  getAllAmenitiesForFilter: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.amenity.findMany({
      where: {
        active: true,
        showOnFilter: true,
      },
    });
  }),
  getSimilarYachts: publicProcedure
    .input(
      z.object({
        take: z.number().positive().default(4).optional(),
        length: z.number(),
        cityId: z.string(),
        currentYachtId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.yacht.findMany({
        where: {
          active: true,
          cityId: input.cityId,
          id: {
            not: input.currentYachtId,
          },
          length: {
            gte: input.length - 10,
            lte: input.length + 10,
          },
        },
        include: {
          city: {
            include: {
              taxes: true,
              yatrFees: true,
            },
          },
          marina: true,
          amenities: {
            where: {
              active: true,
            },
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          prices: {
            include: {
              duration: true,
            },
            orderBy: {
              amount: "asc",
            },
            take: 1,
          },
          additionalServiceList: {
            include: {
              services: true,
              categories: true,
            },
            take: 0,
          },
          seo: true,
        },
        take: input.take,
      });
    }),
  getYacht: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.yacht.findUnique({
        where: { slug: input.slug },
        include: {
          city: {
            include: {
              taxes: true,
              yatrFees: true,
            },
          },
          marina: true,
          amenities: {
            where: {
              active: true,
            },
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          prices: {
            include: {
              duration: true,
            },
            orderBy: {
              amount: "asc",
            },
          },
          additionalServiceList: {
            include: {
              services: true,
              categories: {
                include: {
                  additionalService: true,
                },
              },
            },
          },

          seo: true,
        },
      });
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        cursor: z.number().nullish(),
        limit: z.number().min(1).max(100).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 4;
      const cursor = input.cursor;

      const items = await ctx.db.yacht.findMany({
        take: limit + 1,
        skip: cursor ? cursor * limit : 0,
        where: {
          active: true,
          OR: [
            {
              city: {
                name: {
                  contains: input.query,
                  mode: "insensitive",
                },
                active: true,
              },
            },
            {
              marina: {
                name: {
                  contains: input.query,
                  mode: "insensitive",
                },
                city: {
                  active: true,
                },
              },
            },
            {
              name: {
                contains: input.query,
                mode: "insensitive",
              },
            },
            ...(Number.isNaN(Number(input.query))
              ? []
              : [
                  {
                    length: {
                      equals: Number.parseFloat(input.query),
                    },
                  },
                ]),
          ],
        },
        include: {
          city: {
            include: {
              yatrFees: true,
              taxes: true,
            },
          },
          seo: true,
          amenities: {
            where: {
              active: true,
            },
          },
          additionalServiceList: {
            include: {
              services: true,
              categories: true,
            },
          },
          marina: true,
          prices: {
            include: {
              duration: true,
            },
            orderBy: {
              amount: "asc",
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        items.pop();
        nextCursor = cursor ? cursor + 1 : 1;
      }

      return {
        items,
        nextCursor,
      };
    }),

  yachtsForCity: publicProcedure
    .input(z.object({ cityName: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.yacht.findMany({
        where: {
          active: true,
          city: {
            slug: input.cityName,
          },
        },
        include: {
          seo: true,
          city: {
            include: {
              taxes: true,
              yatrFees: true,
            },
          },
          marina: true,
          amenities: {
            where: {
              active: true,
            },
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          prices: {
            include: {
              duration: true,
            },
            orderBy: {
              amount: "asc",
            },
          },
          additionalServiceList: {
            include: {
              services: true,
              categories: true,
            },
          },
        },
      });
    }),

  createBooking: publicProcedure
    .input(bookYachtInputSchema)
    .mutation(async ({ ctx, input }) => {
      const customer = await ctx.db.customer.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
        },
      });

      const yacht = await ctx.db.yacht.findUnique({
        where: { id: input.yachtId },
        include: {
          city: {
            include: {
              taxes: {
                where: {
                  bookingType: input.bookingType,
                },
              },
              yatrFees: {
                where: {
                  bookingType: input.bookingType,
                },
                select: {
                  id: true,
                  type: true,
                  value: true,
                  bookingType: true,
                },
              },
            },
          },
          prices: true,
        },
      });

      if (!yacht) {
        throw new TRPCClientError("Yacht not found");
      }
      if (!yacht.city) {
        throw new TRPCClientError("City not found");
      }

      const price = await ctx.db.price.findUnique({
        where: { id: input.priceId },
        include: {
          duration: true,
        },
      });

      if (!price) {
        throw new TRPCClientError("Price not found");
      }

      let basePrice = price.amount;

      if (price.duration.durationType === DurationType.SingleDay) {
        basePrice = price.amount;
      } else {
        const nights = Math.ceil(
          (input.endDate.getTime() - input.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (price.duration.name === "Nightly") {
          basePrice = price.amount * nights;
        } else {
          const durationMatch = /(\d+)/.exec(price.duration.name);
          if (durationMatch) {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            const packageDays = Number.parseInt(durationMatch[1]!);
            if (nights > packageDays) {
              const additionalDays = nights - packageDays;
              const dailyRate = price.amount / packageDays;
              basePrice = price.amount + dailyRate * additionalDays;
            }
          }
        }
      }

      let additionalServicesDetails: ServiceDetails[] = [];
      if (input.additionalServices?.length) {
        additionalServicesDetails = await Promise.all(
          input.additionalServices.map(async (service) => {
            const serviceDetails = await ctx.db.additionalService.findUnique({
              where: { id: service.additionalServiceId },
              select: { price: true },
            });
            if (!serviceDetails) {
              throw new TRPCClientError(
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

      const applicableTaxIds = yacht.city.taxes.map((tax) => tax.id);

      const priceBreakdown = calculatePriceBreakdown(
        basePrice,
        yacht.length,
        yacht.city,
        input.bookingType,
        {
          additionalServices: additionalServicesDetails,
          deliveryCharge: additionalServicesDetails.length > 0 ? 50 : 0,
        },
      );

      const booking = await ctx.db.booking.create({
        data: {
          bookingDetailsAsStatic:
            input.bookingDetailsAsStatic as unknown as Prisma.InputJsonValue,
          startDate: input.startDate,
          endDate: input.endDate,
          guestCount: input.guestCount,
          totalPrice: priceBreakdown.totalPrice,
          affiliateId: input.affiliateId,
          basePrice: priceBreakdown.basePrice,
          yatrFee: priceBreakdown.yatrFee,
          cityLocalStartDate: input.cityLocalStartDate,
          cityLocalStartTime: input.cityLocalStartTime,
          cityLocalEndDate: input.cityLocalEndDate,
          processingFee: priceBreakdown.processingFee,
          deliveryCharge: additionalServicesDetails.length > 0 ? 50 : 0,
          bookingType: input.bookingType,
          bookingStatus: BookingStatus.Pending,
          termsAccepted: input.termsAccepted,
          paymentAccepted: input.paymentAccepted,
          inquiry: true,
          yacht: { connect: { id: yacht.id } },
          customer: { connect: { id: customer.id } },
          price: { connect: { id: price.id } },
          taxes: {
            connect: applicableTaxIds.map((id) => ({ id })),
          },
          ...(input.additionalServices && {
            services: {
              create: input.additionalServices.map((service) => ({
                quantity: service.quantity,
                additionalService: {
                  connect: { id: service.additionalServiceId },
                },
              })),
            },
          }),
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
          taxes: true,
        },
      });
      if (!booking) {
        throw new TRPCClientError("Booking not created");
      }

      // Send to GHL
      try {
        const bookingTypeText =
          input.bookingType === BookingType.SingleDay
            ? "Single Day"
            : input.bookingType === BookingType.MultiDay
              ? "Multi Day"
              : input.bookingType === BookingType.SingleDayEnquiry
                ? "Single Day Enquiry"
                : "Multi Day Enquiry";

        const ghlResult = await sendFormDataToGHL({
          email: input.email,
          phone: input.phoneNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          source: `YATR Webfront - ${bookingTypeText} Booking - ${yacht.name}`,
        });

        if (!ghlResult.success) {
          console.error("Failed to send booking to GHL:", ghlResult.error);
        }
      } catch (error) {
        console.error("Error sending booking to GHL:", error);
      }

      const emailHtml = await generateFinalBookingInquiryHtml({
        userName: `${booking.customer?.firstName ?? ""} ${booking.customer?.lastName ?? ""}`,
        checkInDate: booking.cityLocalStartDate ?? "",
        charterDate: `${new Date(booking.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} - ${new Date(booking.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
        pickUpTime: booking.cityLocalStartTime ?? "",
        location: `${booking.yacht?.city?.name ? `${booking.yacht?.city?.name}, ` : ""}${booking.yacht?.marina?.name ?? ""}`,
        yachtName: `${booking.yacht?.length ? `${booking.yacht?.length}' ` : ""}${booking.yacht?.name ?? ""}`,
        duration: booking.price?.duration.name ?? "",
        basePrice: (booking.basePrice + booking.yatrFee).toFixed(2),
        additionalServices: booking.services.map((service) => ({
          name: service.additionalService.name,
          quantity: service.quantity.toString(),
          value: (service.additionalService.price * service.quantity).toFixed(
            2,
          ),
        })),
        taxesAndFees: priceBreakdown.taxBreakdown.map((tax) => ({
          name: tax.name,
          value: tax.amount.toString(),
        })),
        total: booking.totalPrice.toFixed(2),
        bankProcessingFee: booking.processingFee.toFixed(2),
        deliveryFee: booking.deliveryCharge
          ? booking.deliveryCharge.toFixed(2)
          : undefined,
      });

      try {
        await mailgunClient.messages.create(env.MAILGUN_DOMAIN ?? "", {
          from: "Yatr Booking Inquiry <booking@yatr.co>",
          to: [booking.customer?.email ?? "anish+noemailfoundyatr@xamtac.com"],
          subject: `Your ${booking.cityLocalStartDate} Booking Details`,
          html: emailHtml,
        });
        await mailgunClient.messages.create(env.MAILGUN_DOMAIN ?? "", {
          from: "New Yatr booking confirmation <booking@yatr.co>",
          to: ["booking@yatr.co"],
          subject: "New booking inquiry has been made",
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
        throw new TRPCClientError("Failed to send email");
      }

      // Create Google Calendar event for yacht owner
      try {
        if (booking.yacht?.helmId) {
          const account = await ctx.db.account.findFirst({
            where: {
              userId: booking.yacht.helmId,
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

              await ctx.db.account.update({
                where: { id: account.id },
                data: {
                  access_token: refreshed.access_token,
                  expires_at: Math.floor(
                    (now + refreshed.expires_in * 1000) / 1000,
                  ),
                  scope: refreshed.scope ?? account.scope,
                  token_type: refreshed.token_type ?? account.token_type,
                  refresh_token:
                    refreshed.refresh_token ?? account.refresh_token,
                },
              });
            }

            const eventSummary = `${booking.yacht.name ?? "Yacht"} - Booking by ${booking.customer?.firstName ?? ""} ${booking.customer?.lastName ?? ""}`;
            const eventDescription = `Guest: ${booking.customer?.firstName ?? ""} ${booking.customer?.lastName ?? ""}\nEmail: ${booking.customer?.email ?? ""}\nPhone: ${booking.customer?.phoneNumber ?? ""}\nGuests: ${booking.guestCount}\nDuration: ${booking.price?.duration.name ?? ""}\nBooking ID: ${booking.bookingId}`;
            const eventLocation = booking.yacht.marina?.name
              ? `${booking.yacht.marina.name}, ${booking.yacht.city?.name ?? ""}`
              : (booking.yacht.city?.name ?? "");

            const isAllDay = booking.bookingType === BookingType.MultiDay;

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

      return booking;
    }),

  createPaymentIntentWithBankProcessingFee: publicProcedure
    .input(bookYachtInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const yacht = await ctx.db.yacht.findUnique({
          where: { id: input.yachtId },
          include: {
            city: {
              include: {
                taxes: {
                  where: {
                    bookingType: input.bookingType,
                  },
                  select: {
                    id: true,
                    name: true,
                    value: true,
                    bookingType: true,
                  },
                },
                yatrFees: {
                  where: {
                    bookingType: input.bookingType,
                  },
                  select: {
                    id: true,
                    type: true,
                    value: true,
                    bookingType: true,
                  },
                },
              },
            },
          },
        });

        if (!yacht) {
          throw new TRPCClientError("Yacht not found");
        }
        if (!yacht.city) {
          throw new TRPCClientError("City not found");
        }

        const price = await ctx.db.price.findUnique({
          where: { id: input.priceId },
          include: {
            duration: true,
          },
        });
        let nights = 0;
        if (!price) {
          throw new TRPCClientError("Price not found");
        }

        let basePrice = price.amount;

        if (price.duration.durationType === DurationType.SingleDay) {
          basePrice = price.amount;
        } else {
          nights = Math.ceil(
            (input.endDate.getTime() - input.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          if (price.duration.name === "Nightly") {
            basePrice = price.amount * nights;
          } else {
            const durationMatch = /(\d+)/.exec(price.duration.name);
            if (durationMatch) {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              const packageDays = Number.parseInt(durationMatch[1]!);
              if (nights > packageDays) {
                const additionalDays = nights - packageDays;
                const dailyRate = price.amount / packageDays;
                basePrice = price.amount + dailyRate * additionalDays;
              }
            }
          }
        }

        let additionalServicesDetails: ServiceDetails[] = [];
        if (input.additionalServices?.length) {
          additionalServicesDetails = await Promise.all(
            input.additionalServices.map(async (service) => {
              const serviceDetails = await ctx.db.additionalService.findUnique({
                where: { id: service.additionalServiceId },
                select: { price: true },
              });
              if (!serviceDetails) {
                throw new TRPCClientError(
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
          yacht.city,
          input.bookingType,
          {
            additionalServices: additionalServicesDetails,
            deliveryCharge: additionalServicesDetails.length > 0 ? 50 : 0,
          },
        );

        // Send to GHL - Payment Intent with Bank Processing Fee
        try {
          const bookingTypeText =
            input.bookingType === BookingType.SingleDay
              ? "Single Day"
              : input.bookingType === BookingType.MultiDay
                ? "Multi Day"
                : input.bookingType === BookingType.SingleDayEnquiry
                  ? "Single Day Enquiry"
                  : "Multi Day Enquiry";

          const ghlResult = await sendFormDataToGHL({
            email: input.email,
            phone: input.phoneNumber,
            firstName: input.firstName,
            lastName: input.lastName,
            source: `YATR Webfront - ${bookingTypeText} Payment Intent (Card/Klarna) - ${yacht.name}`,
          });

          if (!ghlResult.success) {
            console.error(
              "Failed to send payment intent to GHL:",
              ghlResult.error,
            );
          }
        } catch (error) {
          console.error("Error sending payment intent to GHL:", error);
        }

        const taxDescription = priceBreakdown.taxBreakdown
          .map((tax) => `${tax.name}: $${tax.amount.toFixed(2)}`)
          .join(", ");

        const bookingDescription =
          price.duration.durationType === DurationType.SingleDay
            ? `${price.duration.name} charter`
            : price.duration.name === "Nightly"
              ? `${nights} nights custom charter`
              : `${price.duration.name} charter`;

        const fullDescription = `${bookingDescription} | Taxes: ${taxDescription}`;
        const createdRedisOrderId = nanoid();
        await redis.set(
          createdRedisOrderId,
          JSON.stringify({
            ...input,
            taxBreakdown: priceBreakdown.taxBreakdown,
            processingFeeRequired: true,
          }),
        );

        return stripe.checkout.sessions.create({
          payment_method_types: ["klarna", "card"],
          metadata: {
            type: "yacht-booking",
            data: JSON.stringify({
              redisOrderId: createdRedisOrderId,
            }),
          },
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: yacht?.city?.currency === "EUR" ? "eur" : "usd",
                product_data: {
                  name: `Yacht Booking - ${yacht?.name} - ${yacht?.length}`,
                  description: fullDescription,
                },
                unit_amount: Math.round(priceBreakdown.totalPrice * 100),
              },
              quantity: 1,
            },
          ],
          allow_promotion_codes: true,
          success_url: `${
            env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
          }/payment/success`,
          cancel_url: `${
            env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
          }/payment/cancel`,
        });
      } catch (error) {
        console.error("Error creating payment intent", error);
        throw new TRPCClientError("Error creating payment intent");
      }
    }),
  createPaymentIntentWithoutBankProcessingFee: publicProcedure
    .input(bookYachtInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const yacht = await ctx.db.yacht.findUnique({
          where: { id: input.yachtId },
          include: {
            city: {
              include: {
                taxes: {
                  where: {
                    bookingType: input.bookingType,
                  },
                  select: {
                    id: true,
                    name: true,
                    value: true,
                    bookingType: true,
                  },
                },
                yatrFees: {
                  where: {
                    bookingType: input.bookingType,
                  },
                  select: {
                    id: true,
                    type: true,
                    value: true,
                    bookingType: true,
                  },
                },
              },
            },
          },
        });

        if (!yacht) {
          throw new TRPCClientError("Yacht not found");
        }
        if (!yacht.city) {
          throw new TRPCClientError("City not found");
        }

        const price = await ctx.db.price.findUnique({
          where: { id: input.priceId },
          include: {
            duration: true,
          },
        });
        let nights = 0;
        if (!price) {
          throw new TRPCClientError("Price not found");
        }

        let basePrice = price.amount;

        if (price.duration.durationType === DurationType.SingleDay) {
          basePrice = price.amount;
        } else {
          nights = Math.ceil(
            (input.endDate.getTime() - input.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          if (price.duration.name === "Nightly") {
            basePrice = price.amount * nights;
          } else {
            const durationMatch = /(\d+)/.exec(price.duration.name);
            if (durationMatch) {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              const packageDays = Number.parseInt(durationMatch[1]!);
              if (nights > packageDays) {
                const additionalDays = nights - packageDays;
                const dailyRate = price.amount / packageDays;
                basePrice = price.amount + dailyRate * additionalDays;
              }
            }
          }
        }

        let additionalServicesDetails: ServiceDetails[] = [];
        if (input.additionalServices?.length) {
          additionalServicesDetails = await Promise.all(
            input.additionalServices.map(async (service) => {
              const serviceDetails = await ctx.db.additionalService.findUnique({
                where: { id: service.additionalServiceId },
                select: { price: true },
              });
              if (!serviceDetails) {
                throw new TRPCClientError(
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

        const priceBreakdown = calculatePriceBreakdownWithoutProcessingFee(
          basePrice,
          yacht.length,
          yacht.city,
          input.bookingType,
          {
            additionalServices: additionalServicesDetails,
            deliveryCharge: additionalServicesDetails.length > 0 ? 50 : 0,
          },
        );

        // Send to GHL - Payment Intent without Bank Processing Fee
        try {
          const bookingTypeText =
            input.bookingType === BookingType.SingleDay
              ? "Single Day"
              : input.bookingType === BookingType.MultiDay
                ? "Multi Day"
                : input.bookingType === BookingType.SingleDayEnquiry
                  ? "Single Day Enquiry"
                  : "Multi Day Enquiry";

          const ghlResult = await sendFormDataToGHL({
            email: input.email,
            phone: input.phoneNumber,
            firstName: input.firstName,
            lastName: input.lastName,
            source: `YATR Webfront - ${bookingTypeText} Payment Intent (Bank Transfer) - ${yacht.name}`,
          });

          if (!ghlResult.success) {
            console.error(
              "Failed to send payment intent to GHL:",
              ghlResult.error,
            );
          }
        } catch (error) {
          console.error("Error sending payment intent to GHL:", error);
        }

        const taxDescription = priceBreakdown.taxBreakdown
          .map((tax) => `${tax.name}: $${tax.amount.toFixed(2)}`)
          .join(", ");

        const bookingDescription =
          price.duration.durationType === DurationType.SingleDay
            ? `${price.duration.name} charter`
            : price.duration.name === "Nightly"
              ? `${nights} nights custom charter`
              : `${price.duration.name} charter`;

        const fullDescription = `${bookingDescription} | Taxes: ${taxDescription}`;
        const createdRedisOrderId = nanoid();
        await redis.set(
          createdRedisOrderId,
          JSON.stringify({
            ...input,
            taxBreakdown: priceBreakdown.taxBreakdown,
            processingFeeRequired: false,
          }),
        );

        return stripe.checkout.sessions.create({
          payment_method_types: ["us_bank_account"],
          metadata: {
            type: "yacht-booking",
            data: JSON.stringify({
              redisOrderId: createdRedisOrderId,
            }),
          },
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: yacht?.city?.currency === "EUR" ? "eur" : "usd",
                product_data: {
                  name: `Yacht Booking - ${yacht?.name} - ${yacht?.length}`,
                  description: fullDescription,
                },
                unit_amount: Math.round(priceBreakdown.totalPrice * 100),
              },
              quantity: 1,
            },
          ],
          allow_promotion_codes: true,
          success_url: `${
            env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
          }/payment/success`,
          cancel_url: `${
            env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
          }/payment/cancel`,
        });
      } catch (error) {
        console.error("Error creating payment intent", error);
        throw new TRPCClientError("Error creating payment intent");
      }
    }),
  searchUsingAlgolia: publicProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(0),
        hitsPerPage: z.number().default(20),
      }),
    )
    .query(async ({ input }) => {
      try {
        const filters: string[] = [];

        // Extract length from query (e.g., "90 foot", "90ft", "90 feet")
        const lengthRegex = /(\d+)\s*(foot|ft|feet)/i;
        const lengthMatch = lengthRegex.exec(input.query || "");
        if (lengthMatch?.[1]) {
          const targetLength = parseInt(lengthMatch[1], 10);
          const min = Math.max(0, targetLength - 10);
          const max = targetLength + 10;
          filters.push(`length:${min} TO ${max}`);
        }

        // People / Pax – map to guests >= N if present
        const paxRegex = /(\d+)\s*(pax|people|guests)/i;
        const paxMatch = paxRegex.exec(input.query || "");
        if (paxMatch?.[1]) {
          const pax = parseInt(paxMatch[1], 10);
          filters.push(`(guests>=${pax} OR maxDayGuests>=${pax})`);
        }

        // Extract location strictly after "in " (e.g., "in Miami", "in Miami Beach")
        const locationRegex = /\bin\s+([A-Za-z][A-Za-z\s]*(?:Beach)?)/i;
        const locationMatch = locationRegex.exec(input.query || "");
        if (locationMatch?.[1]) {
          const location = locationMatch[1].trim();
          filters.push(`(city:"${location}" OR marina:"${location}")`);
        }

        // Extract amenities (e.g., "with water slide", "with jet ski")
        const amenityKeywords = {
          "water slide": "Water Slide",
          "jet ski": "Jet Ski",
          jacuzzi: "Jacuzzi",
          tender: "Tender",
          wifi: "WiFi",
          "paddle board": "Paddle Board",
          kayak: "Kayak",
        };

        const amenityFilters = [];
        for (const [keyword, amenityName] of Object.entries(amenityKeywords)) {
          if (input.query.toLowerCase().includes(keyword.toLowerCase())) {
            amenityFilters.push(`amenities:"${amenityName}"`);
          }
        }

        if (amenityFilters.length > 0) {
          filters.push(`(${amenityFilters.join(" AND ")})`);
        }

        // Motor Yacht / Power Yacht – motor-driven under 200 ft
        if (
          /\b(motor yacht|power yacht|powerboat|motorboat)\b/i.test(input.query)
        ) {
          filters.push("length:0 TO 199");
        }

        // Mega Yacht – any yacht over 200 ft
        if (/\bmega\s*yacht\b/i.test(input.query)) {
          filters.push("length:200 TO 10000");
        }

        // Superyacht – any yacht over 85 ft
        if (/(^|\b)super\s*yacht\b|\bsuperyacht\b/i.test(input.query)) {
          filters.push("length:85 TO 10000");
        }

        // Luxury / Premium – approximate by length >= 70
        if (
          /\bluxury(\s*yacht)?\b/i.test(input.query) ||
          /\bpremium\b/i.test(input.query)
        ) {
          filters.push("length:70 TO 10000");
        }

        // All Inclusive – Multi-day charters
        const hasAllInclusive = /\ball[-\s]?inclusive\b/i.test(input.query);
        if (hasAllInclusive) {
          filters.push('durationTypes:"MultiDay"');
        }

        // Cheaper / Affordable / Budget-Friendly – priced under $5,000 per day (use minSingleDayPrice)
        if (
          /\b(cheap|cheaper|affordable|budget( |-)?friendly|budget)\b/i.test(
            input.query,
          )
        ) {
          filters.push("minSingleDayPrice:0 TO 4999");
        }

        // Premium – priced above $5,000 per day (use minSingleDayPrice)
        if (/\bpremium\b/i.test(input.query)) {
          filters.push("minSingleDayPrice:5000 TO 10000000");
        }

        // Day / Half Day / Full Day – SingleDay
        const hasSingleDay =
          /\bhalf\s*day\b/i.test(input.query) ||
          /\bfull\s*day\b/i.test(input.query) ||
          /(^|\b)day\b/i.test(input.query);
        if (hasSingleDay) {
          filters.push('durationTypes:"SingleDay"');
        }

        // Weekend – MultiDay
        const hasWeekend = /\bweekend\b/i.test(input.query);
        if (hasWeekend) {
          filters.push('durationTypes:"MultiDay"');
        }

        // Resolve conflicting duration filters: prefer MultiDay if present
        if ((hasWeekend || hasAllInclusive) && hasSingleDay) {
          const i = filters.indexOf('durationTypes:"SingleDay"');
          if (i >= 0) filters.splice(i, 1);
        }

        // Only show active yachts
        filters.push("active:true");

        let finalQuery = input.query;
        const keywordPattern =
          /(\d+\s*(pax|people|guests|ft|foot|feet))|\b(motor yacht|power yacht|powerboat|motorboat|mega\s*yacht|super\s*yacht|superyacht|luxury(\s*yacht)?|premium|all[-\s]?inclusive|cheap|cheaper|affordable|budget( |-)?friendly|budget|half\s*day|full\s*day|weekend|crewed)\b/gi;
        let stripped = finalQuery.replace(keywordPattern, "").trim();
        // If what's left is only generic words like "yacht"/"yachts", drop the query
        if (/^(yacht|yachts)$/i.test(stripped)) {
          stripped = "";
        }
        if (!stripped) {
          finalQuery = "";
        }

        const searchResponse = await algoliaClient.search({
          requests: [
            {
              indexName: env.NEXT_PUBLIC_YACHT_INDEX_NAME,
              query: finalQuery,
              filters: filters.join(" AND "),
              // page: input.page,
              // hitsPerPage: input.hitsPerPage,
              // getRankingInfo: true,
              // analytics: true,
              // enableABTest: true,
              // clickAnalytics: true,
              // facets: ["amenities", "city", "marina", "length"],
              // maxValuesPerFacet: 100,
            },
          ],
        });

        const searchResult = searchResponse
          .results[0] as unknown as AlgoliaSearchResult<AlgoliaYacht>;

        const processedHits = searchResult?.hits?.map((hit) => ({
          ...hit,
          id: hit.id ?? "",
          slug: hit.slug ?? "",
        }));

        return {
          hits: processedHits ?? [],
          nbHits: searchResult?.nbHits ?? 0,
          page: searchResult?.page ?? 0,
          nbPages: searchResult?.nbPages ?? 0,
          hitsPerPage: searchResult?.hitsPerPage ?? input.hitsPerPage,
          processingTimeMS: searchResult?.processingTimeMS ?? 0,
          query: searchResult?.query ?? input.query,
          params: searchResult?.params ?? "",
          exhaustiveNbHits: searchResult?.exhaustiveNbHits ?? false,
          facets: searchResult?.facets ?? {},
          results: searchResponse?.results,
        };
      } catch (error) {
        console.error("Error performing search:", error);
        throw error;
      }
    }),
  searchUsingAlgoliaWithYachtData: publicProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(0),
        hitsPerPage: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const filters: string[] = [];

        // Extract length from query (e.g., "90 foot", "90ft", "90 feet")
        const lengthRegex = /(\d+)\s*(foot|ft|feet)/i;
        const lengthMatch = lengthRegex.exec(input.query || "");
        if (lengthMatch?.[1]) {
          const targetLength = parseInt(lengthMatch[1], 10);
          const min = Math.max(0, targetLength - 10);
          const max = targetLength + 10;
          filters.push(`length:${min} TO ${max}`);
        }

        // People / Pax
        const paxRegex = /(\d+)\s*(pax|people|guests)/i;
        const paxMatch = paxRegex.exec(input.query || "");
        if (paxMatch?.[1]) {
          const pax = parseInt(paxMatch[1], 10);
          filters.push(`(guests>=${pax} OR maxDayGuests>=${pax})`);
        }

        // Extract location strictly after "in " (e.g., "in Miami", "in Miami Beach")
        const locationRegex = /\bin\s+([A-Za-z][A-Za-z\s]*(?:Beach)?)/i;
        const locationMatch = locationRegex.exec(input.query || "");
        if (locationMatch?.[1]) {
          const location = locationMatch[1].trim();
          filters.push(`(city:"${location}" OR marina:"${location}")`);
        }

        // Extract amenities (e.g., "with water slide", "with jet ski")
        const amenityKeywords = {
          "water slide": "Water Slide",
          "jet ski": "Jet Ski",
          jacuzzi: "Jacuzzi",
          tender: "Tender",
          wifi: "WiFi",
          "paddle board": "Paddle Board",
          kayak: "Kayak",
        };

        const amenityFilters = [];
        for (const [keyword, amenityName] of Object.entries(amenityKeywords)) {
          if (input.query.toLowerCase().includes(keyword.toLowerCase())) {
            amenityFilters.push(`amenities:"${amenityName}"`);
          }
        }

        if (amenityFilters.length > 0) {
          filters.push(`(${amenityFilters.join(" AND ")})`);
        }

        // Keyword-derived filters (same set as above)
        if (
          /\b(motor yacht|power yacht|powerboat|motorboat)\b/i.test(input.query)
        ) {
          filters.push("length:0 TO 199");
        }
        if (/\bmega\s*yacht\b/i.test(input.query)) {
          filters.push("length:200 TO 10000");
        }
        if (/(^|\b)super\s*yacht\b|\bsuperyacht\b/i.test(input.query)) {
          filters.push("length:85 TO 10000");
        }
        if (
          /\bluxury(\s*yacht)?\b/i.test(input.query) ||
          /\bpremium\b/i.test(input.query)
        ) {
          filters.push("length:70 TO 10000");
        }
        if (/\ball[-\s]?inclusive\b/i.test(input.query)) {
          filters.push('durationTypes:"MultiDay"');
        }
        if (
          /\b(cheap|cheaper|affordable|budget( |-)?friendly|budget)\b/i.test(
            input.query,
          )
        ) {
          filters.push("prices.amount:0 TO 4999");
        }
        if (/\bpremium\b/i.test(input.query)) {
          filters.push("prices.amount:5000 TO 10000000");
        }
        if (
          /\bhalf\s*day\b/i.test(input.query) ||
          /\bfull\s*day\b/i.test(input.query) ||
          /(^|\b)day\b/i.test(input.query)
        ) {
          filters.push('durationTypes:"SingleDay"');
        }
        if (/\bweekend\b/i.test(input.query)) {
          filters.push('durationTypes:"MultiDay"');
        }

        // Only show active yachts
        filters.push("active:true");

        // If only recognized keywords, blank the query
        let finalQuery = input.query;
        const keywordPattern =
          /(\d+\s*(pax|people|guests|ft|foot|feet))|\b(motor yacht|power yacht|powerboat|motorboat|mega\s*yacht|super\s*yacht|superyacht|luxury(\s*yacht)?|premium|all[-\s]?inclusive|cheap|cheaper|affordable|budget( |-)?friendly|budget|half\s*day|full\s*day|day|weekend)\b/gi;
        let stripped = finalQuery.replace(keywordPattern, "").trim();
        if (/^(yacht|yachts)$/i.test(stripped)) {
          stripped = "";
        }
        if (!stripped) {
          finalQuery = "";
        }

        const searchResponse = await algoliaClient.search({
          requests: [
            {
              indexName: env.NEXT_PUBLIC_YACHT_INDEX_NAME,
              query: finalQuery,
              filters: filters.join(" AND "),
            },
          ],
        });

        const searchResult = searchResponse
          .results[0] as unknown as AlgoliaSearchResult<AlgoliaYacht>;

        const hitsIds = searchResult?.hits?.map((hit) => hit.objectID);

        const yachts = await ctx.db.yacht.findMany({
          where: {
            id: {
              in: hitsIds?.filter((id): id is string => id !== undefined),
            },
          },
          include: {
            city: {
              include: {
                yatrFees: true,
                taxes: true,
              },
            },
            marina: true,
            amenities: {
              where: {
                active: true,
              },
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            prices: {
              include: {
                duration: true,
              },
              orderBy: {
                amount: "asc",
              },
            },
            additionalServiceList: {
              include: {
                services: true,
                categories: true,
              },
            },
            seo: true,
          },
        });

        return yachts;
      } catch (error) {
        console.error("Error performing search:", error);
        throw error;
      }
    }),
});

interface ServiceDetails {
  quantity: number;
  additionalService: {
    price: number;
  };
}
