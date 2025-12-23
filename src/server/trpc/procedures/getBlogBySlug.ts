import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getBlogBySlug = baseProcedure
  .input(
    z.object({
      slug: z.string(),
      authToken: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    // Check if user is admin (for draft access)
    let isAdmin = false;
    if (input.authToken) {
      try {
        const jwt = await import("jsonwebtoken");
        const { env } = await import("~/server/env");
        const verified = jwt.default.verify(input.authToken, env.JWT_SECRET);
        const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
        isAdmin = parsed.role === "admin";
      } catch (error) {
        // Invalid token - continue as non-admin
        isAdmin = false;
      }
    }

    const post = await db.blogPost.findUnique({
      where: { slug: input.slug },
      include: {
        build: {
          select: {
            id: true,
            category: true,
            totalCost: true,
            parts: true,
            compatibility: true,
          },
        },
      },
    });

    // Allow admins to view drafts, others only see published posts
    if (!post || (!isAdmin && post.status !== "published")) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Blog post not found",
      });
    }

    return post;
  });
