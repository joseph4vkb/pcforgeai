import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const loginUser = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
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

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "1y",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  });
