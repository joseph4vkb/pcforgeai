import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { generateSecureToken } from "~/server/utils/token";
import { sendVerificationEmail } from "~/server/utils/email";
import { getBaseUrl } from "~/server/utils/base-url";

export const requestVerificationEmail = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
    })
  )
  .mutation(async ({ input }) => {
    // Check if admin exists with this email (admins don't need verification)
    const admin = await db.admin.findUnique({
      where: { email: input.email },
    });

    if (admin) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Admin accounts do not require email verification",
      });
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No account found with this email address",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = generateSecureToken();

    // Update user with new token
    await db.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    // Send verification email
    const baseUrl = getBaseUrl();
    await sendVerificationEmail(user.email, verificationToken, baseUrl);

    return {
      success: true,
      message: "Verification email sent! Please check your inbox.",
    };
  });
