import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getActiveBanners = baseProcedure
  .input(z.object({}).optional())
  .query(async () => {
    const now = new Date();

    // Fetch all active banner ads
    // An ad is active if:
    // 1. isActive is true, AND
    // 2. Either no dates are set (always active), OR
    // 3. Current time is within the date range
    const bannerAds = await db.bannerAd.findMany({
      where: {
        isActive: true,
        OR: [
          // Case 1: No dates set - always active
          {
            startDate: null,
            endDate: null,
          },
          // Case 2: Only start date set - active after start
          {
            startDate: { lte: now },
            endDate: null,
          },
          // Case 3: Only end date set - active until end
          {
            startDate: null,
            endDate: { gte: now },
          },
          // Case 4: Both dates set - active within range
          {
            startDate: { lte: now },
            endDate: { gte: now },
          },
        ],
      },
      select: {
        id: true,
        imageUrl: true,
        destinationUrl: true,
        locationKey: true,
        priority: true,
        htmlContent: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    return bannerAds;
  });
