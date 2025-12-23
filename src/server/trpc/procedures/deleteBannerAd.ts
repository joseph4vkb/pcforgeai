import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const deleteBannerAd = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      adId: z.number(),
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
          message: "Admin access required. Only admins can delete banner ads.",
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

    // Delete the banner ad (clicks will be cascade deleted)
    await db.bannerAd.delete({
      where: { id: input.adId },
    });

    return {
      success: true,
    };
  });
