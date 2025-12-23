import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import bcryptjs from "bcryptjs";

export const resetPassword = baseProcedure
  .input(
    z.object({
      token: z.string(),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })
  )
  .mutation(async ({ input }) => {
    // Find user with this reset token
    const user = await db.user.findUnique({
      where: { resetPasswordToken: input.token },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid or expired reset token",
      });
    }

    // Check if token has expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Reset token has expired. Please request a new password reset.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(input.password, 10);

    // Update user's password and clear reset token fields
    await db.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return {
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    };
  });
