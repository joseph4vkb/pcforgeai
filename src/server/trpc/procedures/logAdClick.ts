import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const logAdClick = baseProcedure
  .input(
    z.object({
      adId: z.number(),
      metadata: z.record(z.any()).optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Verify the ad exists
    const ad = await db.bannerAd.findUnique({
      where: { id: input.adId },
    });

    if (!ad) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Banner ad not found",
      });
    }

    // Log the click
    await db.adClick.create({
      data: {
        adId: input.adId,
        metadata: input.metadata || {},
      },
    });

    return {
      success: true,
      destinationUrl: ad.destinationUrl,
    };
  });
