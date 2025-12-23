import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useBuildStore } from "~/stores/useBuildStore";
import { useAuthStore } from "~/stores/useAuthStore";
import {
  Cpu,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Info,
  Laptop
} from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { AdBanner } from "~/components/AdBanner";

const searchSchema = z.object({
  category: z.string().optional(),
  budget: z.number().optional(),
});

export const Route = createFileRoute("/build/")({
  component: BuildPage,
  validateSearch: searchSchema,
});

const categories = [
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

const DEFAULT_BUDGETS: Record<string, number> = {
  "Gaming": 100000,
  "Content Creation": 150000,
  "AI/ML Development": 200000,
  "Video Editing": 150000,
  "Office/Productivity": 40000,
  "Budget Gaming": 50000,
  "Developers": 80000,
  "Trading": 100000,
  "General Use": 35000,
  "Workstation": 250000,
  "Server/NAS": 60000,
  "Streaming": 120000,
  "Mining/Crypto": 150000,
  "Home Theater PC": 45000,
  "Compact/Mini PC": 55000,
  "Extreme Performance": 400000,
};

function BuildPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const search = Route.useSearch();
  const buildStore = useBuildStore();
  const { token, email, role } = useAuthStore();

  const [category, setCategory] = useState(search.category || "Gaming");
  const [budget, setBudget] = useState(search.budget || DEFAULT_BUDGETS["Gaming"] || 100000);

  const affiliateIdQuery = useQuery(
    trpc.getAmazonAffiliateId.queryOptions()
  );

  const generateMutation = useMutation(
    trpc.generatePcBuild.mutationOptions()
  );

  const saveUserBuildMutation = useMutation(
    trpc.saveUserBuild.mutationOptions()
  );

  const recordClickMutation = useMutation(
    trpc.recordClick.mutationOptions()
  );

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const newBudget = DEFAULT_BUDGETS[newCategory];
    if (newBudget) {
      setBudget(newBudget);
    }
  };

  const handleGenerate = async () => {
    // Budget validation
    const MINIMUM_BUDGET = 30000; // ₹30,000 - absolute minimum for a functional PC
    const LOW_BUDGET_THRESHOLD = 45000; // ₹45,000 - threshold for low budget warning

    if (budget < MINIMUM_BUDGET) {
      toast.error(
        `Budget too low! Please increase your budget to at least ₹${MINIMUM_BUDGET.toLocaleString("en-IN")} for a functional PC build.`,
        {
          duration: 5000,
          icon: "⚠️",
        }
      );
      return; // Prevent generation
    }

    if (budget < LOW_BUDGET_THRESHOLD) {
      toast(
        `Low budget detected. We'll try our best, but consider increasing to ₹${LOW_BUDGET_THRESHOLD.toLocaleString("en-IN")}+ for better component options.`,
        {
          duration: 4000,
          icon: "💡",
        }
      );
    }

    const promise = generateMutation.mutateAsync({
      category,
      budget,
    });

    toast.promise(promise, {
      loading: "AI is generating your perfect PC build and laptop recommendations...",
      success: "Build generated successfully!",
      error: "Failed to generate build. Please try again.",
    });

    try {
      const result = await promise;
      buildStore.setBuild(result);

      // Auto-save if user is logged in
      if (token) {
        try {
          const savedBuild = await saveUserBuildMutation.mutateAsync({
            authToken: token,
            category: result.category,
            budget: result.budget,
            parts: result.parts,
            laptops: result.laptops || [],
            monitors: result.monitors || [],
            headsets: result.headsets || [],
            miniPcs: result.miniPcs || [],
            totalCost: result.totalCost,
            compatibility: result.compatibility,
            compatibilityNotes: result.compatibilityNotes,
          });

          toast.success("Build auto-saved successfully!");

          // Navigate to the saved build page after a short delay
          setTimeout(() => {
            navigate({ to: `/build/${savedBuild.id}` });
          }, 1500);
        } catch (saveError) {
          console.error("Auto-save failed:", saveError);
          toast.error("Build generated but auto-save failed. You can try again later.");
        }
      } else {
        toast("Build generated! Log in to save it.", {
          icon: "💡",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePartClick = async (part: { asin: string; name: string; category: string; price: number; url?: string }) => {
    // Record the click
    try {
      await recordClickMutation.mutateAsync({
        targetType: "Part",
        targetId: part.asin,
        targetName: part.name,
        metadata: {
          category: part.category,
          price: part.price,
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }

    // Open the link
    window.open(getAmazonUrl(part), "_blank", "noopener,noreferrer");
  };

  const handleLaptopClick = async (laptop: { name: string; brand: string; processor: string; ram: string; gpu: string; price: number; url?: string }) => {
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

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const getAmazonUrl = (part: { asin: string; name: string; url?: string }) => {
    // ALWAYS use the search URL format with product name and affiliate tag
    const affiliateId = affiliateIdQuery.data?.amazonAffiliateId || "eknowledgetre-21";
    return `https://www.amazon.in/s?k=${encodeURIComponent(part.name)}&tag=${affiliateId}`;
  };

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
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 cursor-pointer transition hover:opacity-80"
            >
              <Cpu className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                pcforgeai
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ to: "/products" })}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Browse Components
              </button>
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

      {/* Banner Ad - PC Build Landing Top */}
      <section className="container mx-auto px-4 pt-8">
        <AdBanner locationKey="PC_BUILD_LANDING_TOP" className="mx-auto max-w-4xl" />
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Panel - Configuration */}
          <div>
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Configure Your Build
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 hover:bg-white/10"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-800">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Budget: <span className="text-blue-400 font-bold">{formatPrice(budget)}</span>
                  </label>
                  <input
                    type="range"
                    min="25000"
                    max="500000"
                    step="5000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}

                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-blue-500 hover:accent-blue-400"
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-400">
                    <span>₹25k</span>
                    <span>₹5L</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                      Generate Build
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Build Info */}
            {buildStore.parts.length > 0 && (
              <>
                <div className="mt-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
                  <h3 className="mb-4 text-xl font-bold text-white">Build Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-gray-400">Category:</span>
                      <span className="font-semibold text-white">{buildStore.category}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-gray-400">Budget:</span>
                      <span className="font-semibold text-white">
                        {formatPrice(buildStore.budget)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                      <span className="text-gray-300 font-medium">Total Cost:</span>
                      <span className="text-2xl font-bold text-blue-400">
                        {formatPrice(buildStore.totalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                      <span className="text-gray-400">Compatibility:</span>
                      <span className="flex items-center gap-2 font-semibold text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {buildStore.compatibility.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compatibility Notes Section */}
                {buildStore.compatibilityNotes && (
                  <div className="mt-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 shadow-2xl backdrop-blur-md border border-green-500/30">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="rounded-full bg-green-500/20 p-2">
                        <Info className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-green-400 mb-2">
                          Compatibility Analysis
                        </h4>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                          {buildStore.compatibilityNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel - Parts List and Recommended Laptops */}
          <div className="space-y-8">
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
              <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-2">
                <Cpu className="h-6 w-6 text-blue-400" />
                Components
              </h2>

              {buildStore.parts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-gray-500/10 p-6">
                    <AlertCircle className="h-16 w-16 text-gray-500" />
                  </div>
                  <p className="text-gray-400 max-w-sm">
                    No build generated yet. Configure your preferences and click
                    "Generate Build" to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {buildStore.parts.map((part, index) => (
                    <div
                      key={index}
                      className="group rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 backdrop-blur-sm transition hover:border-blue-400/50 hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase text-blue-400">
                            {part.category}
                          </div>
                          <div className="font-medium text-white mt-2 text-lg">{part.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white text-xl">
                            {formatPrice(part.price)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(part.specs).map(([key, value]) => (
                          <span
                            key={key}
                            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-gray-300 border border-white/10"
                          >
                            <span className="font-semibold">{key}:</span> {String(value)}
                          </span>
                        ))}
                      </div>

                      {part.asin !== "INTEGRATED" && part.asin !== "STOCK" && (
                        <button
                          onClick={() => handlePartClick(part)}
                          className="mt-4 flex items-center gap-2 text-sm text-blue-400 transition hover:text-blue-300 group-hover:gap-3"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View on Amazon
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Laptops Section */}
            {buildStore.laptops && buildStore.laptops.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 shadow-2xl backdrop-blur-md border border-purple-500/30">
                <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-2">
                  <Laptop className="h-6 w-6 text-purple-400" />
                  Recommended Laptops for Your PC
                </h2>
                <p className="mb-6 text-gray-300 text-sm">
                  Based on your PC build, here are some laptops with similar performance that you might consider:
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {buildStore.laptops.map((laptop, index) => (
                    <div
                      key={index}
                      className="group rounded-xl border border-purple-400/20 bg-gradient-to-br from-white/5 to-transparent p-5 backdrop-blur-sm transition hover:border-purple-400/50 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase text-purple-400 border border-purple-500/30">
                            {laptop.brand}
                          </div>
                          <div className="font-semibold text-white mt-2 text-base leading-tight">{laptop.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white text-lg">
                            {formatPrice(laptop.price)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">CPU:</span>
                          <span className="text-white font-medium">{laptop.processor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">RAM:</span>
                          <span className="text-white font-medium">{laptop.ram}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Storage:</span>
                          <span className="text-white font-medium">{laptop.storage}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">GPU:</span>
                          <span className="text-white font-medium">{laptop.gpu}</span>
                        </div>
                      </div>

                      {laptop.url && (
                        <button
                          onClick={() => handleLaptopClick(laptop)}
                          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/30 group-hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View on Amazon
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
