import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { ProductCard } from "~/components/ProductCard";
import { FilterSidebar } from "~/components/FilterSidebar";
import { 
  Cpu, 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  Package,
  User,
  Settings
} from "lucide-react";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();

  const [category, setCategory] = useState<string>("All");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const productsQuery = useQuery(
    trpc.getAmazonProducts.queryOptions({
      category: category as any,
      minPrice,
      maxPrice,
      searchQuery,
      page,
    })
  );

  const handleFilterChange = (filters: {
    category: string;
    minPrice?: number;
    maxPrice?: number;
    searchQuery?: string;
  }) => {
    setCategory(filters.category);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setSearchQuery(filters.searchQuery);
    setPage(1); // Reset to first page when filters change
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
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
              <span className="text-2xl font-bold text-white">PC Components</span>
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
                      Admin
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
            Browse PC Components
          </h1>
          <p className="text-lg text-gray-400">
            Find the best PC components from Amazon with live pricing and affiliate links
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar - Filters */}
          <aside>
            <FilterSidebar
              onFilterChange={handleFilterChange}
              currentCategory={category}
            />
          </aside>

          {/* Main Content - Products Grid */}
          <main>
            {/* Results Count */}
            {productsQuery.data && !productsQuery.data.error && (
              <div className="mb-6 rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                <p className="text-gray-300">
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {productsQuery.data.products.length}
                  </span>{" "}
                  {productsQuery.data.totalResults > 0 && (
                    <>
                      of{" "}
                      <span className="font-semibold text-white">
                        {productsQuery.data.totalResults}
                      </span>
                    </>
                  )}{" "}
                  products
                </p>
              </div>
            )}

            {/* Error State */}
            {productsQuery.data?.error && (
              <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 p-8 text-center border border-red-500/20">
                <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
                <h3 className="mb-2 text-xl font-bold text-white">
                  Failed to Load Products
                </h3>
                <p className="text-gray-400">{productsQuery.data.error}</p>
              </div>
            )}

            {/* Loading State */}
            {productsQuery.isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-400" />
                <p className="text-gray-400">Loading products from Amazon...</p>
              </div>
            )}

            {/* Products Grid */}
            {productsQuery.data && !productsQuery.data.error && productsQuery.data.products.length > 0 && (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {productsQuery.data.products.map((product) => (
                    <ProductCard
                      key={product.asin}
                      asin={product.asin}
                      name={product.name}
                      price={product.price}
                      url={product.url}
                      category={product.category}
                      specs={product.specs || {}}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {productsQuery.data.hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={productsQuery.isLoading}
                      className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {productsQuery.isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More Products"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty State - No products in catalog */}
            {productsQuery.data && !productsQuery.data.error && productsQuery.data.products.length === 0 && !productsQuery.isLoading && category === "All" && !searchQuery && !minPrice && !maxPrice && (
              <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-12 text-center border border-purple-500/20">
                <Package className="mx-auto mb-4 h-16 w-16 text-purple-400" />
                <h3 className="mb-2 text-xl font-bold text-white">
                  Product Catalog Not Generated
                </h3>
                <p className="mb-4 text-gray-400">
                  The product catalog hasn't been generated yet. {role === "admin" ? "Visit the admin dashboard to generate it." : "Please contact an administrator."}
                </p>
                {role === "admin" && (
                  <button
                    onClick={() => navigate({ to: "/admin/dashboard" })}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60"
                  >
                    <Settings className="h-5 w-5" />
                    Go to Admin Dashboard
                  </button>
                )}
              </div>
            )}

            {/* Empty State - No products match filters */}
            {productsQuery.data && !productsQuery.data.error && productsQuery.data.products.length === 0 && !productsQuery.isLoading && (category !== "All" || searchQuery || minPrice || maxPrice) && (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-12 text-center border border-white/20">
                <Package className="mx-auto mb-4 h-16 w-16 text-gray-500" />
                <h3 className="mb-2 text-xl font-bold text-white">
                  No Products Found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
