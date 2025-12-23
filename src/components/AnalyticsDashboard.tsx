import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { 
  TrendingUp, 
  Laptop, 
  Cpu, 
  MousePointerClick,
  BarChart3,
  Loader2,
  Package
} from "lucide-react";

interface AnalyticsDashboardProps {
  authToken: string;
}

export function AnalyticsDashboard({ authToken }: AnalyticsDashboardProps) {
  const trpc = useTRPC();

  const buildAnalyticsQuery = useQuery(
    trpc.getBuildAnalytics.queryOptions({ authToken })
  );

  const laptopAnalyticsQuery = useQuery(
    trpc.getLaptopAnalytics.queryOptions({ authToken })
  );

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  if (buildAnalyticsQuery.isLoading || laptopAnalyticsQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const buildAnalytics = buildAnalyticsQuery.data;
  const laptopAnalytics = laptopAnalyticsQuery.data;

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-6 backdrop-blur-md border border-blue-500/30">
          <div className="mb-2 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Total Builds</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {buildAnalytics?.totalBuilds || 0}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 p-6 backdrop-blur-md border border-green-500/30">
          <div className="mb-2 flex items-center gap-2">
            <MousePointerClick className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-green-300">Build Clicks</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {buildAnalytics?.totalClicks || 0}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-6 backdrop-blur-md border border-purple-500/30">
          <div className="mb-2 flex items-center gap-2">
            <Laptop className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Laptop Recommendations</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {laptopAnalytics?.totalLaptops || 0}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-6 backdrop-blur-md border border-orange-500/30">
          <div className="mb-2 flex items-center gap-2">
            <MousePointerClick className="h-5 w-5 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">Laptop Clicks</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {laptopAnalytics?.totalClicks || 0}
          </div>
        </div>
      </div>

      {/* PC Build Analytics */}
      <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md border border-white/20">
        <h3 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          PC Build Analytics
        </h3>

        {/* Category Distribution */}
        {buildAnalytics?.categoryDistribution && buildAnalytics.categoryDistribution.length > 0 && (
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-white">Build Category Distribution</h4>
            <div className="space-y-3">
              {buildAnalytics.categoryDistribution.map((cat) => (
                <div key={cat.category} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-300">{cat.category}</div>
                  <div className="flex-1">
                    <div className="h-8 rounded-lg bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                        style={{
                          width: `${(cat.count / (buildAnalytics.totalBuilds || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-semibold text-white">
                    {cat.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Builds */}
        {buildAnalytics?.popularBuilds && buildAnalytics.popularBuilds.length > 0 && (
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-white">Most Clicked Builds</h4>
            <div className="space-y-3">
              {buildAnalytics.popularBuilds.slice(0, 5).map((build: any) => (
                <div
                  key={build.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-4 border border-white/10"
                >
                  <div className="flex-1">
                    <div className="mb-1 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                      {build.category}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Budget: {formatPrice(build.budget)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {formatPrice(build.totalCost)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {build.clicks} clicks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Components by Category */}
        {buildAnalytics?.topComponentsByCategory && Object.keys(buildAnalytics.topComponentsByCategory).length > 0 && (
          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Most Clicked Components</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(buildAnalytics.topComponentsByCategory).map(([category, components]: [string, any]) => (
                <div key={category} className="rounded-lg bg-white/5 p-4 border border-white/10">
                  <h5 className="mb-3 font-semibold text-blue-400">{category}</h5>
                  <div className="space-y-2">
                    {components.slice(0, 3).map((component: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="flex-1 text-gray-300 line-clamp-1">
                          {component.name}
                        </span>
                        <span className="ml-2 text-white font-medium">
                          {component.clicks}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Laptop Analytics */}
      <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md border border-white/20">
        <h3 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
          <Laptop className="h-6 w-6 text-purple-400" />
          Laptop Analytics
        </h3>

        {/* Popular Laptops */}
        {laptopAnalytics?.popularLaptops && laptopAnalytics.popularLaptops.length > 0 && (
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-white">Most Clicked Laptops</h4>
            <div className="space-y-3">
              {laptopAnalytics.popularLaptops.slice(0, 10).map((laptop: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-4 border border-white/10"
                >
                  <div className="flex-1">
                    <div className="mb-1 text-sm font-medium text-white line-clamp-1">
                      {laptop.name}
                    </div>
                    {laptop.metadata && (
                      <div className="text-xs text-gray-400">
                        {laptop.metadata.brand && `${laptop.metadata.brand} • `}
                        {laptop.metadata.processor}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-bold text-white">
                      {laptop.clicks} clicks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Brands */}
        {laptopAnalytics?.topBrands && laptopAnalytics.topBrands.length > 0 && (
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-white">Top Laptop Brands</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {laptopAnalytics.topBrands.map((brand: any) => (
                <div
                  key={brand.brand}
                  className="rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 border border-purple-500/30"
                >
                  <div className="text-lg font-bold text-white">{brand.brand}</div>
                  <div className="text-sm text-gray-400">{brand.clicks} clicks</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Processors */}
        {laptopAnalytics?.topProcessors && laptopAnalytics.topProcessors.length > 0 && (
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-white">Most Popular Processors</h4>
            <div className="space-y-2">
              {laptopAnalytics.topProcessors.slice(0, 5).map((proc: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10"
                >
                  <span className="text-sm text-gray-300 line-clamp-1">{proc.processor}</span>
                  <span className="ml-4 text-sm font-semibold text-white">{proc.clicks}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RAM and GPU Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top RAM Configs */}
          {laptopAnalytics?.topRamConfigs && laptopAnalytics.topRamConfigs.length > 0 && (
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">Popular RAM Configurations</h4>
              <div className="space-y-2">
                {laptopAnalytics.topRamConfigs.map((ram: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10"
                  >
                    <span className="text-sm text-gray-300">{ram.ram}</span>
                    <span className="text-sm font-semibold text-white">{ram.clicks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top GPUs */}
          {laptopAnalytics?.topGpus && laptopAnalytics.topGpus.length > 0 && (
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">Popular GPUs</h4>
              <div className="space-y-2">
                {laptopAnalytics.topGpus.slice(0, 5).map((gpu: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10"
                  >
                    <span className="text-sm text-gray-300 line-clamp-1">{gpu.gpu}</span>
                    <span className="ml-2 text-sm font-semibold text-white">{gpu.clicks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
