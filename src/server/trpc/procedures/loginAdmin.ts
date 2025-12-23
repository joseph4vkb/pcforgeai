import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const loginAdmin = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const admin = await db.admin.findUnique({
      where: { email: input.email },
    });

    if (!admin) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

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
  });
