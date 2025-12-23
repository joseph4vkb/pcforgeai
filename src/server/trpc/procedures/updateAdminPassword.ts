import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";
import bcryptjs from "bcryptjs";

export const updateAdminPassword = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      oldPassword: z.string().min(1, "Old password is required"),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    })
  )
  .mutation(async ({ input }) => {
    // Verify authentication token
    let adminId: number;
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }
      
      adminId = parsed.id;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    // Get admin from database
    const admin = await db.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Admin not found",
      });
    }

    // Verify old password
    const isOldPasswordValid = await bcryptjs.compare(
      input.oldPassword,
      admin.hashedPassword
    );

    if (!isOldPasswordValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Old password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcryptjs.hash(input.newPassword, 10);

    // Update password in database
    await db.admin.update({
      where: { id: adminId },
      data: {
        hashedPassword: hashedNewPassword,
      },
    });

    return {
      success: true,
      message: "Password updated successfully",
    };
  });
