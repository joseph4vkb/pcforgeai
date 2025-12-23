import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const deleteBuild = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      buildId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    // Verify token and extract account id and role
    let accountId: number;
    let role: "admin" | "user";
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      accountId = parsed.id;
      role = parsed.role;
    } catch (error) {
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

    // Admins can delete any build, users can only delete their own builds
    if (role === "user") {
      if (build.userId !== accountId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own builds",
        });
      }
    }
    // If role is admin, they can delete any build (no additional check needed)

    await db.pcBuild.delete({
      where: { id: input.buildId },
    });

    return { success: true };
  });
