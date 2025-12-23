import { Filter, Search } from "lucide-react";
import { useState } from "react";

type FilterSidebarProps = {
  onFilterChange: (filters: {
    category: string;
    minPrice?: number;
    maxPrice?: number;
    searchQuery?: string;
  }) => void;
  currentCategory: string;
};

const categories = [
  "All",
  "CPU",
  "GPU",
  "Motherboard",
  "RAM",
  "Storage",
  "PSU",
  "Case",
  "Cooler",
];

export function FilterSidebar({ onFilterChange, currentCategory }: FilterSidebarProps) {
  const [category, setCategory] = useState(currentCategory);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleApplyFilters = () => {
    onFilterChange({
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      searchQuery: searchQuery || undefined,
    });
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    onFilterChange({
      category: newCategory,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      searchQuery: searchQuery || undefined,
    });
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-md border border-white/20">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/20 p-2">
          <Filter className="h-5 w-5 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Filters</h2>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Search Products
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApplyFilters();
                }
              }}
              placeholder="Search by name..."
              className="w-full rounded-lg border border-white/20 bg-white/5 py-2 pl-10 pr-4 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Category
          </label>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                  category === cat
                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Price Range (₹)
          </label>
          <div className="space-y-3">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min price"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max price"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-400 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyFilters}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98]"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
