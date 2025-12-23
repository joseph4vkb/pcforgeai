import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const login = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    // First, check if the email belongs to an admin
    const admin = await db.admin.findUnique({
      where: { email: input.email },
    });

    if (admin) {
      const isPasswordValid = await bcryptjs.compare(
        input.password,
        admin.hashedPassword
      );

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        { id: admin.id, role: "admin" },
        env.JWT_SECRET,
        { expiresIn: "1y" }
      );

      return {
        token,
        email: admin.email,
        role: "admin" as const,
      };
    }

    // If not an admin, check if it's a regular user
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcryptjs.compare(
      input.password,
      user.hashedPassword
    );

    if (!isPasswordValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Check if user's email is verified
    if (!user.emailVerified) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: "user" },
      env.JWT_SECRET,
      { expiresIn: "1y" }
    );

    return {
      token,
      email: user.email,
      role: "user" as const,
    };
  });
