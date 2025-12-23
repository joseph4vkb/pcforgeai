import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { AdBanner } from "~/components/AdBanner";
import { 
  Headphones, 
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
  Mic,
  Wifi,
  Cable,
  Tag,
  Sparkles,
  Star
} from "lucide-react";

export const Route = createFileRoute("/headsets/")({
  component: HeadsetsPage,
});

function HeadsetsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedConnectivity, setSelectedConnectivity] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price" | "brand" | "type">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    type: true,
    connectivity: true,
    price: true,
  });

  const headsetsQuery = useQuery(
    trpc.getHeadsets.queryOptions({
      brand: selectedBrands.length > 0 ? selectedBrands : undefined,
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      connectivity: selectedConnectivity.length > 0 ? selectedConnectivity : undefined,
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

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
    setPage(1);
  };

  const handleConnectivityChange = (connectivity: string) => {
    setSelectedConnectivity((prev) =>
      prev.includes(connectivity)
        ? prev.filter((c) => c !== connectivity)
        : [...prev, connectivity]
    );
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
    const [newSortBy, newSortOrder] = value.split("-") as ["price" | "brand" | "type", "asc" | "desc"];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleHeadsetClick = async (headset: any) => {
    if (!headset.url) return;
    
    try {
      await recordClickMutation.mutateAsync({
        targetType: "Headset",
        targetId: headset.url,
        targetName: headset.name,
        metadata: {
          brand: headset.brand,
          type: headset.type,
          connectivity: headset.connectivity,
          price: headset.price,
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
    
    window.open(headset.url, "_blank", "noopener,noreferrer");
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSelectedConnectivity([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters = selectedBrands.length > 0 || selectedTypes.length > 0 || 
    selectedConnectivity.length > 0 || minPrice || maxPrice || searchQuery;

  const activeFilterCount = selectedBrands.length + selectedTypes.length + 
    selectedConnectivity.length + (minPrice || maxPrice ? 1 : 0) + (searchQuery ? 1 : 0);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const quickFilters = [
    { label: "Gaming Wireless", type: "Gaming", connectivity: "Wireless" },
    { label: "Budget Wired", maxPrice: 3000, connectivity: "Wired" },
    { label: "Premium Gaming", type: "Gaming", minPrice: 5000 },
    { label: "Studio Quality", type: "Studio" },
  ];

  const applyQuickFilter = (filter: typeof quickFilters[0]) => {
    clearAllFilters();
    if (filter.type) {
      setSelectedTypes([filter.type]);
    }
    if (filter.connectivity) {
      setSelectedConnectivity([filter.connectivity]);
    }
    if (filter.minPrice) {
      setMinPrice(filter.minPrice);
    }
    if (filter.maxPrice) {
      setMaxPrice(filter.maxPrice);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-slate-900">
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
              <Headphones className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400" />
              <span className="text-xl sm:text-2xl font-bold text-white">Browse Headsets</span>
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
                    className="hidden sm:block rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:shadow-lg hover:shadow-pink-500/50"
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
            Browse Recommended Headsets
          </h1>
          <p className="text-base sm:text-lg text-gray-400">
            Explore headsets recommended by our AI across all PC builds
          </p>
        </div>

        {/* Quick Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-pink-400" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Quick Filters</h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                onClick={() => applyQuickFilter(filter)}
                className="rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 px-4 py-2 text-sm font-medium text-pink-300 border border-pink-400/30 backdrop-blur-sm transition hover:from-pink-500/30 hover:to-rose-500/30 hover:border-pink-400/50 hover:scale-105 active:scale-95"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Ad - Headset Browse Top */}
        <div className="mb-6 sm:mb-8">
          <AdBanner locationKey="HEADSET_BROWSE_TOP" className="mx-auto max-w-4xl" />
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          {/* Sidebar - Filters */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-4 sm:p-6 shadow-2xl backdrop-blur-md border border-white/20">
              <div className="mb-4 sm:mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-pink-500/20 p-2">
                    <Filter className="h-5 w-5 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Filters</h2>
                    {activeFilterCount > 0 && (
                      <p className="text-xs text-pink-400">{activeFilterCount} active</p>
                    )}
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-pink-400 hover:text-pink-300 transition flex items-center gap-1"
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
                    Search Headsets
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search by name or brand..."
                      className="w-full rounded-lg border border-white/20 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50"
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
                {headsetsQuery.data?.filterOptions.brands && headsetsQuery.data.filterOptions.brands.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleSection('brand')}
                      className="w-full flex items-center justify-between mb-3 group"
                    >
                      <label className="text-sm font-medium text-gray-300 group-hover:text-white transition cursor-pointer">
                        Brand {selectedBrands.length > 0 && <span className="text-pink-400">({selectedBrands.length})</span>}
                      </label>
                      {expandedSections.brand ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      )}
                    </button>
                    {expandedSections.brand && (
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {headsetsQuery.data.filterOptions.brands.map((brand) => (
                          <label
                            key={brand}
                            className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand)}
                              onChange={() => handleBrandChange(brand)}
                              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-2 focus:ring-pink-400/50 focus:ring-offset-0 cursor-pointer"
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

                {/* Type Filter */}
                {headsetsQuery.data?.filterOptions.types && headsetsQuery.data.filterOptions.types.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleSection('type')}
                      className="w-full flex items-center justify-between mb-3 group"
                    >
                      <label className="text-sm font-medium text-gray-300 group-hover:text-white transition cursor-pointer">
                        Type {selectedTypes.length > 0 && <span className="text-pink-400">({selectedTypes.length})</span>}
                      </label>
                      {expandedSections.type ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      )}
                    </button>
                    {expandedSections.type && (
                      <div className="space-y-2">
                        {headsetsQuery.data.filterOptions.types.map((type) => (
                          <label
                            key={type}
                            className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes(type)}
                              onChange={() => handleTypeChange(type)}
                              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-2 focus:ring-pink-400/50 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition">
                              {type}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Connectivity Filter */}
                {headsetsQuery.data?.filterOptions.connectivityOptions && headsetsQuery.data.filterOptions.connectivityOptions.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleSection('connectivity')}
                      className="w-full flex items-center justify-between mb-3 group"
                    >
                      <label className="text-sm font-medium text-gray-300 group-hover:text-white transition cursor-pointer">
                        Connectivity {selectedConnectivity.length > 0 && <span className="text-pink-400">({selectedConnectivity.length})</span>}
                      </label>
                      {expandedSections.connectivity ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition" />
                      )}
                    </button>
                    {expandedSections.connectivity && (
                      <div className="space-y-2">
                        {headsetsQuery.data.filterOptions.connectivityOptions.map((connectivity) => (
                          <label
                            key={connectivity}
                            className="flex items-center gap-3 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedConnectivity.includes(connectivity)}
                              onChange={() => handleConnectivityChange(connectivity)}
                              className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-2 focus:ring-pink-400/50 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition">
                              {connectivity}
                            </span>
                          </label>
                        ))}
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
                      Price Range {(minPrice || maxPrice) && <span className="text-pink-400">(Set)</span>}
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
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                      />
                      <input
                        type="number"
                        value={maxPrice || ""}
                        onChange={(e) => handlePriceChange('max', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Max price (₹)"
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50"
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
              {headsetsQuery.data && (
                <div className="rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                  <p className="text-sm sm:text-base text-gray-300">
                    Showing{" "}
                    <span className="font-semibold text-white">
                      {headsetsQuery.data.headsets.length}
                    </span>
                    {headsetsQuery.data.totalResults > 0 && (
                      <>
                        {" "}of{" "}
                        <span className="font-semibold text-white">
                          {headsetsQuery.data.totalResults}
                        </span>
                      </>
                    )}{" "}
                    headsets
                  </p>
                </div>
              )}

              {headsetsQuery.data && headsetsQuery.data.headsets.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                  <ArrowUpDown className="h-4 w-4 text-pink-400" />
                  <label htmlFor="sort-select" className="text-sm font-medium text-gray-300 whitespace-nowrap">
                    Sort by:
                  </label>
                  <select
                    id="sort-select"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50 cursor-pointer"
                  >
                    <option value="price-asc" className="bg-slate-800">Price: Low to High</option>
                    <option value="price-desc" className="bg-slate-800">Price: High to Low</option>
                    <option value="brand-asc" className="bg-slate-800">Brand (A-Z)</option>
                    <option value="brand-desc" className="bg-slate-800">Brand (Z-A)</option>
                    <option value="type-asc" className="bg-slate-800">Type (A-Z)</option>
                    <option value="type-desc" className="bg-slate-800">Type (Z-A)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Loading State */}
            {headsetsQuery.isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-pink-400" />
                <p className="text-gray-400">Loading headsets...</p>
              </div>
            )}

            {/* Headsets Grid */}
            {headsetsQuery.data && headsetsQuery.data.headsets.length > 0 && (
              <>
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {headsetsQuery.data.headsets.map((headset, index) => (
                    <div
                      key={index}
                      className="group relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-pink-900/30 via-pink-800/20 to-rose-900/20 overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300 hover:border-pink-400/50 hover:shadow-2xl hover:shadow-pink-500/20 hover:-translate-y-1"
                    >
                      {/* Icon Header */}
                      <div className="relative bg-gradient-to-br from-pink-500/20 to-rose-500/20 p-6 sm:p-8 border-b border-white/10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(236,72,153,0.3),transparent)]" />
                        <div className="relative flex items-center justify-center">
                          <div className="rounded-2xl bg-gradient-to-br from-pink-500/30 to-rose-500/30 p-4 backdrop-blur-sm border border-pink-400/30">
                            <Headphones className="h-12 w-12 text-pink-300" />
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <div className="rounded-full bg-gradient-to-r from-pink-500/30 to-rose-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-200 border border-pink-400/40 backdrop-blur-sm">
                            {headset.brand}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5 sm:p-6">
                        <h3 className="mb-4 line-clamp-2 min-h-[3rem] text-base sm:text-lg font-bold leading-tight text-white group-hover:text-pink-100 transition-colors">
                          {headset.name}
                        </h3>

                        {/* Key Specs */}
                        <div className="mb-4 space-y-2.5">
                          <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-pink-500/10 to-rose-500/10 p-3 border border-pink-400/20">
                            <Mic className="h-4 w-4 text-pink-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Type</div>
                              <div className="text-sm font-semibold text-white">{headset.type}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/10">
                            {headset.connectivity?.toLowerCase().includes('wireless') ? (
                              <Wifi className="h-4 w-4 text-pink-400 flex-shrink-0" />
                            ) : (
                              <Cable className="h-4 w-4 text-pink-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Connectivity</div>
                              <div className="text-sm font-semibold text-white">{headset.connectivity}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/10">
                            <Star className="h-4 w-4 text-pink-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Features</div>
                              <div className="text-sm font-semibold text-white line-clamp-2">{headset.features}</div>
                            </div>
                          </div>
                        </div>

                        {/* Price Section */}
                        <div className="mt-auto mb-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 p-4 border border-pink-400/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Price
                              </div>
                              <div className="text-xl sm:text-2xl font-bold text-white">
                                {formatPrice(headset.price)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CTA Button */}
                        {headset.url && (
                          <button
                            onClick={() => handleHeadsetClick(headset)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-pink-500/30 transition-all duration-300 hover:from-pink-600 hover:to-rose-600 hover:shadow-xl hover:shadow-pink-500/40 active:scale-95"
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
                {headsetsQuery.data.hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={headsetsQuery.isLoading}
                      className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-4 font-semibold text-white shadow-lg shadow-pink-500/50 transition hover:shadow-xl hover:shadow-pink-500/60 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {headsetsQuery.isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More Headsets"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {headsetsQuery.data && headsetsQuery.data.headsets.length === 0 && !headsetsQuery.isLoading && (
              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-12 text-center border border-white/20">
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center border border-pink-400/30">
                  <Headphones className="h-10 w-10 text-pink-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  No Headsets Found
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search query to see more results"
                    : "No headset recommendations have been generated yet. Generate some PC builds to see headset recommendations!"}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => navigate({ to: "/build" })}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 font-semibold text-white shadow-lg shadow-pink-500/50 transition hover:shadow-xl hover:shadow-pink-500/60 hover:scale-105"
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
