import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

const partSchema = z.object({
  category: z.string(),
  name: z.string(),
  asin: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
});

export const saveBuild = baseProcedure
  .input(
    z.object({
      category: z.string(),
      budget: z.number(),
      parts: z.array(partSchema),
      totalCost: z.number(),
      compatibility: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    // Calculate the actual total cost from parts to ensure accuracy
    const actualTotalCost = input.parts.reduce((sum, part) => sum + part.price, 0);

    const build = await db.pcBuild.create({
      data: {
        category: input.category,
        budget: input.budget,
        parts: input.parts,
        totalCost: actualTotalCost, // Use calculated total instead of input totalCost
        compatibility: input.compatibility,
        isFeatured: false,
      },
    });

    return build;
  });
