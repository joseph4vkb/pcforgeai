import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { AdBanner } from "~/components/AdBanner";
import { 
  Box, 
  ArrowLeft, 
  Loader2,
  User,
  Filter,
  Search,
  ShoppingCart,
  ArrowUpDown,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Tag,
  Sparkles,
  Zap
} from "lucide-react";

export const Route = createFileRoute("/mini-pcs/")({
  component: MiniPcsPage,
});

function MiniPcsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();

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

  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    processor: true,
    ram: true,
    storage: true,
    price: true,
  });

  const miniPcsQuery = useQuery(
    trpc.getMiniPcs.queryOptions({
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const handleMiniPcClick = async (miniPc: any) => {
    if (!miniPc.url) return;
    
    try {
      await recordClickMutation.mutateAsync({
        targetType: "MiniPC",
        targetId: miniPc.url,
        targetName: miniPc.name,
        metadata: {
          brand: miniPc.brand,
          processor: miniPc.processor,
          ram: miniPc.ram,
          storage: miniPc.storage,
          price: miniPc.price,
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
    
    window.open(miniPc.url, "_blank", "noopener,noreferrer");
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedProcessors([]);
    setMinRam(undefined);
    setMinStorage(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters = selectedBrands.length > 0 || selectedProcessors.length > 0 || 
    minRam || minStorage || minPrice || maxPrice || searchQuery;

  const activeFilterCount = selectedBrands.length + selectedProcessors.length + 
    (minRam ? 1 : 0) + (minStorage ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (searchQuery ? 1 : 0);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const quickFilters = [
    { label: "Budget Office", maxPrice: 30000, minRam: 8 },
    { label: "Gaming Ready", minRam: 16, minStorage: 512 },
    { label: "High Performance", minRam: 32, minPrice: 50000 },
    { label: "Compact Storage", minStorage: 1024 },
  ];

  const applyQuickFilter = (filter: typeof quickFilters[0]) => {
    clearAllFilters();
    if (filter.minRam) {
      setMinRam(filter.minRam);
    }
    if (filter.minStorage) {
      setMinStorage(filter.minStorage);
    }
    if (filter.minPrice) {
      setMinPrice(filter.minPrice);
    }
    if (filter.maxPrice) {
      setMaxPrice(filter.maxPrice);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 text-gray-300 transition hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
            <div className="flex items-center gap-2">
              <Box className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              <span className="text-xl sm:text-2xl font-bold text-white">Browse Mini PCs</span>
            </div>
            <div className="flex items-center gap-2">
              {token ? (
                <>
                  <button
                    onClick={() => navigate({ to: role === "admin" ? "/admin/dashboard" : "/account" })}
                    className="hidden sm:flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{email}</span>
                  </button>
                  <button
                    onClick={() => navigate({ to: role === "admin" ? "/admin/dashboard" : "/account" })}
                    className="sm:hidden flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate({ to: "/login" })}
                    className="rounded-lg bg-white/10 px-3 sm:px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate({ to: "/register" })}
                    className="hidden sm:block rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:shadow-lg hover:shadow-green-500/50"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-12">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 sm:mb-3 text-3xl sm:text-4xl font-bold text-white">
            Browse Recommended Mini PCs
          </h1>
          <p className="text-base sm:text-lg text-gray-400">
            Explore compact Mini PCs recommended by our AI across all PC builds
          </p>
        </div>

        {/* Quick Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-green-400" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Quick Filters</h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                onClick={() => applyQuickFilter(filter)}
                className="rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 text-sm font-medium text-green-300 border border-green-400/30 backdrop-blur-sm transition hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 hover:scale-105 active:scale-95"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Ad - Mini PC Browse Top */}
        <div className="mb-6 sm:mb-8">
          <AdBanner locationKey="MINI_PC_BROWSE_TOP" className="mx-auto max-w-4xl" />
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          {/* Sidebar - Filters */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-4 sm:p-6 shadow-2xl backdrop-blur-md border border-white/20">
              <div className="mb-4 sm:mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/20 p-2">
                    <Filter className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Filters</h2>
                    {activeFilterCount > 0 && (
                      <p className="text-xs text-green-400">{activeFilterCount} active</p>
                    )}
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-green-400 hover:text-green-300 transition flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Search */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Search Mini PCs
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search by name or brand..."
                      className="w-full rounded-lg border border-white/20 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Brand Filter */}
                {miniPcsQuery.data?.filterOptions.brands && miniPcsQuery.data.filterOptions.brands.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleSection('brand')}
                      className="w-full flex items-center justify-between mb-3 group"
                    >
                      <label className="text-sm font-medium text-gray-300 group-hover:text-white transition cursor-pointer">
                        Brand {selectedBrands.length > 0 && <span className="text-green-400">({selectedBrands.length})</span>}
                      </label>
                      {expandedSections.brand ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      )}
                    </button>
                    {expandedSections.brand && (
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {miniPcsQuery.data.filterOptions.brands.map((brand) => (
                          <label
                            key={brand}
                            className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand)}
                              onChange={() => handleBrandChange(brand)}
                              className="h-4 w-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-2 focus:ring-green-400/50 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition">
                              {brand}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Processor Filter */}
                {miniPcsQuery.data?.filterOptions.processors && miniPcsQuery.data.filterOptions.processors.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleSection('processor')}
                      className="w-full flex items-center justify-between mb-3 group"
                    >
                      <label className="text-sm font-medium text-gray-300 group-hover:text-white transition cursor-pointer">
                        Processor {selectedProcessors.length > 0 && <span className="text-green-400">({selectedProcessors.length})</span>}
                      </label>
                      {expandedSections.processor ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      )}
                    </button>
                    {expandedSections.processor && (
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {miniPcsQuery.data.filterOptions.processors.map((processor) => (
                          <label
                            key={processor}
                            className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedProcessors.includes(processor)}
                              onChange={() => handleProcessorChange(processor)}
                              className="h-4 w-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-2 focus:ring-green-400/50 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition line-clamp-2">
                              {processor}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* RAM Filter */}
                {miniPcsQuery.data?.filterOptions.ramOptions && miniPcsQuery.data.filterOptions.ramOptions.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleSection('ram')}
                      className="w-full flex items-center justify-between mb-3 group"
                    >
                      <label className="text-sm font-medium text-gray-300 group-hover:text-white transition cursor-pointer">
                        Minimum RAM {minRam && <span className="text-green-400">({minRam}GB)</span>}
                      </label>
                      {expandedSections.ram ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      )}
                    </button>
                    {expandedSections.ram && (
                      <div className="space-y-2">
                        {miniPcsQuery.data.filterOptions.ramOptions.map((ram) => (
                          <label
                            key={ram}
                            className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
                          >
                            <input
                              type="radio"
                              name="ram"
                              checked={minRam === ram}
                              onChange={() => handleRamChange(ram)}
                              className="h-4 w-4 border-white/20 bg-white/5 text-green-500 focus:ring-2 focus:ring-green-400/50 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition">
                              {ram} GB
                            </span>
                          </label>
                        ))}
                        {minRam && (
                          <button
                            onClick={() => handleRamChange(undefined)}
                            className="text-xs text-green-400 hover:text-green-300 transition ml-2"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Storage Filter */}
                {miniPcsQuery.data?.filterOptions.storageOptions && miniPcsQuery.data.filterOptions.storageOptions.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleSection('storage')}
                      className="w-full flex items-center justify-between mb-3 group"
                    >
                      <label className="text-sm font-medium text-gray-300 group-hover:text-white transition cursor-pointer">
                        Min Storage {minStorage && <span className="text-green-400">({minStorage >= 1024 ? `${minStorage/1024}TB` : `${minStorage}GB`})</span>}
                      </label>
                      {expandedSections.storage ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      )}
                    </button>
                    {expandedSections.storage && (
                      <div className="space-y-2">
                        {miniPcsQuery.data.filterOptions.storageOptions.map((storage) => (
                          <label
                            key={storage}
                            className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
                          >
                            <input
                              type="radio"
                              name="storage"
                              checked={minStorage === storage}
                              onChange={() => handleStorageChange(storage)}
                              className="h-4 w-4 border-white/20 bg-white/5 text-green-500 focus:ring-2 focus:ring-green-400/50 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition">
                              {storage >= 1024 ? `${storage / 1024} TB` : `${storage} GB`}
                            </span>
                          </label>
                        ))}
                        {minStorage && (
                          <button
                            onClick={() => handleStorageChange(undefined)}
                            className="text-xs text-green-400 hover:text-green-300 transition ml-2"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Range */}
                <div className="border-t border-white/10 pt-4">
                  <button
                    onClick={() => toggleSection('price')}
                    className="w-full flex items-center justify-between mb-3 group"
                  >
                    <label className="text-sm font-medium text-gray-300 group-hover:text-white transition cursor-pointer">
                      Price Range {(minPrice || maxPrice) && <span className="text-green-400">(Set)</span>}
                    </label>
                    {expandedSections.price ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                    )}
                  </button>
                  {expandedSections.price && (
                    <div className="space-y-3">
                      <input
                        type="number"
                        value={minPrice || ""}
                        onChange={(e) => handlePriceChange('min', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Min price (₹)"
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      />
                      <input
                        type="number"
                        value={maxPrice || ""}
                        onChange={(e) => handlePriceChange('max', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max price (₹)"
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main>
            {/* Results Count and Sort */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {miniPcsQuery.data && (
                <div className="rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                  <p className="text-sm sm:text-base text-gray-300">
                    Showing{" "}
                    <span className="font-semibold text-white">
                      {miniPcsQuery.data.miniPcs.length}
                    </span>
                    {miniPcsQuery.data.totalResults > 0 && (
                      <>
                        {" "}of{" "}
                        <span className="font-semibold text-white">
                          {miniPcsQuery.data.totalResults}
                        </span>
                      </>
                    )}{" "}
                    mini PCs
                  </p>
                </div>
              )}

              {miniPcsQuery.data && miniPcsQuery.data.miniPcs.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                  <ArrowUpDown className="h-4 w-4 text-green-400" />
                  <label htmlFor="sort-select" className="text-sm font-medium text-gray-300 whitespace-nowrap">
                    Sort by:
                  </label>
                  <select
                    id="sort-select"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 cursor-pointer"
                  >
                    <option value="price-asc" className="bg-slate-800">Price: Low to High</option>
                    <option value="price-desc" className="bg-slate-800">Price: High to Low</option>
                    <option value="brand-asc" className="bg-slate-800">Brand (A-Z)</option>
                    <option value="brand-desc" className="bg-slate-800">Brand (Z-A)</option>
                    <option value="ram-asc" className="bg-slate-800">RAM: Low to High</option>
                    <option value="ram-desc" className="bg-slate-800">RAM: High to Low</option>
                    <option value="storage-asc" className="bg-slate-800">Storage: Low to High</option>
                    <option value="storage-desc" className="bg-slate-800">Storage: High to Low</option>
                  </select>
                </div>
              )}
            </div>

            {/* Loading State */}
            {miniPcsQuery.isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-green-400" />
                <p className="text-gray-400">Loading mini PCs...</p>
              </div>
            )}

            {/* Mini PCs Grid */}
            {miniPcsQuery.data && miniPcsQuery.data.miniPcs.length > 0 && (
              <>
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {miniPcsQuery.data.miniPcs.map((miniPc, index) => (
                    <div
                      key={index}
                      className="group relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-green-900/30 via-green-800/20 to-emerald-900/20 overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300 hover:border-green-400/50 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1"
                    >
                      {/* Icon Header */}
                      <div className="relative bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 sm:p-8 border-b border-white/10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.3),transparent)]" />
                        <div className="relative flex items-center justify-center">
                          <div className="rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 p-4 backdrop-blur-sm border border-green-400/30">
                            <Box className="h-12 w-12 text-green-300" />
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <div className="rounded-full bg-gradient-to-r from-green-500/30 to-emerald-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-200 border border-green-400/40 backdrop-blur-sm">
                            {miniPc.brand}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5 sm:p-6">
                        <h3 className="mb-4 line-clamp-2 min-h-[3rem] text-base sm:text-lg font-bold leading-tight text-white group-hover:text-green-100 transition-colors">
                          {miniPc.name}
                        </h3>

                        {/* Key Specs */}
                        <div className="mb-4 space-y-2.5">
                          <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-3 border border-green-400/20">
                            <Cpu className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Processor</div>
                              <div className="text-sm font-semibold text-white line-clamp-2">{miniPc.processor}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2.5 border border-white/10">
                              <MemoryStick className="h-4 w-4 text-green-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">RAM</div>
                                <div className="text-sm font-semibold text-white">{miniPc.ram}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2.5 border border-white/10">
                              <HardDrive className="h-4 w-4 text-green-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-400">Storage</div>
                                <div className="text-sm font-semibold text-white truncate">{miniPc.storage}</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/10">
                            <Zap className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Graphics</div>
                              <div className="text-sm font-semibold text-white line-clamp-2">{miniPc.gpu}</div>
                            </div>
                          </div>
                        </div>

                        {/* Price Section */}
                        <div className="mt-auto mb-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 border border-green-400/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Price
                              </div>
                              <div className="text-xl sm:text-2xl font-bold text-white">
                                {formatPrice(miniPc.price)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CTA Button */}
                        {miniPc.url && (
                          <button
                            onClick={() => handleMiniPcClick(miniPc)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-green-500/30 transition-all duration-300 hover:from-green-600 hover:to-emerald-600 hover:shadow-xl hover:shadow-green-500/40 active:scale-95"
                          >
                            <ShoppingCart className="h-5 w-5" />
                            View on Amazon
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {miniPcsQuery.data.hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={miniPcsQuery.isLoading}
                      className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-4 font-semibold text-white shadow-lg shadow-green-500/50 transition hover:shadow-xl hover:shadow-green-500/60 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {miniPcsQuery.isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More Mini PCs"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {miniPcsQuery.data && miniPcsQuery.data.miniPcs.length === 0 && !miniPcsQuery.isLoading && (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-12 text-center border border-white/20">
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-400/30">
                  <Box className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  No Mini PCs Found
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search query to see more results"
                    : "No Mini PC recommendations have been generated yet. Generate some PC builds to see Mini PC recommendations!"}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => navigate({ to: "/build" })}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-green-500/50 transition hover:shadow-xl hover:shadow-green-500/60 hover:scale-105"
                  >
                    Generate a Build
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
