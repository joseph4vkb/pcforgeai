import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const verifyEmail = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    // Find user with this verification token
    const user = await db.user.findUnique({
      where: { verificationToken: input.token },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid or expired verification token",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email is already verified",
      });
    }

    // Update user to mark email as verified and clear the token
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return {
      success: true,
      message: "Email verified successfully! You can now log in.",
    };
  });
