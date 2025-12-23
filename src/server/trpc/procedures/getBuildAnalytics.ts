import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const getBuildAnalytics = baseProcedure
  .input(z.object({ authToken: z.string() }))
  .query(async ({ input }) => {
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
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

    // Get total builds count
    const totalBuilds = await db.pcBuild.count();

    // Get build category distribution
    const categoryDistribution = await db.pcBuild.groupBy({
      by: ["category"],
      _count: true,
      orderBy: {
        _count: {
          category: "desc",
        },
      },
    });

    // Get popular builds (most clicked)
    const popularBuilds = await db.clickMetric.findMany({
      where: {
        targetType: "Build",
      },
      orderBy: {
        clicks: "desc",
      },
      take: 10,
    });

    // Get build IDs to fetch full build data
    const buildIds = popularBuilds
      .map((metric) => parseInt(metric.targetId))
      .filter((id) => !isNaN(id));

    const builds = await db.pcBuild.findMany({
      where: {
        id: { in: buildIds },
      },
    });

    // Merge click data with build data
    const popularBuildsWithData = popularBuilds
      .map((metric) => {
        const build = builds.find((b) => b.id.toString() === metric.targetId);
        return build
          ? {
              ...build,
              clicks: metric.clicks,
              lastClickedAt: metric.lastClickedAt,
            }
          : null;
      })
      .filter((b) => b !== null);

    // Get most clicked components by category
    const componentClicks = await db.clickMetric.findMany({
      where: {
        targetType: "Part",
      },
      orderBy: {
        clicks: "desc",
      },
      take: 50,
    });

    // Group by category
    const clicksByCategory: Record<string, any[]> = {};
    componentClicks.forEach((metric) => {
      const category = metric.metadata && typeof metric.metadata === 'object' && 'category' in metric.metadata
        ? String(metric.metadata.category)
        : "Unknown";
      
      if (!clicksByCategory[category]) {
        clicksByCategory[category] = [];
      }
      
      if (clicksByCategory[category].length < 5) {
        clicksByCategory[category].push({
          name: metric.targetName,
          clicks: metric.clicks,
          asin: metric.targetId,
          metadata: metric.metadata,
        });
      }
    });

    // Get total clicks
    const totalClicks = await db.clickMetric.aggregate({
      _sum: {
        clicks: true,
      },
    });

    return {
      totalBuilds,
      totalClicks: totalClicks._sum.clicks || 0,
      categoryDistribution: categoryDistribution.map((cat) => ({
        category: cat.category,
        count: cat._count,
      })),
      popularBuilds: popularBuildsWithData,
      topComponentsByCategory: clicksByCategory,
    };
  });
