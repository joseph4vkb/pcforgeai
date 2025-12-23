import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const getPaginatedSavedBuilds = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      page: z.number().default(1),
      category: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      searchQuery: z.string().optional(),
      sortBy: z.enum(["date", "price", "compatibility"]).default("date"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
  )
  .query(async ({ input }) => {
    // Verify token and extract account id and role
    let accountId: number;
    let role: "admin" | "user";
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      accountId = parsed.id;
      role = parsed.role;
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    const itemsPerPage = 12;
    const skip = (input.page - 1) * itemsPerPage;

    // Build where clause
    const whereClause: any = role === "user" ? { userId: accountId } : { adminId: accountId };

    // Add category filter
    if (input.category && input.category !== "All") {
      whereClause.category = input.category;
    }

    // Add price range filters
    if (input.minPrice !== undefined) {
      whereClause.totalCost = {
        ...whereClause.totalCost,
        gte: input.minPrice,
      };
    }
    if (input.maxPrice !== undefined) {
      whereClause.totalCost = {
        ...whereClause.totalCost,
        lte: input.maxPrice,
      };
    }

    // Search is more complex - we need to search in parts JSON
    // For now, we'll fetch all matching builds and filter in memory if search is provided
    let builds;
    let totalCount;

    if (input.searchQuery) {
      // Fetch all builds for this user
      const allBuilds = await db.pcBuild.findMany({
        where: whereClause,
      });

      // Filter by search query in parts
      const searchLower = input.searchQuery.toLowerCase();
      const filteredBuilds = allBuilds.filter((build) => {
        const parts = build.parts as any[];
        return parts.some((part) => 
          part.name?.toLowerCase().includes(searchLower) ||
          part.category?.toLowerCase().includes(searchLower)
        );
      });

      totalCount = filteredBuilds.length;

      // Apply sorting
      filteredBuilds.sort((a, b) => {
        let comparison = 0;
        if (input.sortBy === "price") {
          comparison = a.totalCost - b.totalCost;
        } else if (input.sortBy === "compatibility") {
          comparison = a.compatibility - b.compatibility;
        } else {
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
        }
        return input.sortOrder === "asc" ? comparison : -comparison;
      });

      // Apply pagination
      builds = filteredBuilds.slice(skip, skip + itemsPerPage);
    } else {
      // No search - use database sorting and pagination
      totalCount = await db.pcBuild.count({ where: whereClause });

      // Build orderBy clause
      const orderByClause: any = [];
      if (input.sortBy === "price") {
        orderByClause.push({ totalCost: input.sortOrder });
      } else if (input.sortBy === "compatibility") {
        orderByClause.push({ compatibility: input.sortOrder });
      } else {
        orderByClause.push({ createdAt: input.sortOrder });
      }

      builds = await db.pcBuild.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: itemsPerPage,
      });
    }

    return {
      builds,
      totalCount,
      currentPage: input.page,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      hasMore: totalCount > input.page * itemsPerPage,
    };
  });
