import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { useBuildStore } from "~/stores/useBuildStore";
import { AdBanner } from "~/components/AdBanner";
import { 
  Laptop, 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  User,
  Filter,
  Search,
  ExternalLink,
  ShoppingCart,
  ArrowUpDown,
  GitCompare
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/laptops/")({
  component: LaptopsPage,
});

function LaptopsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();
  const buildStore = useBuildStore();

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([]);
  const [minRam, setMinRam] = useState<number | undefined>();
  const [minStorage, setMinStorage] = useState<number | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price" | "brand" | "ram" | "storage">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const laptopsQuery = useQuery(
    trpc.getLaptops.queryOptions({
      brand: selectedBrands.length > 0 ? selectedBrands : undefined,
      processor: selectedProcessors.length > 0 ? selectedProcessors : undefined,
      minRam,
      minStorage,
      minPrice,
      maxPrice,
      searchQuery: searchQuery || undefined,
      sortBy,
      sortOrder,
      page,
    })
  );

  const recordClickMutation = useMutation(
    trpc.recordClick.mutationOptions()
  );

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
    setPage(1);
  };

  const handleProcessorChange = (processor: string) => {
    setSelectedProcessors((prev) =>
      prev.includes(processor)
        ? prev.filter((p) => p !== processor)
        : [...prev, processor]
    );
    setPage(1);
  };

  const handleRamChange = (value: number | undefined) => {
    setMinRam(value);
    setPage(1);
  };

  const handleStorageChange = (value: number | undefined) => {
    setMinStorage(value);
    setPage(1);
  };

  const handlePriceChange = (type: 'min' | 'max', value: number | undefined) => {
    if (type === 'min') {
      setMinPrice(value);
    } else {
      setMaxPrice(value);
    }
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-") as ["price" | "brand" | "ram" | "storage", "asc" | "desc"];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleLaptopClick = async (laptop: any) => {
    if (!laptop.url) return;
    
    // Record the click
    try {
      await recordClickMutation.mutateAsync({
        targetType: "Laptop",
        targetId: laptop.url,
        targetName: laptop.name,
        metadata: {
          brand: laptop.brand,
          processor: laptop.processor,
          ram: laptop.ram,
          gpu: laptop.gpu,
          price: laptop.price,
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
    
    // Open the link
    window.open(laptop.url, "_blank", "noopener,noreferrer");
  };

  const handleCompareToggle = (laptop: any) => {
    const isInComparison = buildStore.isLaptopInComparison(laptop.url || "");
    
    if (isInComparison) {
      buildStore.removeLaptopFromComparison(laptop.url || "");
      toast.success("Removed from comparison");
    } else {
      if (buildStore.comparisonLaptops.length >= 4) {
        toast.error("You can only compare up to 4 laptops at once");
        return;
      }
      
      buildStore.addLaptopToComparison({
        name: laptop.name,
        brand: laptop.brand,
        processor: laptop.processor,
        ram: laptop.ram,
        storage: laptop.storage,
        gpu: laptop.gpu,
        price: laptop.price,
        specs: laptop.specs || {},
        url: laptop.url,
      });
      toast.success("Added to comparison");
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
              <Laptop className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Browse Laptops</span>
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
                    className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:shadow-lg hover:shadow-purple-500/50"
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
            Browse Recommended Laptops
          </h1>
          <p className="text-lg text-gray-400">
            Explore laptops recommended by our AI across all PC builds
          </p>
        </div>

        {/* Banner Ad - Laptop Browse Top */}
        <div className="mb-8">
          <AdBanner locationKey="LAPTOP_BROWSE_TOP" className="mx-auto max-w-4xl" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Sidebar - Filters */}
          <aside>
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-md border border-white/20 sticky top-24">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/20 p-2">
                  <Filter className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Filters</h2>
              </div>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Search Laptops
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search by name or brand..."
                      className="w-full rounded-lg border border-white/20 bg-white/5 py-2 pl-10 pr-4 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                  </div>
                </div>

                {/* Brand Filter - Checkboxes */}
                {laptopsQuery.data?.filterOptions.brands && laptopsQuery.data.filterOptions.brands.length > 0 && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-300">
                      Brand
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                      {laptopsQuery.data.filterOptions.brands.map((brand) => (
                        <label
                          key={brand}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => handleBrandChange(brand)}
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white transition">
                            {brand}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processor Filter - Checkboxes */}
                {laptopsQuery.data?.filterOptions.processors && laptopsQuery.data.filterOptions.processors.length > 0 && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-300">
                      Processor
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                      {laptopsQuery.data.filterOptions.processors.map((processor) => (
                        <label
                          key={processor}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProcessors.includes(processor)}
                            onChange={() => handleProcessorChange(processor)}
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white transition line-clamp-2">
                            {processor}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* RAM Filter - Checkboxes */}
                {laptopsQuery.data?.filterOptions.ramOptions && laptopsQuery.data.filterOptions.ramOptions.length > 0 && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-300">
                      Minimum RAM
                    </label>
                    <div className="space-y-2">
                      {laptopsQuery.data.filterOptions.ramOptions.map((ram) => (
                        <label
                          key={ram}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name="ram"
                            checked={minRam === ram}
                            onChange={() => handleRamChange(ram)}
                            className="h-4 w-4 border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white transition">
                            {ram} GB
                          </span>
                        </label>
                      ))}
                      {minRam && (
                        <button
                          onClick={() => handleRamChange(undefined)}
                          className="text-xs text-purple-400 hover:text-purple-300 transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Storage Filter - Checkboxes */}
                {laptopsQuery.data?.filterOptions.storageOptions && laptopsQuery.data.filterOptions.storageOptions.length > 0 && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-300">
                      Minimum Storage
                    </label>
                    <div className="space-y-2">
                      {laptopsQuery.data.filterOptions.storageOptions.map((storage) => (
                        <label
                          key={storage}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name="storage"
                            checked={minStorage === storage}
                            onChange={() => handleStorageChange(storage)}
                            className="h-4 w-4 border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white transition">
                            {storage >= 1024 ? `${storage / 1024} TB` : `${storage} GB`}
                          </span>
                        </label>
                      ))}
                      {minStorage && (
                        <button
                          onClick={() => handleStorageChange(undefined)}
                          className="text-xs text-purple-400 hover:text-purple-300 transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Price Range (₹)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={minPrice || ""}
                      onChange={(e) => handlePriceChange('min', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Min price"
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                    <input
                      type="number"
                      value={maxPrice || ""}
                      onChange={(e) => handlePriceChange('max', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Max price"
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                  </div>
                </div>

                {/* Clear All Filters Button */}
                {(selectedBrands.length > 0 || selectedProcessors.length > 0 || minRam || minStorage || minPrice || maxPrice || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedBrands([]);
                      setSelectedProcessors([]);
                      setMinRam(undefined);
                      setMinStorage(undefined);
                      setMinPrice(undefined);
                      setMaxPrice(undefined);
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content - Laptops Grid */}
          <main>
            {/* Results Count */}
            {laptopsQuery.data && (
              <div className="mb-6 rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                <p className="text-gray-300">
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {laptopsQuery.data.laptops.length}
                  </span>{" "}
                  {laptopsQuery.data.totalResults > 0 && (
                    <>
                      of{" "}
                      <span className="font-semibold text-white">
                        {laptopsQuery.data.totalResults}
                      </span>
                    </>
                  )}{" "}
                  laptops
                </p>
              </div>
            )}

            {/* Sort Controls */}
            {laptopsQuery.data && laptopsQuery.data.laptops.length > 0 && (
              <div className="mb-6 flex items-center justify-between gap-4 rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <ArrowUpDown className="h-5 w-5 text-purple-400" />
                  <label htmlFor="sort-select" className="text-sm font-medium text-gray-300">
                    Sort by:
                  </label>
                  <select
                    id="sort-select"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 cursor-pointer"
                  >
                    <option value="price-asc" className="bg-slate-800">Price: Low to High</option>
                    <option value="price-desc" className="bg-slate-800">Price: High to Low</option>
                    <option value="brand-asc" className="bg-slate-800">Brand Name (A-Z)</option>
                    <option value="brand-desc" className="bg-slate-800">Brand Name (Z-A)</option>
                    <option value="ram-asc" className="bg-slate-800">RAM: Low to High</option>
                    <option value="ram-desc" className="bg-slate-800">RAM: High to Low</option>
                    <option value="storage-asc" className="bg-slate-800">Storage: Low to High</option>
                    <option value="storage-desc" className="bg-slate-800">Storage: High to Low</option>
                  </select>
                </div>
              </div>
            )}

            {/* Loading State */}
            {laptopsQuery.isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-purple-400" />
                <p className="text-gray-400">Loading laptops...</p>
              </div>
            )}

            {/* Laptops Grid */}
            {laptopsQuery.data && laptopsQuery.data.laptops.length > 0 && (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {laptopsQuery.data.laptops.map((laptop, index) => {
                    const isInComparison = buildStore.isLaptopInComparison(laptop.url || "");
                    
                    return (
                    <div
                      key={index}
                      className="group flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-pink-900/20 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-purple-400/40 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1"
                    >
                      {/* Header Section */}
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="mb-2 inline-block rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-300 border border-purple-400/30">
                            {laptop.brand}
                          </div>
                          <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-tight text-white group-hover:text-purple-100 transition-colors">
                            {laptop.name}
                          </h3>
                        </div>
                        {/* Comparison Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompareToggle(laptop);
                          }}
                          className={`flex items-center justify-center w-9 h-9 rounded-lg transition ${
                            isInComparison
                              ? "bg-purple-500/30 border-2 border-purple-400"
                              : "bg-black/30 border-2 border-white/20 hover:border-purple-400/50"
                          }`}
                        >
                          <GitCompare
                            className={`h-5 w-5 ${
                              isInComparison ? "text-purple-300" : "text-white/70"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Price Section */}
                      <div className="mb-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 border border-purple-400/20">
                        <div className="text-sm text-gray-400 mb-1">Price</div>
                        <div className="text-2xl font-bold text-white">
                          {formatPrice(laptop.price)}
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <div className="mb-5 flex-1 space-y-3">
                        <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Processor</div>
                          <div className="text-sm font-semibold text-white line-clamp-2">{laptop.processor}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">RAM</div>
                            <div className="text-sm font-semibold text-white">{laptop.ram}</div>
                          </div>
                          <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Storage</div>
                            <div className="text-sm font-semibold text-white">{laptop.storage}</div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Graphics</div>
                          <div className="text-sm font-semibold text-white line-clamp-2">{laptop.gpu}</div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      {laptop.url && (
                        <button
                          onClick={() => handleLaptopClick(laptop)}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:from-purple-600 hover:to-pink-600 hover:shadow-xl hover:shadow-purple-500/40 group-hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          View on Amazon
                          <ExternalLink className="h-4 w-4 opacity-70" />
                        </button>
                      )}
                    </div>
                  )})}
                </div>

                {/* Load More Button */}
                {laptopsQuery.data.hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={laptopsQuery.isLoading}
                      className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {laptopsQuery.isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More Laptops"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty State - No laptops found */}
            {laptopsQuery.data && laptopsQuery.data.laptops.length === 0 && !laptopsQuery.isLoading && (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-12 text-center border border-white/20">
                <Laptop className="mx-auto mb-4 h-16 w-16 text-gray-500" />
                <h3 className="mb-2 text-xl font-bold text-white">
                  No Laptops Found
                </h3>
                <p className="text-gray-400 mb-4">
                  {searchQuery || selectedBrands.length > 0 || selectedProcessors.length > 0 || minRam || minStorage || minPrice || maxPrice
                    ? "Try adjusting your filters or search query"
                    : "No laptop recommendations have been generated yet. Generate some PC builds to see laptop recommendations!"}
                </p>
                {searchQuery === "" && selectedBrands.length === 0 && selectedProcessors.length === 0 && !minRam && !minStorage && !minPrice && !maxPrice && (
                  <button
                    onClick={() => navigate({ to: "/build" })}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60"
                  >
                    Generate a Build
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Compare Button */}
      {buildStore.comparisonLaptops.length > 0 && (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50">
          <button
            onClick={() => navigate({ to: "/compare/laptops" })}
            className="flex items-center gap-2 sm:gap-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-2xl shadow-purple-500/50 transition hover:shadow-purple-500/70 hover:scale-105 active:scale-95"
          >
            <GitCompare className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Compare Selected</span>
            <span className="sm:hidden">Compare</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
              {buildStore.comparisonLaptops.length}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
