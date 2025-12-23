import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const getLaptopAnalytics = baseProcedure
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

    // Get total laptop recommendations from builds
    const allBuilds = await db.pcBuild.findMany({});
    const buildsWithLaptops = allBuilds.filter(build => build.laptops && Array.isArray(build.laptops) && (build.laptops as any[]).length > 0);

    // Count total unique laptops
    const allLaptops = new Set<string>();
    buildsWithLaptops.forEach((build) => {
      if (build.laptops && Array.isArray(build.laptops)) {
        (build.laptops as any[]).forEach((laptop) => {
          if (laptop.name) {
            allLaptops.add(laptop.name);
          }
        });
      }
    });

    // Get popular laptops (most clicked)
    const popularLaptops = await db.clickMetric.findMany({
      where: {
        targetType: "Laptop",
      },
      orderBy: {
        clicks: "desc",
      },
      take: 20,
    });

    // Get brand distribution from clicks
    const brandClicks: Record<string, number> = {};
    popularLaptops.forEach((metric) => {
      const brand = metric.metadata && typeof metric.metadata === 'object' && 'brand' in metric.metadata
        ? String(metric.metadata.brand)
        : "Unknown";

      brandClicks[brand] = (brandClicks[brand] || 0) + metric.clicks;
    });

    const topBrands = Object.entries(brandClicks)
      .map(([brand, clicks]) => ({ brand, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Analyze frequently clicked components (processor, RAM, GPU)
    const processorClicks: Record<string, number> = {};
    const ramClicks: Record<string, number> = {};
    const gpuClicks: Record<string, number> = {};

    popularLaptops.forEach((metric) => {
      if (metric.metadata && typeof metric.metadata === 'object') {
        const metadata = metric.metadata as any;

        if (metadata.processor) {
          processorClicks[metadata.processor] = (processorClicks[metadata.processor] || 0) + metric.clicks;
        }

        if (metadata.ram) {
          ramClicks[metadata.ram] = (ramClicks[metadata.ram] || 0) + metric.clicks;
        }

        if (metadata.gpu) {
          gpuClicks[metadata.gpu] = (gpuClicks[metadata.gpu] || 0) + metric.clicks;
        }
      }
    });

    const topProcessors = Object.entries(processorClicks)
      .map(([processor, clicks]) => ({ processor, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const topRamConfigs = Object.entries(ramClicks)
      .map(([ram, clicks]) => ({ ram, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const topGpus = Object.entries(gpuClicks)
      .map(([gpu, clicks]) => ({ gpu, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Get total laptop clicks
    const totalLaptopClicks = await db.clickMetric.aggregate({
      where: {
        targetType: "Laptop",
      },
      _sum: {
        clicks: true,
      },
    });

    return {
      totalLaptops: allLaptops.size,
      totalBuildsWithLaptops: buildsWithLaptops.length,
      totalClicks: totalLaptopClicks._sum.clicks || 0,
      popularLaptops: popularLaptops.map((metric) => ({
        name: metric.targetName,
        clicks: metric.clicks,
        url: metric.targetId,
        metadata: metric.metadata,
        lastClickedAt: metric.lastClickedAt,
      })),
      topBrands,
      topProcessors,
      topRamConfigs,
      topGpus,
    };
  });
