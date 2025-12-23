import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getHomepageBlogs = baseProcedure
  .input(
    z.object({
      limit: z.number().min(3).max(6).default(6),
    })
  )
  .query(async ({ input }) => {
    const posts = await db.blogPost.findMany({
      where: { status: "published" },
      take: input.limit,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        metaDescription: true,
        category: true,
        readingTime: true,
        featuredImage: true,
        publishedAt: true,
      },
    });

    return posts;
  });
