import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getFilteredBuilds = baseProcedure
  .input(
    z.object({
      category: z.string().optional(),
      sortByPrice: z.enum(["asc", "desc"]).optional(),
      page: z.number().default(1),
    })
  )
  .query(async ({ input }) => {
    const itemsPerPage = 9;
    const skip = (input.page - 1) * itemsPerPage;

    // Build where clause for category filter
    const whereClause: any = {};
    if (input.category && input.category !== "All") {
      whereClause.category = input.category;
    }

    // Get total count
    const totalCount = await db.pcBuild.count({
      where: whereClause,
    });

    // Build orderBy clause
    const orderByClause: any = [];
    if (input.sortByPrice) {
      orderByClause.push({ totalCost: input.sortByPrice });
    }
    orderByClause.push({ createdAt: "desc" });

    // Fetch builds with filters and pagination
    const builds = await db.pcBuild.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip,
      take: itemsPerPage,
    });

    // Check if there are more pages
    const hasMore = totalCount > input.page * itemsPerPage;

    return {
      builds,
      hasMore,
      totalCount,
      currentPage: input.page,
      totalPages: Math.ceil(totalCount / itemsPerPage),
    };
  });
