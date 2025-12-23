import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getRelatedBlogPosts = baseProcedure
  .input(
    z.object({
      currentPostId: z.number(),
      category: z.string(),
      tags: z.array(z.string()),
    })
  )
  .query(async ({ input }) => {
    const { currentPostId, category, tags } = input;

    // Strategy: Find posts that match category OR have overlapping tags
    // We'll fetch posts matching category first, then posts with matching tags
    // and combine them, prioritizing those that match both
    
    const relatedPosts = await db.blogPost.findMany({
      where: {
        status: "published",
        id: { not: currentPostId },
        OR: [
          { category },
          ...(tags.length > 0
            ? tags.map((tag) => ({
                tags: {
                  array_contains: tag,
                },
              }))
            : []),
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        metaDescription: true,
        category: true,
        tags: true,
        readingTime: true,
        featuredImage: true,
        publishedAt: true,
      },
      take: 10, // Get more than needed so we can sort by relevance
      orderBy: { publishedAt: "desc" },
    });

    // Score posts by relevance
    const scoredPosts = relatedPosts.map((post) => {
      let score = 0;
      
      // +2 points for matching category
      if (post.category === category) {
        score += 2;
      }
      
      // +1 point for each matching tag
      const postTags = Array.isArray(post.tags) ? (post.tags as string[]) : [];
      const matchingTags = postTags.filter((tag) => tags.includes(tag));
      score += matchingTags.length;
      
      return { ...post, score };
    });

    // Sort by score (descending) and return top 3
    const topPosts = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score, ...post }) => post); // Remove score from final result

    return topPosts;
  });
