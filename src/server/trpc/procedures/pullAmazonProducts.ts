// DEPRECATED: This procedure has been removed.
// 
// The Amazon Product Advertising API integration has been replaced with
// AI-generated product catalog functionality.
//
// Use the following instead:
// - generateProductCatalog: Generate 100 PC components using AI
// - getAmazonProducts: Query products from the database
//
// This file is kept for reference only and should not be imported.

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";

export const pullAmazonProducts = baseProcedure
  .input(z.object({ authToken: z.string() }))
  .mutation(async () => {
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "This procedure has been deprecated. Use generateProductCatalog instead.",
    });
  });
