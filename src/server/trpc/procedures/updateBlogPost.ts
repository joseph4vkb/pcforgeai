import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const updateBlogPost = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      slug: z.string(),
      title: z.string().optional(),
      metaDescription: z.string().optional(),
      content: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      seoKeywords: z.array(z.string()).optional(),
      wordCount: z.number().optional(),
      readingTime: z.number().optional(),
      status: z.enum(["draft", "published"]).optional(),
      featuredImage: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("updateBlogPost called for slug:", input.slug);
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);

      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required. Only admins can update blog posts.",
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

    // Prepare update data
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.seoKeywords !== undefined) updateData.seoKeywords = input.seoKeywords;
    if (input.wordCount !== undefined) updateData.wordCount = input.wordCount;
    if (input.readingTime !== undefined) updateData.readingTime = input.readingTime;
    if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;

    // Handle status change
    if (input.status !== undefined) {
      updateData.status = input.status;
      // Set publishedAt when publishing for the first time
      if (input.status === "published" && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }
      // Clear publishedAt when reverting to draft
      if (input.status === "draft") {
        updateData.publishedAt = null;
      }
    }

    // Update the blog post
    const updatedPost = await db.blogPost.update({
      where: { slug: input.slug },
      data: updateData,
    });
    console.log("updateBlogPost: Successfully updated", input.slug);

    return updatedPost;
  });
