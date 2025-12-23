import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const updateBannerAd = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      adId: z.number(),
      name: z.string().min(1).max(100).optional(),
      imageUrl: z.string().url().optional().nullable(),
      destinationUrl: z.string().url().optional().nullable(),
      locationKey: z.string().min(1).optional(),
      isActive: z.boolean().optional(),
      startDate: z.string().datetime().optional().nullable(),
      endDate: z.string().datetime().optional().nullable(),
      priority: z.number().int().min(1).max(100).optional(),
      htmlContent: z.string().optional().nullable(),
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
          message: "Admin access required. Only admins can update banner ads.",
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

    // Check if banner ad exists
    const existingAd = await db.bannerAd.findUnique({
      where: { id: input.adId },
    });

    if (!existingAd) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Banner ad not found",
      });
    }

    // Build update data object
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
    if (input.destinationUrl !== undefined) updateData.destinationUrl = input.destinationUrl;
    if (input.locationKey !== undefined) updateData.locationKey = input.locationKey;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.startDate !== undefined) {
      updateData.startDate = input.startDate ? new Date(input.startDate) : null;
    }
    if (input.endDate !== undefined) {
      updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    }
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.htmlContent !== undefined) updateData.htmlContent = input.htmlContent;

    // Update the banner ad
    await db.bannerAd.update({
      where: { id: input.adId },
      data: updateData,
    });

    return {
      success: true,
    };
  });
