import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

export const createBlogPost = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      title: z.string(),
      metaDescription: z.string(),
      content: z.string(),
      tags: z.array(z.string()),
      category: z.string(),
      seoKeywords: z.array(z.string()),
      buildId: z.number().optional(),
      wordCount: z.number(),
      readingTime: z.number(),
      status: z.enum(["draft", "published"]).default("draft"),
      featuredImage: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required. Only admins can create blog posts.",
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

    // Generate unique slug
    let slug = generateSlug(input.title);
    let slugExists = await db.blogPost.findUnique({ where: { slug } });
    let counter = 1;
    
    while (slugExists) {
      slug = `${generateSlug(input.title)}-${counter}`;
      slugExists = await db.blogPost.findUnique({ where: { slug } });
      counter++;
    }

    // Create the blog post
    const blogPost = await db.blogPost.create({
      data: {
        slug,
        title: input.title,
        metaDescription: input.metaDescription,
        content: input.content,
        tags: input.tags,
        category: input.category,
        seoKeywords: input.seoKeywords,
        buildId: input.buildId,
        wordCount: input.wordCount,
        readingTime: input.readingTime,
        status: input.status,
        featuredImage: input.featuredImage,
        imageSuggestions: [],
        publishedAt: input.status === "published" ? new Date() : null,
      },
    });

    return blogPost;
  });
