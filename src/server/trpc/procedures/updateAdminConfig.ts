import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const updateAdminConfig = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      openrouterApiKey: z.string().optional(),
      openrouterModel: z.string().optional(),
      amazonAffiliateId: z.string().optional(),
      amazonPaAccessKey: z.string().optional(),
      amazonPaSecretKey: z.string().optional(),
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpUser: z.string().optional(),
      smtpPassword: z.string().optional(),
      smtpSecure: z.boolean().optional(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
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

    const config = await db.adminConfig.findFirst();

    if (!config) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Admin config not found",
      });
    }

    const updatedConfig = await db.adminConfig.update({
      where: { id: config.id },
      data: {
        ...(input.openrouterApiKey && {
          openrouterApiKey: input.openrouterApiKey,
        }),
        ...(input.openrouterModel && {
          openrouterModel: input.openrouterModel,
        }),
        ...(input.amazonAffiliateId && {
          amazonAffiliateId: input.amazonAffiliateId,
        }),
        ...(input.amazonPaAccessKey && {
          amazonPaAccessKey: input.amazonPaAccessKey,
        }),
        ...(input.amazonPaSecretKey && {
          amazonPaSecretKey: input.amazonPaSecretKey,
        }),
        ...(input.smtpHost !== undefined && {
          smtpHost: input.smtpHost,
        }),
        ...(input.smtpPort !== undefined && {
          smtpPort: input.smtpPort,
        }),
        ...(input.smtpUser !== undefined && {
          smtpUser: input.smtpUser,
        }),
        ...(input.smtpPassword !== undefined && {
          smtpPassword: input.smtpPassword,
        }),
        ...(input.smtpSecure !== undefined && {
          smtpSecure: input.smtpSecure,
        }),
      },
    });

    return updatedConfig;
  });
