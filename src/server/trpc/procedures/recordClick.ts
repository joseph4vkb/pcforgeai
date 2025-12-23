import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const recordClick = baseProcedure
  .input(
    z.object({
      targetType: z.enum(["Part", "Laptop", "Build", "Monitor", "Headset", "MiniPC"]),
      targetId: z.string(),
      targetName: z.string(),
      metadata: z.record(z.any()).optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Check if metric already exists
    const existingMetric = await db.clickMetric.findFirst({
      where: {
        targetType: input.targetType,
        targetId: input.targetId,
      },
    });

    if (existingMetric) {
      // Update existing metric
      await db.clickMetric.update({
        where: { id: existingMetric.id },
        data: {
          clicks: existingMetric.clicks + 1,
          lastClickedAt: new Date(),
          targetName: input.targetName, // Update name in case it changed
          metadata: input.metadata,
        },
      });
    } else {
      // Create new metric
      await db.clickMetric.create({
        data: {
          targetType: input.targetType,
          targetId: input.targetId,
          targetName: input.targetName,
          clicks: 1,
          lastClickedAt: new Date(),
          metadata: input.metadata,
        },
      });
    }

    return { success: true };
  });
