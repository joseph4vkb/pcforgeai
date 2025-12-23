import { useNavigate } from "@tanstack/react-router";
import { Cpu, Shield, Star, ChevronRight } from "lucide-react";

type BuildCardProps = {
  id: number;
  category: string;
  totalCost: number;
  parts: Array<{
    category: string;
    name: string;
    price: number;
  }>;
  compatibility: number;
  isFeatured?: boolean;
  viewMode?: "grid" | "list";
};

export function BuildCard({
  id,
  category,
  totalCost,
  parts,
  compatibility,
  isFeatured = false,
  viewMode = "grid",
}: BuildCardProps) {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return `₹${(price / 1000).toFixed(0)}k`;
  };

  const cpuPart = parts.find((p) => p.category === "CPU");
  const gpuPart = parts.find((p) => p.category === "GPU");

  if (viewMode === "list") {
    return (
      <div
        className="group cursor-pointer overflow-hidden rounded-xl bg-white/10 backdrop-blur-md transition hover:bg-white/15 border border-white/10 hover:border-blue-400/50 hover:scale-[1.01]"
        onClick={() => navigate({ to: `/build/${id}` })}
      >
        <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
          {/* Icon and Category */}
          <div className="flex items-center gap-4 md:w-48">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex-shrink-0">
              <Cpu className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <div className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/30">
                {category}
              </div>
              {isFeatured && (
                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Components */}
          <div className="flex-1 space-y-2 text-sm min-w-0">
            {cpuPart && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 whitespace-nowrap font-medium">CPU:</span>
                <span className="text-gray-300 line-clamp-1">{cpuPart.name}</span>
              </div>
            )}
            {gpuPart && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 whitespace-nowrap font-medium">GPU:</span>
                <span className="text-gray-300 line-clamp-1">{gpuPart.name}</span>
              </div>
            )}
          </div>

          {/* Price and Compatibility */}
          <div className="flex items-center gap-6 md:w-64 justify-between md:justify-end">
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {formatPrice(totalCost)}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <Shield className="h-3 w-3" />
                {compatibility.toFixed(1)}% Compatible
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-400" />
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md transition hover:bg-white/15 border border-white/10 hover:border-blue-400/50 hover:scale-[1.02]"
      onClick={() => navigate({ to: `/build/${id}` })}
    >
      <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <Cpu className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-white/20" />
        </div>
        <div className="absolute left-3 sm:left-4 top-3 sm:top-4 rounded-full bg-black/50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {category}
        </div>
        {isFeatured && (
          <div className="absolute right-3 sm:right-4 top-3 sm:top-4">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </div>
      
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
          <span className="text-xl sm:text-2xl font-bold text-white">
            {formatPrice(totalCost)}
          </span>
          <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 border border-green-500/30">
            <Shield className="h-3 w-3" />
            {compatibility.toFixed(1)}%
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
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 transition group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
