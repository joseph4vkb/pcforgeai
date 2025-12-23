import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { 
  Cpu, 
  ArrowLeft, 
  ExternalLink,
  CheckCircle2,
  ShoppingCart,
  Share2,
  GitCompare,
  User,
  Info,
  Laptop,
  Monitor,
  Headphones,
  Box
} from "lucide-react";
import toast from "react-hot-toast";
import { useBuildStore } from "~/stores/useBuildStore";
import { useAuthStore } from "~/stores/useAuthStore";
import { AssemblyInstructions } from "~/components/AssemblyInstructions";
import { InteractivePCView } from "~/components/InteractivePCView";

export const Route = createFileRoute("/build/$id")({
  component: BuildDetailsPage,
});

function BuildDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const buildStore = useBuildStore();
  const { token, email, role } = useAuthStore();

  const buildQuery = useQuery(
    trpc.getBuildById.queryOptions({ buildId: Number(id) })
  );

  const affiliateIdQuery = useQuery(
    trpc.getAmazonAffiliateId.queryOptions()
  );

  const recordClickMutation = useMutation(
    trpc.recordClick.mutationOptions()
  );

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const getAmazonUrl = (part: { asin: string; name: string; url?: string }) => {
    // ALWAYS use the search URL format with product name and affiliate tag
    const affiliateId = affiliateIdQuery.data?.amazonAffiliateId || "eknowledgetre-21";
    return `https://www.amazon.in/s?k=${encodeURIComponent(part.name)}&tag=${affiliateId}`;
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
          buildId: Number(id),
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
          buildId: Number(id),
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
    
    // Open the link
    window.open(laptop.url, "_blank", "noopener,noreferrer");
  };

  const handleMonitorClick = async (monitor: { name: string; brand: string; resolution: string; size: string; refreshRate: string; price: number; url?: string }) => {
    if (!monitor.url) return;
    
    // Record the click
    try {
      await recordClickMutation.mutateAsync({
        targetType: "Monitor",
        targetId: monitor.url,
        targetName: monitor.name,
        metadata: {
          brand: monitor.brand,
          resolution: monitor.resolution,
          size: monitor.size,
          refreshRate: monitor.refreshRate,
          price: monitor.price,
          buildId: Number(id),
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
    
    // Open the link
    window.open(monitor.url, "_blank", "noopener,noreferrer");
  };

  const handleHeadsetClick = async (headset: { name: string; brand: string; type: string; connectivity: string; price: number; url?: string }) => {
    if (!headset.url) return;
    
    // Record the click
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
          buildId: Number(id),
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
    
    // Open the link
    window.open(headset.url, "_blank", "noopener,noreferrer");
  };

  const handleMiniPcClick = async (miniPc: { name: string; brand: string; processor: string; ram: string; storage: string; price: number; url?: string }) => {
    if (!miniPc.url) return;
    
    // Record the click
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
          buildId: Number(id),
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
    
    // Open the link
    window.open(miniPc.url, "_blank", "noopener,noreferrer");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleAddToCompare = () => {
    if (buildQuery.data) {
      buildStore.addToComparison(buildQuery.data);
      toast.success("Added to comparison!");
    }
  };

  const handleGoToCompare = () => {
    navigate({ to: "/compare" });
  };

  if (buildQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500 mx-auto"></div>
          <p className="text-white">Loading build...</p>
        </div>
      </div>
    );
  }

  if (buildQuery.error || !buildQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <p className="text-white">Build not found</p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-4 text-blue-400 hover:text-blue-300"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const build = buildQuery.data;
  const parts = build.parts as Array<{
    category: string;
    name: string;
    asin: string;
    price: number;
    specs: Record<string, any>;
    url?: string;
  }>;

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
              {buildStore.comparisonBuilds.length > 0 && (
                <button
                  onClick={handleGoToCompare}
                  className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
                >
                  <GitCompare className="h-4 w-4" />
                  Compare ({buildStore.comparisonBuilds.length})
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Build Header */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1">
              <div className="mb-3 inline-block rounded-full bg-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-300 border border-blue-500/30">
                {build.category}
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">
                {build.category} PC Build
              </h1>
              <p className="text-gray-400 text-lg">
                Budget: {formatPrice(build.budget)}
              </p>
              <button
                onClick={handleAddToCompare}
                className="mt-4 flex items-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 transition hover:bg-purple-500/30 border border-purple-500/30"
              >
                <GitCompare className="h-4 w-4" />
                Add to Compare
              </button>
            </div>
            <div className="text-right">
              <div className="mb-2 text-sm text-gray-400">Total Cost</div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                {formatPrice(build.totalCost)}
              </div>
              <div className="flex items-center justify-end gap-2 rounded-lg bg-green-500/20 px-4 py-2 border border-green-500/30">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="font-semibold text-green-400">
                  {build.compatibility.toFixed(1)}% Compatible
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility Notes Section */}
        {build.compatibilityNotes && (
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 shadow-2xl backdrop-blur-md border border-green-500/30">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-500/20 p-2">
                <Info className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-400 mb-2">
                  Compatibility Analysis
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {build.compatibilityNotes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Components Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {parts.map((part, index) => (
            <div
              key={index}
              className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 shadow-lg backdrop-blur-sm transition hover:border-blue-400/50 hover:bg-white/10 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400 border border-blue-500/30">
                    {part.category}
                  </div>
                  <h3 className="text-xl font-semibold text-white leading-tight">
                    {part.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(part.price)}
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(part.specs).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-sm border border-white/10"
                  >
                    <span className="text-gray-400 font-medium">{key}:</span>{" "}
                    <span className="text-white font-semibold">{String(value)}</span>
                  </div>
                ))}
              </div>

              {/* Buy Button */}
              {part.asin !== "INTEGRATED" && part.asin !== "STOCK" && (
                <button
                  onClick={() => handlePartClick(part)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 font-semibold text-white transition hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/30 group-hover:scale-[1.02] active:scale-[0.98] w-full"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Buy on Amazon
                </button>
              )}

              {(part.asin === "INTEGRATED" || part.asin === "STOCK") && (
                <div className="rounded-lg bg-white/5 px-4 py-3 text-center text-sm text-gray-400 border border-white/10">
                  Included with other components
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recommended Laptops Section */}
        {build.laptops && Array.isArray(build.laptops) && build.laptops.length > 0 && (
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 shadow-2xl backdrop-blur-md border border-purple-500/30">
            <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-2">
              <Laptop className="h-6 w-6 text-purple-400" />
              Recommended Laptops for This Build
            </h2>
            <p className="mb-6 text-gray-300">
              Based on this PC build, here are some laptops with similar performance:
            </p>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(build.laptops as Array<{
                name: string;
                brand: string;
                processor: string;
                ram: string;
                storage: string;
                gpu: string;
                price: number;
                url?: string;
              }>).map((laptop, index) => (
                <div
                  key={index}
                  className="group rounded-xl border border-purple-400/20 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm transition hover:border-purple-400/50 hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase text-purple-400 border border-purple-500/30">
                        {laptop.brand}
                      </div>
                      <h3 className="font-semibold text-white text-lg leading-tight">{laptop.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-xl">
                        {formatPrice(laptop.price)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[60px]">CPU:</span>
                      <span className="text-white font-medium">{laptop.processor}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[60px]">RAM:</span>
                      <span className="text-white font-medium">{laptop.ram}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[60px]">Storage:</span>
                      <span className="text-white font-medium">{laptop.storage}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[60px]">GPU:</span>
                      <span className="text-white font-medium">{laptop.gpu}</span>
                    </div>
                  </div>

                  {laptop.url && (
                    <button
                      onClick={() => handleLaptopClick(laptop)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 font-semibold text-white transition hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/30 group-hover:scale-[1.02] active:scale-[0.98] w-full"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      View on Amazon
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Monitors Section */}
        {build.monitors && Array.isArray(build.monitors) && build.monitors.length > 0 && (
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-8 shadow-2xl backdrop-blur-md border border-blue-500/30">
            <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-2">
              <Monitor className="h-6 w-6 text-blue-400" />
              Recommended Monitors for This Build
            </h2>
            <p className="mb-6 text-gray-300">
              Based on this PC build, here are some monitors that would pair perfectly:
            </p>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(build.monitors as Array<{
                name: string;
                brand: string;
                resolution: string;
                size: string;
                refreshRate: string;
                panelType: string;
                price: number;
                url?: string;
              }>).map((monitor, index) => (
                <div
                  key={index}
                  className="group rounded-xl border border-blue-400/20 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm transition hover:border-blue-400/50 hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase text-blue-400 border border-blue-500/30">
                        {monitor.brand}
                      </div>
                      <h3 className="font-semibold text-white text-lg leading-tight">{monitor.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-xl">
                        {formatPrice(monitor.price)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[80px]">Resolution:</span>
                      <span className="text-white font-medium">{monitor.resolution}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[80px]">Size:</span>
                      <span className="text-white font-medium">{monitor.size}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[80px]">Refresh Rate:</span>
                      <span className="text-white font-medium">{monitor.refreshRate}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[80px]">Panel Type:</span>
                      <span className="text-white font-medium">{monitor.panelType}</span>
                    </div>
                  </div>

                  {monitor.url && (
                    <button
                      onClick={() => handleMonitorClick(monitor)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-semibold text-white transition hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-blue-500/30 group-hover:scale-[1.02] active:scale-[0.98] w-full"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      View on Amazon
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Headsets Section */}
        {build.headsets && Array.isArray(build.headsets) && build.headsets.length > 0 && (
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 p-8 shadow-2xl backdrop-blur-md border border-pink-500/30">
            <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-2">
              <Headphones className="h-6 w-6 text-pink-400" />
              Recommended Headsets for This Build
            </h2>
            <p className="mb-6 text-gray-300">
              Complete your setup with these high-quality headsets:
            </p>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(build.headsets as Array<{
                name: string;
                brand: string;
                type: string;
                connectivity: string;
                features: string;
                price: number;
                url?: string;
              }>).map((headset, index) => (
                <div
                  key={index}
                  className="group rounded-xl border border-pink-400/20 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm transition hover:border-pink-400/50 hover:bg-white/10 hover:shadow-lg hover:shadow-pink-500/10"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 inline-block rounded-full bg-pink-500/20 px-3 py-1 text-xs font-semibold uppercase text-pink-400 border border-pink-500/30">
                        {headset.brand}
                      </div>
                      <h3 className="font-semibold text-white text-lg leading-tight">{headset.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-xl">
                        {formatPrice(headset.price)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[90px]">Type:</span>
                      <span className="text-white font-medium">{headset.type}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[90px]">Connectivity:</span>
                      <span className="text-white font-medium">{headset.connectivity}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[90px]">Features:</span>
                      <span className="text-white font-medium">{headset.features}</span>
                    </div>
                  </div>

                  {headset.url && (
                    <button
                      onClick={() => handleHeadsetClick(headset)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 font-semibold text-white transition hover:from-pink-600 hover:to-rose-600 hover:shadow-lg hover:shadow-pink-500/30 group-hover:scale-[1.02] active:scale-[0.98] w-full"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      View on Amazon
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Mini PCs Section */}
        {build.miniPcs && Array.isArray(build.miniPcs) && build.miniPcs.length > 0 && (
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-8 shadow-2xl backdrop-blur-md border border-green-500/30">
            <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-2">
              <Box className="h-6 w-6 text-green-400" />
              Recommended Mini PCs with Similar Performance
            </h2>
            <p className="mb-6 text-gray-300">
              Looking for a compact alternative? These Mini PCs offer similar performance:
            </p>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(build.miniPcs as Array<{
                name: string;
                brand: string;
                processor: string;
                ram: string;
                storage: string;
                gpu: string;
                price: number;
                url?: string;
              }>).map((miniPc, index) => (
                <div
                  key={index}
                  className="group rounded-xl border border-green-400/20 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm transition hover:border-green-400/50 hover:bg-white/10 hover:shadow-lg hover:shadow-green-500/10"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold uppercase text-green-400 border border-green-500/30">
                        {miniPc.brand}
                      </div>
                      <h3 className="font-semibold text-white text-lg leading-tight">{miniPc.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-xl">
                        {formatPrice(miniPc.price)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[60px]">CPU:</span>
                      <span className="text-white font-medium">{miniPc.processor}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[60px]">RAM:</span>
                      <span className="text-white font-medium">{miniPc.ram}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[60px]">Storage:</span>
                      <span className="text-white font-medium">{miniPc.storage}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 min-w-[60px]">GPU:</span>
                      <span className="text-white font-medium">{miniPc.gpu}</span>
                    </div>
                  </div>

                  {miniPc.url && (
                    <button
                      onClick={() => handleMiniPcClick(miniPc)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 font-semibold text-white transition hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 group-hover:scale-[1.02] active:scale-[0.98] w-full"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      View on Amazon
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive PC Visualization */}
        <div className="mt-12">
          <InteractivePCView parts={parts} />
        </div>

        {/* Assembly Instructions */}
        <div className="mt-12">
          <AssemblyInstructions />
        </div>

        {/* Buy All Button */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-center shadow-2xl">
          <h2 className="mb-2 text-3xl font-bold text-white">
            Ready to build?
          </h2>
          <p className="mb-6 text-blue-100 text-lg">
            Get all components with our affiliate links and start building your dream PC!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                parts.forEach((part) => {
                  if (part.asin !== "INTEGRATED" && part.asin !== "STOCK") {
                    handlePartClick(part);
                  }
                });
              }}
              className="rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 transition hover:bg-gray-100 hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Open All Amazon Links
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
