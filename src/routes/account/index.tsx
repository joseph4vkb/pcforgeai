import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { useBuildStore } from "~/stores/useBuildStore";
import {
  Cpu,
  ArrowLeft,
  User,
  LogOut,
  Bookmark,
  ChevronRight,
  Shield,
  GitCompare,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/account/")({
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, email, logout } = useAuthStore();
  const buildStore = useBuildStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [token, navigate]);

  const [category, setCategory] = useState<string>("All");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "price" | "compatibility">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [confirmingBuildDelete, setConfirmingBuildDelete] = useState<number | null>(null);

  const savedBuildsQuery = useQuery(
    token
      ? trpc.getPaginatedSavedBuilds.queryOptions({
          authToken: token,
          page,
          category: category !== "All" ? category : undefined,
          minPrice,
          maxPrice,
          searchQuery: searchQuery || undefined,
          sortBy,
          sortOrder,
        })
      : { queryKey: ["disabled"], queryFn: () => Promise.resolve({ builds: [], totalCount: 0, currentPage: 1, totalPages: 0, hasMore: false }) }
  );

  const deleteBuildMutation = useMutation(
    trpc.deleteBuild.mutationOptions({
      onSuccess: () => {
        toast.success("Build deleted successfully");
        savedBuildsQuery.refetch();
      },
      onError: () => {
        toast.error("Failed to delete build");
      },
    })
  );

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const formatPrice = (price: number) => {
    return `₹${(price / 1000).toFixed(0)}k`;
  };

  const handleCompareToggle = (build: any) => {
    const isInComparison = buildStore.isBuildInComparison(build.id);
    if (isInComparison) {
      buildStore.removeFromComparison(build.id);
      toast.success("Removed from comparison");
    } else {
      if (buildStore.comparisonBuilds.length >= 4) {
        toast.error("You can only compare up to 4 builds at once");
        return;
      }
      buildStore.addToComparison({
        id: build.id,
        category: build.category,
        budget: build.budget,
        parts: build.parts,
        totalCost: build.totalCost,
        compatibility: build.compatibility,
      });
      toast.success("Added to comparison");
    }
  };

  const handleDeleteBuild = (e: React.MouseEvent, buildId: number) => {
    e.stopPropagation();
    setConfirmingBuildDelete(buildId);
  };

  const executeDeleteBuild = (buildId: number) => {
    deleteBuildMutation.mutate({ authToken: token!, buildId });
    setConfirmingBuildDelete(null);
  };

  if (!token) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 text-gray-300 transition hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2">
              <Cpu className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">PC Builder</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 backdrop-blur-sm transition hover:bg-red-500/30 border border-red-500/30"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* User Info */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-500/20 p-4">
              <User className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Account</h1>
              <p className="text-gray-400">{email}</p>
            </div>
          </div>
        </div>

        {/* Saved Builds */}
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-3">
            <Bookmark className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Saved Builds</h2>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-md border border-white/20">
            <h3 className="mb-4 text-lg font-bold text-white">Filter & Search</h3>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search components..."
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="All" className="bg-slate-800">All Categories</option>
                  <option value="Gaming" className="bg-slate-800">Gaming</option>
                  <option value="Content Creation" className="bg-slate-800">Content Creation</option>
                  <option value="AI/ML Development" className="bg-slate-800">AI/ML Development</option>
                  <option value="Video Editing" className="bg-slate-800">Video Editing</option>
                  <option value="Office/Productivity" className="bg-slate-800">Office/Productivity</option>
                  <option value="Budget Gaming" className="bg-slate-800">Budget Gaming</option>
                  <option value="Developers" className="bg-slate-800">Developers</option>
                  <option value="Trading" className="bg-slate-800">Trading</option>
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Min Price (₹)
                </label>
                <input
                  type="number"
                  value={minPrice || ""}
                  onChange={(e) => {
                    setMinPrice(e.target.value ? Number(e.target.value) : undefined);
                    setPage(1);
                  }}
                  placeholder="25000"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Max Price (₹)
                </label>
                <input
                  type="number"
                  value={maxPrice || ""}
                  onChange={(e) => {
                    setMaxPrice(e.target.value ? Number(e.target.value) : undefined);
                    setPage(1);
                  }}
                  placeholder="500000"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>
            </div>

            {/* Sort Controls */}
            <div className="mt-4 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as "date" | "price" | "compatibility");
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="date" className="bg-slate-800">Date Created</option>
                  <option value="price" className="bg-slate-800">Total Cost</option>
                  <option value="compatibility" className="bg-slate-800">Compatibility</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as "asc" | "desc");
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="desc" className="bg-slate-800">Descending</option>
                  <option value="asc" className="bg-slate-800">Ascending</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(category !== "All" || minPrice || maxPrice || searchQuery || sortBy !== "date" || sortOrder !== "desc") && (
                <button
                  onClick={() => {
                    setCategory("All");
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                    setSearchQuery("");
                    setSortBy("date");
                    setSortOrder("desc");
                    setPage(1);
                  }}
                  className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 backdrop-blur-sm transition hover:bg-red-500/30 border border-red-500/30"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Count */}
            {savedBuildsQuery.data && savedBuildsQuery.data.totalCount > 0 && (
              <div className="mt-4 text-sm text-gray-400">
                Showing {savedBuildsQuery.data.builds.length} of {savedBuildsQuery.data.totalCount} builds
                {page > 1 && ` (Page ${page} of ${savedBuildsQuery.data.totalPages})`}
              </div>
            )}
          </div>

          {savedBuildsQuery.isLoading && (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500"></div>
            </div>
          )}

          {savedBuildsQuery.data && savedBuildsQuery.data.builds.length === 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-12 text-center shadow-2xl backdrop-blur-md border border-white/20">
              <Bookmark className="mx-auto mb-4 h-16 w-16 text-gray-500" />
              <h3 className="mb-2 text-xl font-semibold text-white">
                No saved builds yet
              </h3>
              <p className="mb-6 text-gray-400">
                Start building your dream PC and save it to your account
              </p>
              <button
                onClick={() => navigate({ to: "/build" })}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60"
              >
                Build My PC
              </button>
            </div>
          )}

          {savedBuildsQuery.data && savedBuildsQuery.data.builds.length > 0 && (
            <>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {savedBuildsQuery.data.builds.map((build) => {
                  const parts = build.parts as Array<{
                    category: string;
                    name: string;
                    price: number;
                  }>;
                  const cpuPart = parts.find((p) => p.category === "CPU");
                  const gpuPart = parts.find((p) => p.category === "GPU");
                  const isInComparison = buildStore.isBuildInComparison(build.id);

                  return (
                    <div
                      key={build.id}
                      className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md transition hover:bg-white/15 border border-white/10 hover:border-blue-400/50"
                    >
                      {/* Comparison Checkbox - Top Right */}
                      <div className="absolute right-3 top-3 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompareToggle(build);
                          }}
                          className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition ${
                            isInComparison
                              ? "bg-purple-500/30 border-2 border-purple-400"
                              : "bg-black/30 border-2 border-white/20 hover:border-purple-400/50"
                          }`}
                        >
                          <GitCompare
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${
                              isInComparison ? "text-purple-300" : "text-white/70"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Delete Button - Top Right, next to comparison */}
                      <div className="absolute right-14 sm:right-16 top-3 z-10">
                        {confirmingBuildDelete === build.id ? (
                          <div
                            className="flex items-center gap-1 rounded-lg bg-black/60 p-1 border border-white/20 animate-in fade-in zoom-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => executeDeleteBuild(build.id)}
                              className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-red-700"
                            >
                              YES
                            </button>
                            <button
                              onClick={() => setConfirmingBuildDelete(null)}
                              className="rounded bg-white/10 px-2 py-1 text-[10px] font-medium text-gray-300 transition hover:bg-white/20"
                            >
                              NO
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteBuild(e, build.id)}
                            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-black/30 border-2 border-white/20 hover:border-red-400/50 hover:bg-red-500/20 transition"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-white/70 hover:text-red-300" />
                          </button>
                        )}
                      </div>

                      {/* Card Header with Gradient Background */}
                      <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Cpu className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-white/20" />
                        </div>
                        <div className="absolute left-3 sm:left-4 top-3 sm:top-4 rounded-full bg-black/50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          {build.category}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div
                        className="p-4 sm:p-5 lg:p-6 cursor-pointer"
                        onClick={() => navigate({ to: `/build/${build.id}` })}
                      >
                        <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
                          <span className="text-xl sm:text-2xl font-bold text-white">
                            {formatPrice(build.totalCost)}
                          </span>
                          <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                            <Shield className="h-3 w-3" />
                            {build.compatibility.toFixed(1)}%
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                          {cpuPart && (
                            <div className="flex items-start gap-2">
                              <span className="text-gray-400 whitespace-nowrap">CPU:</span>
                              <span className="flex-1 text-gray-300 line-clamp-1">{cpuPart.name}</span>
                            </div>
                          )}
                          {gpuPart && (
                            <div className="flex items-start gap-2">
                              <span className="text-gray-400 whitespace-nowrap">GPU:</span>
                              <span className="flex-1 text-gray-300 line-clamp-1">{gpuPart.name}</span>
                            </div>
                          )}
                        </div>

                        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-blue-300 transition group-hover:bg-blue-500/30 border border-blue-500/30">
                          View Build
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {savedBuildsQuery.data.totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: savedBuildsQuery.data.totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        pageNum === 1 ||
                        pageNum === savedBuildsQuery.data.totalPages ||
                        Math.abs(pageNum - page) <= 1
                      );
                    })
                    .map((pageNum, idx, arr) => {
                      // Add ellipsis if there's a gap
                      const prevPageNum = arr[idx - 1];
                      const showEllipsis = prevPageNum && pageNum - prevPageNum > 1;

                      return (
                        <div key={pageNum} className="flex items-center gap-2">
                          {showEllipsis && <span className="text-gray-400">...</span>}
                          <button
                            onClick={() => setPage(pageNum)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium backdrop-blur-sm transition ${
                              page === pageNum
                                ? "bg-blue-500 text-white"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            {pageNum}
                          </button>
                        </div>
                      );
                    })}

                  <button
                    onClick={() => setPage((p) => Math.min(savedBuildsQuery.data.totalPages, p + 1))}
                    disabled={page === savedBuildsQuery.data.totalPages}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Floating Compare Button */}
              {buildStore.comparisonBuilds.length > 0 && (
                <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50">
                  <button
                    onClick={() => navigate({ to: "/compare" })}
                    className="flex items-center gap-2 sm:gap-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-2xl shadow-purple-500/50 transition hover:shadow-purple-500/70 hover:scale-105 active:scale-95"
                  >
                    <GitCompare className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Compare Selected</span>
                    <span className="sm:hidden">Compare</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                      {buildStore.comparisonBuilds.length}
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
