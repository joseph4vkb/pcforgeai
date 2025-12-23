import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { BuildCard } from "~/components/BuildCard";
import { 
  Cpu, 
  ArrowLeft, 
  Loader2,
  Package,
  User,
  Settings,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/builds/")({
  component: BuildsPage,
});

const categories = [
  "All",
  "Gaming",
  "Content Creation",
  "AI/ML Development",
  "Video Editing",
  "Office/Productivity",
  "Budget Gaming",
  "Developers",
  "Trading",
  "General Use",
  "Workstation",
  "Server/NAS",
  "Streaming",
  "Mining/Crypto",
  "Home Theater PC",
  "Compact/Mini PC",
  "Extreme Performance",
];

function BuildsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();

  const [category, setCategory] = useState<string>("All");
  const [sortByPrice, setSortByPrice] = useState<"asc" | "desc" | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const buildsQuery = useQuery(
    trpc.getFilteredBuilds.queryOptions({
      category: category === "All" ? undefined : category,
      sortByPrice,
      page,
    })
  );

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (newSort: "asc" | "desc" | undefined) => {
    setSortByPrice(newSort);
    setPage(1); // Reset to first page when sort changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
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
              <Package className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">Browse Builds</span>
            </div>
            <div className="flex items-center gap-2">
              {token ? (
                <>
                  <button
                    onClick={() => navigate({ to: role === "admin" ? "/admin/dashboard" : "/account" })}
                    className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                  >
                    <User className="h-4 w-4" />
                    {email}
                  </button>
                  {role === "admin" && (
                    <button
                      onClick={() => navigate({ to: "/admin/dashboard" })}
                      className="rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate({ to: "/login" })}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate({ to: "/register" })}
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:shadow-lg hover:shadow-blue-500/50"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-3 text-4xl font-bold text-white">
            Browse All PC Builds
          </h1>
          <p className="text-lg text-gray-400">
            Explore our complete collection of AI-generated PC configurations
          </p>
        </div>

        {/* Filters and View Toggle */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  category === cat
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortByPrice || "default"}
              onChange={(e) => handleSortChange(e.target.value === "default" ? undefined : e.target.value as "asc" | "desc")}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            >
              <option value="default" className="bg-slate-800">Default</option>
              <option value="asc" className="bg-slate-800">Price: Low to High</option>
              <option value="desc" className="bg-slate-800">Price: High to Low</option>
            </select>

            {/* View Toggle */}
            <div className="flex rounded-lg bg-white/10 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-2 transition ${
                  viewMode === "grid"
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-2 transition ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {buildsQuery.data && (
          <div className="mb-6 rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
            <p className="text-gray-300">
              Showing{" "}
              <span className="font-semibold text-white">
                {buildsQuery.data.builds.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-white">
                {buildsQuery.data.totalCount}
              </span>{" "}
              builds
              {category !== "All" && (
                <span className="text-gray-400"> in {category}</span>
              )}
            </p>
          </div>
        )}

        {/* Loading State */}
        {buildsQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-400" />
            <p className="text-gray-400">Loading builds...</p>
          </div>
        )}

        {/* Builds Display */}
        {buildsQuery.data && buildsQuery.data.builds.length > 0 && (
          <>
            <div className={viewMode === "grid" ? "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {buildsQuery.data.builds.map((build) => (
                <BuildCard
                  key={build.id}
                  id={build.id}
                  category={build.category}
                  totalCost={build.totalCost}
                  parts={build.parts as any}
                  compatibility={build.compatibility}
                  isFeatured={build.isFeatured}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
            {buildsQuery.data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {Array.from({ length: buildsQuery.data.totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === buildsQuery.data.totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[40px] rounded-lg px-4 py-2 text-sm font-medium transition ${
                          page === pageNum
                            ? "bg-blue-500 text-white"
                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <span key={pageNum} className="text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === buildsQuery.data.totalPages}
                  className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {buildsQuery.data && buildsQuery.data.builds.length === 0 && !buildsQuery.isLoading && (
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-12 text-center border border-white/20">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h3 className="mb-2 text-xl font-bold text-white">
              No Builds Found
            </h3>
            <p className="mb-6 text-gray-400">
              {category !== "All"
                ? `No builds found in the ${category} category. Try selecting a different category.`
                : "No builds have been created yet. Start building your PC today!"}
            </p>
            <button
              onClick={() => navigate({ to: "/build" })}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60"
            >
              Build My PC
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
