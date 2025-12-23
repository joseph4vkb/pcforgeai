import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import {
  Users,
  Search,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import toast from "react-hot-toast";

interface UserManagementProps {
  authToken: string;
}

export function UserManagement({ authToken }: UserManagementProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [page, setPage] = useState(1);
  const [confirmingAction, setConfirmingAction] = useState<{
    id: number;
    newRole: "user" | "admin";
  } | null>(null);

  const accountsQuery = useQuery(
    trpc.getAllAccounts.queryOptions({
      authToken,
      page,
      searchQuery: searchQuery || undefined,
      roleFilter,
    })
  );

  const updateRoleMutation = useMutation({
    ...trpc.updateUserRole.mutationOptions(),
    onSuccess: (data) => {
      console.log("updateUserRole mutation success:", data);
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: [["getAllAccounts"]] });
      queryClient.refetchQueries({ queryKey: [["getAllAccounts"]] });
    },
    onError: (error: any) => {
      console.error("Update role failed in onError:", error);
      toast.error(error.message || "Failed to update role");
      if (error.data) console.error("Error data:", error.data);
    },
  });

  const handleRoleChange = (accountId: number, currentRole: "user" | "admin", newRole: "user" | "admin") => {
    console.log(`handleRoleChange clicked: accountId=${accountId}, ${currentRole} -> ${newRole}`);
    console.log("handleRoleChange: token length:", (authToken || "").length);

    // Use inline confirmation instead of window.confirm
    setConfirmingAction({ id: accountId, newRole });
  };

  const executeRoleChange = (accountId: number, currentRole: "user" | "admin", newRole: "user" | "admin") => {
    console.log("executeRoleChange: calling mutate...");
    updateRoleMutation.mutate({
      authToken,
      accountId,
      currentRole,
      newRole,
    });
    setConfirmingAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20">
        <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
          <Users className="h-6 w-6 text-blue-400" />
          User Management
        </h3>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Search by Email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search users..."
                className="w-full rounded-lg border border-white/20 bg-white/5 py-2 pl-10 pr-4 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as "all" | "user" | "admin");
                setPage(1);
              }}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            >
              <option value="all" className="bg-slate-800">All Users</option>
              <option value="user" className="bg-slate-800">Users Only</option>
              <option value="admin" className="bg-slate-800">Admins Only</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        {accountsQuery.data && (
          <div className="mt-4 text-sm text-gray-400">
            Showing {accountsQuery.data.accounts.length} of {accountsQuery.data.totalCount} accounts
          </div>
        )}
      </div>

      {/* Loading State */}
      {accountsQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      )}

      {/* Users Table */}
      {accountsQuery.data && accountsQuery.data.accounts.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-left text-sm font-semibold text-gray-400">Email</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-400">Role</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-400">Verified</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-400">Builds</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-400">Created</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accountsQuery.data.accounts.map((account) => (
                  <tr key={`${account.role}-${account.id}`} className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {account.role === "admin" ? (
                          <Shield className="h-4 w-4 text-purple-400" />
                        ) : (
                          <User className="h-4 w-4 text-blue-400" />
                        )}
                        <span className="text-white font-medium">{account.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          account.role === "admin"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {account.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      {account.emailVerified ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-white">{account.buildCount}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-400 text-sm">
                        {account.createdAt
                          ? new Date(account.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      {confirmingAction?.id === account.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => executeRoleChange(account.id, account.role, confirmingAction.newRole)}
                            className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-600"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmingAction(null)}
                            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/20"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : account.role === "user" ? (
                        <button
                          onClick={() => handleRoleChange(account.id, "user", "admin")}
                          disabled={updateRoleMutation.isPending}
                          className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-1.5 text-sm font-medium text-purple-300 transition hover:bg-purple-500/30 border border-purple-500/30 disabled:opacity-50"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          Promote
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(account.id, "admin", "user")}
                          disabled={updateRoleMutation.isPending}
                          className="flex items-center gap-2 rounded-lg bg-orange-500/20 px-3 py-1.5 text-sm font-medium text-orange-300 transition hover:bg-orange-500/30 border border-orange-500/30 disabled:opacity-50"
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                          Demote
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {accountsQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-gray-400">
                Page {page} of {accountsQuery.data.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(accountsQuery.data.totalPages, p + 1))}
                disabled={page === accountsQuery.data.totalPages}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {accountsQuery.data && accountsQuery.data.accounts.length === 0 && (
        <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md border border-white/20">
          <Users className="mx-auto mb-4 h-16 w-16 text-gray-500" />
          <h3 className="mb-2 text-xl font-semibold text-white">No users found</h3>
          <p className="text-gray-400">
            {searchQuery
              ? "Try adjusting your search query"
              : "No registered users yet"}
          </p>
        </div>
      )}
    </div>
  );
}
