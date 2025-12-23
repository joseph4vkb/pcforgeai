import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useBuildStore } from "~/stores/useBuildStore";
import { useAuthStore } from "~/stores/useAuthStore";
import { 
  Cpu, 
  ArrowLeft, 
  X,
  GitCompare,
  ShoppingCart,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/compare/")({
  component: ComparePage,
});

function ComparePage() {
  const navigate = useNavigate();
  const buildStore = useBuildStore();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();
  
  const affiliateIdQuery = useQuery(
    trpc.getAmazonAffiliateId.queryOptions()
  );

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const getAmazonUrl = (part: { asin: string; name: string; url?: string }) => {
    // Use the direct URL from PA API if available
    if (part.url) {
      return part.url;
    }
    
    // Fallback to search URL with product name
    const affiliateId = affiliateIdQuery.data?.amazonAffiliateId || "eknowledgetre-21";
    return `https://www.amazon.in/s?k=${encodeURIComponent(part.name)}&tag=${affiliateId}`;
  };

  const handleRemove = (buildId: number) => {
    buildStore.removeFromComparison(buildId);
    toast.success("Removed from comparison");
  };

  const handleClearAll = () => {
    buildStore.clearComparison();
    toast.success("Cleared all comparisons");
  };

  // Get all unique part categories across all builds
  const allCategories = Array.from(
    new Set(
      buildStore.comparisonBuilds.flatMap((build) =>
        (build.parts as any[]).map((part) => part.category)
      )
    )
  );

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
              <GitCompare className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Compare Builds</span>
            </div>
            <div className="flex items-center gap-2">
              {token && (
                <button
                  onClick={() => navigate({ to: role === "admin" ? "/admin/dashboard" : "/account" })}
                  className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                >
                  {email}
                </button>
              )}
              {buildStore.comparisonBuilds.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 backdrop-blur-sm transition hover:bg-red-500/30 border border-red-500/30"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {buildStore.comparisonBuilds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-purple-500/10 p-8">
              <GitCompare className="h-24 w-24 text-purple-400" />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white">
              No Builds to Compare
            </h2>
            <p className="mb-8 max-w-md text-gray-400">
              Go to your saved builds and select builds to compare their specifications
              side-by-side.
            </p>
            <button
              onClick={() => navigate({ to: "/account" })}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60"
            >
              View Saved Builds
            </button>
          </div>
        ) : (
          <>
            {/* Build Overview Cards */}
            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {buildStore.comparisonBuilds.map((build) => (
                <div
                  key={build.id}
                  className="relative rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-xl backdrop-blur-md border border-white/20"
                >
                  <button
                    onClick={() => handleRemove(build.id)}
                    className="absolute right-2 top-2 rounded-full bg-red-500/20 p-1.5 text-red-400 transition hover:bg-red-500/30"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  <div className="mb-3 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 border border-blue-500/30">
                    {build.category}
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-white">
                      {formatPrice(build.totalCost)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Budget: {formatPrice(build.budget)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-green-500/20 px-3 py-2 border border-green-500/30">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">
                      {build.compatibility.toFixed(1)}%
                    </span>
                  </div>

                  <button
                    onClick={() => navigate({ to: `/build/${build.id}` })}
                    className="mt-4 w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl bg-white/5 backdrop-blur-md border border-white/20">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400">
                      Component
                    </th>
                    {buildStore.comparisonBuilds.map((build) => (
                      <th
                        key={build.id}
                        className="p-4 text-left text-sm font-semibold text-white min-w-[250px]"
                      >
                        <div className="rounded-lg bg-blue-500/20 px-3 py-2 border border-blue-500/30">
                          {build.category}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Summary Row */}
                  <tr className="border-b border-white/10 bg-white/5">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-white">
                      Total Cost
                    </td>
                    {buildStore.comparisonBuilds.map((build) => (
                      <td key={build.id} className="p-4 text-white font-bold text-xl">
                        {formatPrice(build.totalCost)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/10 bg-white/5">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-white">
                      Compatibility
                    </td>
                    {buildStore.comparisonBuilds.map((build) => (
                      <td key={build.id} className="p-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-400 border border-green-500/30">
                          <CheckCircle2 className="h-4 w-4" />
                          {build.compatibility.toFixed(1)}%
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Component Rows */}
                  {allCategories.map((category) => (
                    <tr key={category} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-blue-400">
                        {category}
                      </td>
                      {buildStore.comparisonBuilds.map((build) => {
                        const part = (build.parts as any[]).find(
                          (p) => p.category === category
                        );
                        return (
                          <td key={build.id} className="p-4">
                            {part ? (
                              <div className="space-y-2">
                                <div className="font-medium text-white">
                                  {part.name}
                                </div>
                                <div className="text-lg font-bold text-blue-400">
                                  {formatPrice(part.price)}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(part.specs).map(([key, value]) => (
                                    <span
                                      key={key}
                                      className="rounded bg-white/10 px-2 py-1 text-xs text-gray-300"
                                    >
                                      {key}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                                {part.asin !== "INTEGRATED" && part.asin !== "STOCK" && (
                                  <a
                                    href={getAmazonUrl(part)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                                  >
                                    <ShoppingCart className="h-3 w-3" />
                                    Buy
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500">—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Help Text */}
            <div className="mt-8 rounded-xl bg-blue-500/10 p-6 text-center border border-blue-500/30">
              <AlertCircle className="mx-auto mb-2 h-6 w-6 text-blue-400" />
              <p className="text-sm text-gray-300">
                You can compare up to 4 builds at once. Add more from your saved builds page.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
