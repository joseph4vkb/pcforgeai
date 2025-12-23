import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const updateBuild = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      buildId: z.number(),
      isFeatured: z.boolean(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
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

    const build = await db.pcBuild.findUnique({
      where: { id: input.buildId },
    });

    if (!build) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Build not found",
      });
    }

    const updatedBuild = await db.pcBuild.update({
      where: { id: input.buildId },
      data: { isFeatured: input.isFeatured },
    });

    return updatedBuild;
  });
