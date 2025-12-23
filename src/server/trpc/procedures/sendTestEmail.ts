import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";
import { sendTestEmail as sendTestEmailUtil } from "~/server/utils/email";

export const sendTestEmail = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      testEmail: z.string().email("Invalid email address"),
    })
  )
  .mutation(async ({ input }) => {
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z
        .object({ id: z.number(), role: z.enum(["admin", "user"]) })
        .parse(verified);

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

    // Send test email
    try {
      await sendTestEmailUtil(input.testEmail);
      return {
        success: true,
        message: `Test email sent successfully to ${input.testEmail}`,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to send test email. Please check your SMTP configuration.",
      });
    }
  });
