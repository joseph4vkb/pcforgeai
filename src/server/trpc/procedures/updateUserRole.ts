import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const updateUserRole = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      accountId: z.number(),
      currentRole: z.enum(["user", "admin"]),
      newRole: z.enum(["user", "admin"]),
    })
  )
  .mutation(async ({ input }) => {
    console.log("updateUserRole called with input:", JSON.stringify(input, null, 2));
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);

      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Prevent self-demotion
      if (parsed.id === input.accountId && input.currentRole === "admin" && input.newRole === "user") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot demote yourself",
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

    // If roles are the same, nothing to do
    if (input.currentRole === input.newRole) {
      return { success: true, message: "Role unchanged" };
    }

    // Promote user to admin
    if (input.currentRole === "user" && input.newRole === "admin") {
      const user = await db.user.findUnique({
        where: { id: input.accountId },
        include: { builds: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Create admin account
      const admin = await db.admin.create({
        data: {
          email: user.email,
          hashedPassword: user.hashedPassword,
        },
      });

      // Transfer builds
      await db.pcBuild.updateMany({
        where: { userId: user.id },
        data: {
          userId: null,
          adminId: admin.id,
        },
      });

      // Delete user account
      await db.user.delete({
        where: { id: user.id },
      });

      return { success: true, message: "User promoted to admin", newId: admin.id };
    }

    // Demote admin to user
    if (input.currentRole === "admin" && input.newRole === "user") {
      const admin = await db.admin.findUnique({
        where: { id: input.accountId },
        include: { builds: true },
      });

      if (!admin) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin not found",
        });
      }

      // Create user account
      const user = await db.user.create({
        data: {
          email: admin.email,
          hashedPassword: admin.hashedPassword,
          emailVerified: true, // Assume verified since they were an admin
          createdAt: new Date(),
        },
      });
      console.log("updateUserRole: Mutation complete for accountId", input.accountId);

      // Transfer builds
      await db.pcBuild.updateMany({
        where: { adminId: admin.id },
        data: {
          adminId: null,
          userId: user.id,
        },
      });

      // Delete admin account
      await db.admin.delete({
        where: { id: admin.id },
      });

      return { success: true, message: "Admin demoted to user", newId: user.id };
    }

    return { success: false, message: "Invalid role transition" };
  });
