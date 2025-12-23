import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useBuildStore } from "~/stores/useBuildStore";
import { useAuthStore } from "~/stores/useAuthStore";
import { 
  Laptop, 
  ArrowLeft, 
  X,
  GitCompare,
  ShoppingCart,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/compare/laptops/")({
  component: CompareLaptopsPage,
});

function CompareLaptopsPage() {
  const navigate = useNavigate();
  const buildStore = useBuildStore();
  const { token, email, role } = useAuthStore();

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const handleRemove = (laptopUrl: string) => {
    buildStore.removeLaptopFromComparison(laptopUrl);
    toast.success("Removed from comparison");
  };

  const handleClearAll = () => {
    buildStore.clearLaptopComparison();
    toast.success("Cleared all comparisons");
  };

  const handleBuyClick = (laptop: any) => {
    if (!laptop.url) return;
    window.open(laptop.url, "_blank", "noopener,noreferrer");
  };

  // Get all unique spec keys across all laptops
  const allSpecKeys = Array.from(
    new Set(
      buildStore.comparisonLaptops.flatMap((laptop) =>
        Object.keys(laptop.specs || {})
      )
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/laptops" })}
              className="flex items-center gap-2 text-gray-300 transition hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Laptops</span>
            </button>
            <div className="flex items-center gap-2">
              <GitCompare className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Compare Laptops</span>
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
              {buildStore.comparisonLaptops.length > 0 && (
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
        {buildStore.comparisonLaptops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-purple-500/10 p-8">
              <GitCompare className="h-24 w-24 text-purple-400" />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white">
              No Laptops to Compare
            </h2>
            <p className="mb-8 max-w-md text-gray-400">
              Go to the laptops page and select laptops to compare their specifications
              side-by-side.
            </p>
            <button
              onClick={() => navigate({ to: "/laptops" })}
              className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60"
            >
              Browse Laptops
            </button>
          </div>
        ) : (
          <>
            {/* Laptop Overview Cards */}
            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {buildStore.comparisonLaptops.map((laptop) => (
                <div
                  key={laptop.url}
                  className="relative rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-xl backdrop-blur-md border border-white/20"
                >
                  <button
                    onClick={() => handleRemove(laptop.url || "")}
                    className="absolute right-2 top-2 rounded-full bg-red-500/20 p-1.5 text-red-400 transition hover:bg-red-500/30"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  <div className="mb-3 inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300 border border-purple-500/30">
                    {laptop.brand}
                  </div>
                  
                  <h3 className="mb-4 text-sm font-semibold text-white leading-tight line-clamp-2 min-h-[2.5rem]">
                    {laptop.name}
                  </h3>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-white">
                      {formatPrice(laptop.price)}
                    </div>
                  </div>

                  {laptop.url && (
                    <button
                      onClick={() => handleBuyClick(laptop)}
                      className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/30"
                    >
                      View on Amazon
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl bg-white/5 backdrop-blur-md border border-white/20">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 text-left text-sm font-semibold uppercase tracking-wider text-gray-400">
                      Specification
                    </th>
                    {buildStore.comparisonLaptops.map((laptop) => (
                      <th
                        key={laptop.url}
                        className="p-4 text-left text-sm font-semibold text-white min-w-[250px]"
                      >
                        <div className="rounded-lg bg-purple-500/20 px-3 py-2 border border-purple-500/30">
                          {laptop.brand}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Name Row */}
                  <tr className="border-b border-white/10 bg-white/5">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-white">
                      Model Name
                    </td>
                    {buildStore.comparisonLaptops.map((laptop) => (
                      <td key={laptop.url} className="p-4 text-white font-medium">
                        {laptop.name}
                      </td>
                    ))}
                  </tr>

                  {/* Price Row */}
                  <tr className="border-b border-white/10 bg-white/5">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-white">
                      Price
                    </td>
                    {buildStore.comparisonLaptops.map((laptop) => (
                      <td key={laptop.url} className="p-4 text-white font-bold text-xl">
                        {formatPrice(laptop.price)}
                      </td>
                    ))}
                  </tr>

                  {/* Processor Row */}
                  <tr className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-purple-400">
                      Processor
                    </td>
                    {buildStore.comparisonLaptops.map((laptop) => (
                      <td key={laptop.url} className="p-4 text-white">
                        {laptop.processor}
                      </td>
                    ))}
                  </tr>

                  {/* RAM Row */}
                  <tr className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-purple-400">
                      RAM
                    </td>
                    {buildStore.comparisonLaptops.map((laptop) => (
                      <td key={laptop.url} className="p-4 text-white font-medium">
                        {laptop.ram}
                      </td>
                    ))}
                  </tr>

                  {/* Storage Row */}
                  <tr className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-purple-400">
                      Storage
                    </td>
                    {buildStore.comparisonLaptops.map((laptop) => (
                      <td key={laptop.url} className="p-4 text-white font-medium">
                        {laptop.storage}
                      </td>
                    ))}
                  </tr>

                  {/* GPU Row */}
                  <tr className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-purple-400">
                      Graphics
                    </td>
                    {buildStore.comparisonLaptops.map((laptop) => (
                      <td key={laptop.url} className="p-4 text-white">
                        {laptop.gpu}
                      </td>
                    ))}
                  </tr>

                  {/* Additional Specs Rows */}
                  {allSpecKeys.map((specKey) => (
                    <tr key={specKey} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-blue-400 capitalize">
                        {specKey}
                      </td>
                      {buildStore.comparisonLaptops.map((laptop) => {
                        const specValue = laptop.specs?.[specKey];
                        return (
                          <td key={laptop.url} className="p-4">
                            {specValue ? (
                              <span className="text-white">{String(specValue)}</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Buy Button Row */}
                  <tr className="bg-white/5">
                    <td className="sticky left-0 bg-black/40 backdrop-blur-sm p-4 font-semibold text-white">
                      Purchase
                    </td>
                    {buildStore.comparisonLaptops.map((laptop) => (
                      <td key={laptop.url} className="p-4">
                        {laptop.url && (
                          <button
                            onClick={() => handleBuyClick(laptop)}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/30"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Buy Now
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Help Text */}
            <div className="mt-8 rounded-xl bg-purple-500/10 p-6 text-center border border-purple-500/30">
              <AlertCircle className="mx-auto mb-2 h-6 w-6 text-purple-400" />
              <p className="text-sm text-gray-300">
                You can compare up to 4 laptops at once. Add more from the laptops page.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
