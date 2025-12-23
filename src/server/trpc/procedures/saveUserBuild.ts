import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

const partSchema = z.object({
  category: z.string(),
  name: z.string(),
  asin: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
});

const laptopSchema = z.object({
  name: z.string(),
  brand: z.string(),
  processor: z.string(),
  ram: z.string(),
  storage: z.string(),
  gpu: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
  url: z.string().optional(),
});

const monitorSchema = z.object({
  name: z.string(),
  brand: z.string(),
  resolution: z.string(),
  size: z.string(),
  refreshRate: z.string(),
  panelType: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
  url: z.string().optional(),
});

const headsetSchema = z.object({
  name: z.string(),
  brand: z.string(),
  type: z.string(),
  connectivity: z.string(),
  features: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
  url: z.string().optional(),
});

const miniPcSchema = z.object({
  name: z.string(),
  brand: z.string(),
  processor: z.string(),
  ram: z.string(),
  storage: z.string(),
  gpu: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
  url: z.string().optional(),
});

export const saveUserBuild = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      category: z.string(),
      budget: z.number(),
      parts: z.array(partSchema),
      laptops: z.array(laptopSchema).optional(),
      monitors: z.array(monitorSchema).optional(),
      headsets: z.array(headsetSchema).optional(),
      miniPcs: z.array(miniPcSchema).optional(),
      totalCost: z.number(),
      compatibility: z.number(),
      compatibilityNotes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Verify token and extract user/admin id and role
    let accountId: number;
    let role: "admin" | "user";
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      accountId = parsed.id;
      role = parsed.role;
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    // Verify account exists based on role
    if (role === "user") {
      const user = await db.user.findUnique({
        where: { id: accountId },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }
    } else {
      const admin = await db.admin.findUnique({
        where: { id: accountId },
      });

      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin not found",
        });
      }
    }

    // Calculate the actual total cost from parts to ensure accuracy
    const actualTotalCost = input.parts.reduce((sum, part) => sum + part.price, 0);

    // Create build associated with user or admin based on role
    const build = await db.pcBuild.create({
      data: {
        userId: role === "user" ? accountId : null,
        adminId: role === "admin" ? accountId : null,
        category: input.category,
        budget: input.budget,
        parts: input.parts,
        laptops: input.laptops || [],
        monitors: input.monitors || [],
        headsets: input.headsets || [],
        miniPcs: input.miniPcs || [],
        totalCost: actualTotalCost, // Use calculated total instead of input totalCost
        compatibility: input.compatibility,
        compatibilityNotes: input.compatibilityNotes,
        isFeatured: false,
      },
    });

    return build;
  });
