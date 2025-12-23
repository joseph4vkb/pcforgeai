import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const listBannerAds = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      locationKey: z.string().optional(),
      isActive: z.boolean().optional(),
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
          message: "Admin access required. Only admins can list banner ads.",
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

    // Build where clause
    const where: any = {};
    if (input.locationKey) {
      where.locationKey = input.locationKey;
    }
    if (input.isActive !== undefined) {
      where.isActive = input.isActive;
    }

    // Fetch banner ads with click counts
    const bannerAds = await db.bannerAd.findMany({
      where,
      include: {
        _count: {
          select: {
            clicks: true,
          },
        },
      },
      orderBy: [
        { isActive: "desc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return bannerAds.map((ad) => ({
      id: ad.id,
      name: ad.name,
      imageUrl: ad.imageUrl,
      destinationUrl: ad.destinationUrl,
      locationKey: ad.locationKey,
      isActive: ad.isActive,
      startDate: ad.startDate,
      endDate: ad.endDate,
      priority: ad.priority,
      htmlContent: ad.htmlContent,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
      clickCount: ad._count.clicks,
    }));
  });
