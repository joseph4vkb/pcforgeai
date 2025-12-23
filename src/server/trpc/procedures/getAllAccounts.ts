import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

export const getAllAccounts = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      page: z.number().default(1),
      searchQuery: z.string().optional(),
      roleFilter: z.enum(["all", "user", "admin"]).default("all"),
    })
  )
  .query(async ({ input }) => {
    // Verify admin authentication
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

    const itemsPerPage = 20;
    const skip = (input.page - 1) * itemsPerPage;

    // Build where clause for search
    const searchWhere = input.searchQuery
      ? {
          email: {
            contains: input.searchQuery,
            mode: "insensitive" as const,
          },
        }
      : {};

    // Fetch users and admins separately
    const fetchUsers = input.roleFilter === "all" || input.roleFilter === "user";
    const fetchAdmins = input.roleFilter === "all" || input.roleFilter === "admin";

    const [users, admins] = await Promise.all([
      fetchUsers
        ? db.user.findMany({
            where: searchWhere,
            include: {
              _count: {
                select: { builds: true },
              },
            },
          })
        : [],
      fetchAdmins
        ? db.admin.findMany({
            where: searchWhere,
            include: {
              _count: {
                select: { builds: true },
              },
            },
          })
        : [],
    ]);

    // Combine and format accounts
    const allAccounts = [
      ...users.map((user) => ({
        id: user.id,
        email: user.email,
        role: "user" as const,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        buildCount: user._count.builds,
      })),
      ...admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        role: "admin" as const,
        emailVerified: true, // Admins are always verified
        createdAt: null, // Admins don't have createdAt
        buildCount: admin._count.builds,
      })),
    ];

    // Sort by email
    allAccounts.sort((a, b) => a.email.localeCompare(b.email));

    // Apply pagination
    const totalCount = allAccounts.length;
    const paginatedAccounts = allAccounts.slice(skip, skip + itemsPerPage);

    return {
      accounts: paginatedAccounts,
      totalCount,
      currentPage: input.page,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      hasMore: totalCount > input.page * itemsPerPage,
    };
  });
