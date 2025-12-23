import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const createBannerAd = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      name: z.string().min(1).max(100),
      imageUrl: z.string().url().optional(),
      destinationUrl: z.string().url().optional(),
      locationKey: z.string().min(1),
      isActive: z.boolean().default(false),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      priority: z.number().int().min(1).max(100).default(1),
      htmlContent: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required. Only admins can create banner ads.",
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

    // Validate that either imageUrl/destinationUrl OR htmlContent is provided
    if (!input.htmlContent && (!input.imageUrl || !input.destinationUrl)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either provide imageUrl and destinationUrl, or htmlContent",
      });
    }

    // Create the banner ad
    const bannerAd = await db.bannerAd.create({
      data: {
        name: input.name,
        imageUrl: input.imageUrl,
        destinationUrl: input.destinationUrl,
        locationKey: input.locationKey,
        isActive: input.isActive,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        priority: input.priority,
        htmlContent: input.htmlContent,
      },
    });

    return {
      success: true,
      adId: bannerAd.id,
    };
  });
