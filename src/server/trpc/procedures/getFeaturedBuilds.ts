import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getFeaturedBuilds = baseProcedure.query(async () => {
  const builds = await db.pcBuild.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return builds;
});
