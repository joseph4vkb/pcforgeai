import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getAmazonAffiliateId = baseProcedure.query(async () => {
  const config = await db.adminConfig.findFirst();

  if (!config) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Admin config not found",
    });
  }

  // Return only the affiliate ID, no sensitive data
  return {
    amazonAffiliateId: config.amazonAffiliateId || "",
  };
});
