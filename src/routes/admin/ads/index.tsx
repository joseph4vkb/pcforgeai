import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { isTokenValid } from "~/utils/tokenValidation";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Filter,
  Monitor,
  Eye,
  EyeOff,
  BarChart,
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/ads/")({
  component: AdminAdsManagement,
});

const LOCATION_KEYS = [
  { value: "HOMEPAGE_TOP", label: "Homepage - Top" },
  { value: "PC_BUILD_LANDING_TOP", label: "PC Build Landing - Top" },
  { value: "PC_BUILD_SIDEBAR", label: "PC Build - Sidebar" },
  { value: "LAPTOP_BROWSE_TOP", label: "Laptop Browse - Top" },
  { value: "HEADSET_BROWSE_TOP", label: "Headset Browse - Top" },
  { value: "MINI_PC_BROWSE_TOP", label: "Mini PC Browse - Top" },
  { value: "MONITOR_BROWSE_TOP", label: "Monitor Browse - Top" },
];

function AdminAdsManagement() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { token, logout } = useAuthStore();
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [confirmingAdDelete, setConfirmingAdDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!token || !isTokenValid(token)) {
      if (token) {
        // Token exists but is invalid/expired, clear it
        logout();
      }
      navigate({ to: "/admin/login" });
    }
  }, [token, logout, navigate]);

  const adsQuery = useQuery(
    trpc.listBannerAds.queryOptions(
      {
        authToken: token || "",
        locationKey: locationFilter || undefined,
        isActive: activeFilter === "all" ? undefined : activeFilter === "active",
      },
      { enabled: !!token }
    )
  );

  const deleteMutation = useMutation(trpc.deleteBannerAd.mutationOptions());

  const handleDelete = (adId: number, name: string) => {
    setConfirmingAdDelete(adId);
  };

  const executeDeleteAd = async (adId: number) => {
    try {
      await deleteMutation.mutateAsync({
        authToken: token || "",
        adId,
      });

      // Invalidate both the admin list and the frontend active banners cache
      queryClient.invalidateQueries({ queryKey: trpc.listBannerAds.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.getActiveBanners.queryKey() });

      toast.success("Banner ad deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete banner ad");
    } finally {
      setConfirmingAdDelete(null);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: "/admin/dashboard" })}
                className="flex items-center gap-2 text-gray-400 transition hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Dashboard
              </button>
              <div className="flex items-center gap-2">
                <Monitor className="h-8 w-8 text-green-400" />
                <span className="text-2xl font-bold text-white">
                  Banner Ad Management
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate({ to: "/admin/ads/create" })}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-green-500/50 transition hover:shadow-xl hover:shadow-green-500/60"
            >
              <Plus className="h-5 w-5" />
              Create New Ad
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
            >
              <option value="" className="bg-slate-800">
                All Locations
              </option>
              {LOCATION_KEYS.map((loc) => (
                <option key={loc.value} value={loc.value} className="bg-slate-800">
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
          >
            <option value="all" className="bg-slate-800">
              All Status
            </option>
            <option value="active" className="bg-slate-800">
              Active Only
            </option>
            <option value="inactive" className="bg-slate-800">
              Inactive Only
            </option>
          </select>
        </div>

        {/* Banner Ads List */}
        {adsQuery.isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          </div>
        )}

        {adsQuery.data && adsQuery.data.length > 0 && (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Schedule
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Clicks
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {adsQuery.data.map((ad) => {
                      const locationLabel =
                        LOCATION_KEYS.find((l) => l.value === ad.locationKey)
                          ?.label || ad.locationKey;

                      return (
                        <tr
                          key={ad.id}
                          className="transition hover:bg-white/5"
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm font-medium text-white">
                              {ad.name}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-300">
                              {locationLabel}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                ad.isActive
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                              }`}
                            >
                              {ad.isActive ? (
                                <>
                                  <Eye className="h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                            <div className="flex flex-col gap-1">
                              <span>
                                Start: {formatDate(ad.startDate)}
                              </span>
                              <span>
                                End: {formatDate(ad.endDate)}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-300">
                              {ad.priority}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <BarChart className="h-4 w-4 text-purple-400" />
                              {ad.clickCount}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  navigate({
                                    to: "/admin/ads/$adId/edit",
                                    params: { adId: ad.id.toString() },
                                  })
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 transition hover:bg-blue-500/30"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {confirmingAdDelete === ad.id ? (
                                <div className="flex items-center gap-2 rounded-lg bg-black/40 p-1 border border-white/20 animate-in fade-in zoom-in duration-200">
                                  <button
                                    onClick={() => executeDeleteAd(ad.id)}
                                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700"
                                  >
                                    YES
                                  </button>
                                  <button
                                    onClick={() => setConfirmingAdDelete(null)}
                                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-gray-300 transition hover:bg-white/20"
                                  >
                                    NO
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleDelete(ad.id, ad.name)}
                                  disabled={deleteMutation.isPending}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adsQuery.data && adsQuery.data.length === 0 && (
          <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md">
            <Monitor className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">
              No banner ads found
            </h3>
            <p className="mb-6 text-gray-400">
              {locationFilter || activeFilter !== "all"
                ? "No ads match your filters. Try adjusting your search."
                : "Start monetizing your platform by creating your first banner ad!"}
            </p>
            <button
              onClick={() => navigate({ to: "/admin/ads/create" })}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-green-500/50 transition hover:shadow-xl hover:shadow-green-500/60"
            >
              <Plus className="h-5 w-5" />
              Create New Ad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
