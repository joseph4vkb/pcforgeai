import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getBlogCategories = baseProcedure
  .query(async () => {
    const categories = await db.blogPost.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: "desc",
        },
      },
    });

    return categories.map(cat => ({
      name: cat.category,
      count: cat._count.category,
    }));
  });
