import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTRPC, useTRPCClient } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { isTokenValid } from "~/utils/tokenValidation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  AlertCircle,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/ads/$adId/edit")({
  component: EditBannerAd,
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

interface BannerAdForm {
  name: string;
  locationKey: string;
  imageUrl: string;
  destinationUrl: string;
  htmlContent: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  priority: number;
}

// Helper to convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
const formatDateTimeForInput = (isoString: string | Date | null) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Get local datetime in YYYY-MM-DDTHH:MM format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function EditBannerAd() {
  const navigate = useNavigate();
  const { adId } = Route.useParams();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { token, logout } = useAuthStore();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [useHtmlContent, setUseHtmlContent] = useState(false);

  useEffect(() => {
    if (!token || !isTokenValid(token)) {
      if (token) {
        logout();
      }
      navigate({ to: "/admin/login" });
    }
  }, [token, logout, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BannerAdForm>({
    defaultValues: {
      isActive: false,
      priority: 50,
    },
  });

  // Fetch the existing banner ad data
  const adQuery = useQuery(
    trpc.getBannerAdById.queryOptions(
      {
        authToken: token || "",
        adId: parseInt(adId),
      },
      { enabled: !!token }
    )
  );

  // Pre-populate form when data is loaded
  useEffect(() => {
    if (adQuery.data) {
      const ad = adQuery.data;
      reset({
        name: ad.name,
        locationKey: ad.locationKey,
        imageUrl: ad.imageUrl || "",
        destinationUrl: ad.destinationUrl || "",
        htmlContent: ad.htmlContent || "",
        isActive: ad.isActive,
        startDate: formatDateTimeForInput(ad.startDate),
        endDate: formatDateTimeForInput(ad.endDate),
        priority: ad.priority,
      });

      // Set the ad type based on whether htmlContent exists
      setUseHtmlContent(!!ad.htmlContent);
    }
  }, [adQuery.data, reset]);

  const updateMutation = useMutation(trpc.updateBannerAd.mutationOptions());

  const onSubmit = async (data: BannerAdForm) => {
    try {
      await updateMutation.mutateAsync({
        authToken: token || "",
        adId: parseInt(adId),
        name: data.name,
        imageUrl: useHtmlContent ? null : (data.imageUrl || null),
        destinationUrl: useHtmlContent ? null : (data.destinationUrl || null),
        locationKey: data.locationKey,
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        priority: data.priority,
        htmlContent: useHtmlContent ? (data.htmlContent || null) : null,
      });

      // Invalidate the active banners cache so frontend updates immediately
      queryClient.invalidateQueries({ queryKey: trpc.getActiveBanners.queryKey() });

      toast.success("Banner ad updated successfully!");
      navigate({ to: "/admin/ads" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update banner ad");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      if (!data.success || !data.imageUrl) {
        throw new Error("Invalid response from server");
      }

      setValue("imageUrl", data.imageUrl);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  if (!token) return null;

  if (adQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          <p className="text-white text-lg">Loading banner ad...</p>
        </div>
      </div>
    );
  }

  if (adQuery.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white text-center mb-2">
            Error Loading Ad
          </h2>
          <p className="text-red-300 text-center mb-6">
            {adQuery.error.message || "Failed to load banner ad"}
          </p>
          <button
            onClick={() => navigate({ to: "/admin/ads" })}
            className="w-full rounded-lg bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
          >
            Back to Ads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: "/admin/ads" })}
              className="flex items-center gap-2 text-gray-400 transition hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Ads
            </button>
            <span className="text-2xl font-bold text-white">
              Edit Banner Ad
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white/10 p-8 backdrop-blur-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Ad Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register("name", {
                  required: "Ad name is required",
                  maxLength: {
                    value: 100,
                    message: "Name must be 100 characters or less",
                  },
                })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                placeholder="e.g., Amazon GPU Sale - Homepage Top"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Internal name for identifying this ad (not shown to users)
              </p>
            </div>

            {/* Location Key */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Display Location <span className="text-red-400">*</span>
              </label>
              <select
                {...register("locationKey", {
                  required: "Location is required",
                })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
              >
                <option value="" className="bg-slate-800">
                  Select a location...
                </option>
                {LOCATION_KEYS.map((loc) => (
                  <option key={loc.value} value={loc.value} className="bg-slate-800">
                    {loc.label}
                  </option>
                ))}
              </select>
              {errors.locationKey && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.locationKey.message}
                </p>
              )}
            </div>

            {/* Ad Type Toggle */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-2">
                    Choose Ad Type
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useHtmlContent}
                        onChange={() => setUseHtmlContent(false)}
                        className="h-4 w-4 text-green-500"
                      />
                      <span className="text-sm text-gray-300">
                        Image Banner (Upload image + destination URL)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={useHtmlContent}
                        onChange={() => setUseHtmlContent(true)}
                        className="h-4 w-4 text-green-500"
                      />
                      <span className="text-sm text-gray-300">
                        HTML/Script (Ad network tags)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Banner Fields */}
            {!useHtmlContent && (
              <>
                {/* Image Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Ad Image <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="hidden"
                    {...register("imageUrl", {
                      validate: (value) => {
                        if (!useHtmlContent && !value) {
                          return "Please upload an ad image";
                        }
                        return true;
                      },
                    })}
                  />
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white file:mr-4 file:rounded file:border-0 file:bg-green-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-400 hover:file:bg-green-500/30 disabled:opacity-50"
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading image...
                      </div>
                    )}
                    {watch("imageUrl") && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                        <p className="text-sm text-green-400 mb-2">
                          Current image:
                        </p>
                        <img
                          src={watch("imageUrl")}
                          alt="Ad preview"
                          className="max-h-32 rounded border border-white/20"
                        />
                      </div>
                    )}
                    {errors.imageUrl && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.imageUrl.message}
                      </p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Upload a banner image (max 5MB). Recommended sizes: 728x90, 300x250, 970x250
                  </p>
                </div>

                {/* Destination URL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Destination URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    {...register("destinationUrl", {
                      required: !useHtmlContent ? "Destination URL is required" : false,
                    })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    placeholder="https://www.amazon.in/..."
                  />
                  {errors.destinationUrl && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.destinationUrl.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Where users will be redirected when clicking the ad (include UTM parameters for tracking)
                  </p>
                </div>
              </>
            )}

            {/* HTML Content */}
            {useHtmlContent && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  HTML/Script Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  {...register("htmlContent", {
                    required: useHtmlContent ? "HTML content is required" : false,
                  })}
                  rows={8}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                  placeholder="<script>...</script> or <div>...</div>"
                />
                {errors.htmlContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.htmlContent.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Paste ad network tags (e.g., Google AdSense, Media.net) or custom HTML
                </p>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Priority: {watch("priority")}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                {...register("priority", { valueAsNumber: true })}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-400">
                Higher priority ads appear more frequently when multiple ads target the same location
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="h-5 w-5 rounded border-white/20 bg-white/5 text-green-500 focus:ring-2 focus:ring-green-400/50"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                Set as Active (ad will be displayed immediately if within date range)
              </label>
            </div>

            {/* Schedule */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Start Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  {...register("startDate")}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Ad will only display after this date/time
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  {...register("endDate")}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Ad will automatically hide after this date/time
                </p>
              </div>
            </div>

            {/* Warning */}
            {!watch("startDate") && !watch("endDate") && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-400">
                      No schedule set
                    </p>
                    <p className="mt-1 text-sm text-yellow-300/80">
                      This ad will run indefinitely until manually deactivated. Consider setting an end date.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={updateMutation.isPending || uploadingImage}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-green-500/50 transition hover:shadow-xl hover:shadow-green-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Update Banner Ad
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
