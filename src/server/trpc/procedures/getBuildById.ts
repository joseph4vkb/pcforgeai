import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getBuildById = baseProcedure
  .input(z.object({ buildId: z.number() }))
  .query(async ({ input }) => {
    const build = await db.pcBuild.findUnique({
      where: { id: input.buildId },
    });

    if (!build) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Build not found",
      });
    }

    return build;
  });
