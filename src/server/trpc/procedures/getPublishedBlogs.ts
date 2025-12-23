import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getPublishedBlogs = baseProcedure
  .input(
    z.object({
      cursor: z.number().optional(),
      limit: z.number().min(1).max(50).default(12),
      category: z.string().optional(),
      tag: z.string().optional(),
      search: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const limit = input.limit;
    const cursor = input.cursor;

    // Build where clause
    const where: any = { status: "published" };
    
    if (input.category) {
      where.category = input.category;
    }
    
    if (input.tag) {
      where.tags = {
        array_contains: input.tag,
      };
    }
    
    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: "insensitive" } },
        { metaDescription: { contains: input.search, mode: "insensitive" } },
        { content: { contains: input.search, mode: "insensitive" } },
      ];
    }

    // Fetch published blog posts with pagination
    const posts = await db.blogPost.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        metaDescription: true,
        tags: true,
        category: true,
        wordCount: true,
        readingTime: true,
        featuredImage: true,
        publishedAt: true,
        createdAt: true,
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
