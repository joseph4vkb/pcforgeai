import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const deleteBlogPost = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      slug: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("deleteBlogPost called with slug:", input.slug);
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);

      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required. Only admins can delete blog posts.",
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

    // Check if blog post exists
    const existingPost = await db.blogPost.findUnique({
      where: { slug: input.slug },
    });

    if (!existingPost) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Blog post not found",
      });
    }

    // Delete the blog post
    await db.blogPost.delete({
      where: { slug: input.slug },
    });
    console.log("deleteBlogPost: Successfully deleted", input.slug);

    return { success: true };
  });
