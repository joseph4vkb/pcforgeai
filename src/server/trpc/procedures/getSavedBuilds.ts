import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const getSavedBuilds = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
    })
  )
  .query(async ({ input }) => {
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

    // Fetch builds based on role
    const builds = await db.pcBuild.findMany({
      where: role === "user" ? { userId: accountId } : { adminId: accountId },
      orderBy: { createdAt: "desc" },
    });

    return builds;
  });
