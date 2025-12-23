import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import bcryptjs from "bcryptjs";
import { generateSecureToken } from "~/server/utils/token";
import { sendVerificationEmail } from "~/server/utils/email";
import { getBaseUrl } from "~/server/utils/base-url";

export const registerUser = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })
  )
  .mutation(async ({ input }) => {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(input.password, 10);

    // Generate verification token
    const verificationToken = generateSecureToken();

    // Create user with verification token
    const user = await db.user.create({
      data: {
        email: input.email,
        hashedPassword,
        emailVerified: false,
        verificationToken,
      },
    });

    // Send verification email
    const baseUrl = getBaseUrl();
    try {
      await sendVerificationEmail(user.email, verificationToken, baseUrl);
    } catch (error) {
      // If email fails, we should still allow the user to be created
      // but log the error
      console.error("Failed to send verification email:", error);
    }

    return {
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
      },
    };
  });
