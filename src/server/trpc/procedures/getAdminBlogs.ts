import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const getAdminBlogs = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      cursor: z.number().optional(),
      limit: z.number().min(1).max(100).default(10),
      status: z.enum(["draft", "published", "all"]).default("all"),
    })
  )
  .query(async ({ input }) => {
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required. Only admins can view all blog posts.",
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

    const limit = input.limit;
    const cursor = input.cursor;

    // Build where clause
    const where: any = {};
    if (input.status !== "all") {
      where.status = input.status;
    }

    // Fetch blog posts with pagination
    const posts = await db.blogPost.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        build: {
          select: {
            id: true,
            category: true,
            totalCost: true,
          },
        },
      },
    });

    let nextCursor: number | undefined = undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    return {
      posts,
      nextCursor,
    };
  });
