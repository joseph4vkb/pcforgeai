import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const getBannerAdById = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      adId: z.number(),
    })
  )
  .query(async ({ input }) => {
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required. Only admins can view banner ad details.",
        });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    // Fetch the banner ad
    const bannerAd = await db.bannerAd.findUnique({
      where: { id: input.adId },
      include: {
        _count: {
          select: {
            clicks: true,
          },
        },
      },
    });

    if (!bannerAd) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Banner ad not found",
      });
    }

    return {
      id: bannerAd.id,
      name: bannerAd.name,
      imageUrl: bannerAd.imageUrl,
      destinationUrl: bannerAd.destinationUrl,
      locationKey: bannerAd.locationKey,
      isActive: bannerAd.isActive,
      startDate: bannerAd.startDate,
      endDate: bannerAd.endDate,
      priority: bannerAd.priority,
      htmlContent: bannerAd.htmlContent,
      createdAt: bannerAd.createdAt,
      updatedAt: bannerAd.updatedAt,
      clickCount: bannerAd._count.clicks,
    };
  });
