import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { generateSecureToken } from "~/server/utils/token";
import { sendPasswordResetEmail } from "~/server/utils/email";
import { getBaseUrl } from "~/server/utils/base-url";

export const forgotPassword = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
    })
  )
  .mutation(async ({ input }) => {
    // Check if this is an admin email (admins use different password reset)
    const admin = await db.admin.findUnique({
      where: { email: input.email },
    });

    if (admin) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please contact system administrator for admin password reset",
      });
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // For security, don't reveal that the user doesn't exist
      // Return success anyway to prevent email enumeration
      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      };
    }

    // Generate reset token and set expiry (1 hour from now)
    const resetToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Update user with reset token and expiry
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt,
      },
    });

    // Send password reset email
    const baseUrl = getBaseUrl();
    await sendPasswordResetEmail(user.email, resetToken, baseUrl);

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    };
  });
