import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import {
  Cpu,
  LogOut,
  Settings,
  Trash2,
  Star,
  StarOff,
  Loader2,
  Save,
  Package,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  FileText,
  Monitor,
} from "lucide-react";
import toast from "react-hot-toast";
import { AnalyticsDashboard } from "~/components/AnalyticsDashboard";
import { UserManagement } from "~/components/UserManagement";
import { isTokenValid } from "~/utils/tokenValidation";

export const Route = createFileRoute("/admin/dashboard/")({
  component: AdminDashboard,
});

interface ConfigForm {
  openrouterApiKey: string;
  openrouterModel: string;
  amazonAffiliateId: string;
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { token, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"builds" | "analytics" | "users" | "content" | "settings">("builds");
  const [productCount, setProductCount] = useState(100);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmingBuildDelete, setConfirmingBuildDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!token || !isTokenValid(token)) {
      if (token) {
        // Token exists but is invalid/expired, clear it
        logout();
      }
      navigate({ to: "/login" });
    }
  }, [token, logout, navigate]);

  const buildsQuery = useQuery(
    trpc.getAllBuilds.queryOptions(
      { authToken: token || "" },
      { enabled: !!token }
    )
  );

  const configQuery = useQuery(
    trpc.getAdminConfig.queryOptions(
      { authToken: token || "" },
      { enabled: !!token }
    )
  );

  const updateBuildMutation = useMutation(
    trpc.updateBuild.mutationOptions()
  );

  const deleteBuildMutation = useMutation(
    trpc.deleteBuild.mutationOptions()
  );

  const updateConfigMutation = useMutation(
    trpc.updateAdminConfig.mutationOptions()
  );

  const generateProductCatalogMutation = useMutation(
    trpc.generateProductCatalog.mutationOptions()
  );

  const updatePasswordMutation = useMutation(
    trpc.updateAdminPassword.mutationOptions()
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfigForm>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>();

  useEffect(() => {
    if (configQuery.data) {
      reset({
        openrouterApiKey: configQuery.data.openrouterApiKey,
        openrouterModel: configQuery.data.openrouterModel,
        amazonAffiliateId: configQuery.data.amazonAffiliateId,
      });
    }
  }, [configQuery.data, reset]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
    toast.success("Logged out successfully");
  };

  const handleToggleFeatured = async (buildId: number, isFeatured: boolean) => {
    try {
      await updateBuildMutation.mutateAsync({
        authToken: token || "",
        buildId,
        isFeatured: !isFeatured,
      });
      queryClient.invalidateQueries({ queryKey: [["getAllBuilds"]] });
      toast.success(
        isFeatured ? "Build unfeatured" : "Build featured successfully"
      );
    } catch (error) {
      toast.error("Failed to update build");
    }
  };

  const handleDeleteBuild = async (buildId: number) => {
    setConfirmingBuildDelete(buildId);
  };

  const executeDeleteBuild = async (buildId: number) => {
    try {
      await deleteBuildMutation.mutateAsync({
        authToken: token || "",
        buildId,
      });
      queryClient.invalidateQueries({ queryKey: [["getAllBuilds"]] });
      toast.success("Build deleted successfully");
    } catch (error) {
      toast.error("Failed to delete build");
    } finally {
      setConfirmingBuildDelete(null);
    }
  };

  const onSubmitConfig = async (data: ConfigForm) => {
    const promise = updateConfigMutation.mutateAsync({
      authToken: token || "",
      ...data,
    });

    toast.promise(promise, {
      loading: "Updating configuration...",
      success: "Configuration updated successfully!",
      error: "Failed to update configuration",
    });

    try {
      await promise;
      queryClient.invalidateQueries({ queryKey: [["getAdminConfig"]] });
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    const promise = updatePasswordMutation.mutateAsync({
      authToken: token || "",
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });

    toast.promise(promise, {
      loading: "Updating password...",
      success: "Password updated successfully!",
      error: (err: any) => err.message || "Failed to update password",
    });

    try {
      await promise;
      resetPassword();
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateProductCatalog = async () => {
    const promise = generateProductCatalogMutation.mutateAsync({
      authToken: token || "",
      count: productCount,
    });

    toast.promise(promise, {
      loading: `Generating ${productCount} PC components using AI...`,
      success: (result) => `Successfully generated ${result.count} products!`,
      error: "Failed to generate product catalog",
    });

    try {
      await promise;
    } catch (error: any) {
      console.error("Generate product catalog error:", error);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${(price / 1000).toFixed(0)}k`;
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                Admin Dashboard
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 backdrop-blur-sm transition hover:bg-red-500/30"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8 flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <button
            onClick={() => setActiveTab("builds")}
            className={`flex-shrink-0 rounded-lg px-6 py-3 font-semibold transition ${
              activeTab === "builds"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Builds Management
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-6 py-3 font-semibold transition ${
              activeTab === "analytics"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-6 py-3 font-semibold transition ${
              activeTab === "users"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            <Users className="h-5 w-5" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-6 py-3 font-semibold transition ${
              activeTab === "content"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            <FileText className="h-5 w-5" />
            Content
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-6 py-3 font-semibold transition ${
              activeTab === "settings"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            <Settings className="h-5 w-5" />
            Settings
          </button>
        </div>

        {/* Builds Tab */}
        {activeTab === "builds" && (
          <div>
            <div className="mb-6 rounded-2xl bg-white/10 p-6 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">All Builds</h2>
              <p className="mt-2 text-gray-400">
                Manage and moderate PC builds. Toggle featured status or delete builds.
              </p>
            </div>

            {buildsQuery.isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            )}

            {buildsQuery.data && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {buildsQuery.data.map((build) => {
                  const parts = build.parts as Array<{
                    category: string;
                    name: string;
                  }>;
                  const cpuPart = parts.find((p) => p.category === "CPU");

                  return (
                    <div
                      key={build.id}
                      className="rounded-2xl bg-white/10 p-6 backdrop-blur-md"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <div className="mb-1 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                            {build.category}
                          </div>
                          <div className="mt-2 text-xl font-bold text-white">
                            {formatPrice(build.totalCost)}
                          </div>
                        </div>
                        {build.isFeatured && (
                          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>

                      {cpuPart && (
                        <p className="mb-4 text-sm text-gray-300">
                          {cpuPart.name}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleToggleFeatured(build.id, build.isFeatured)
                          }
                          disabled={updateBuildMutation.isPending}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                            build.isFeatured
                              ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          } disabled:opacity-50`}
                        >
                          {build.isFeatured ? (
                            <>
                              <StarOff className="h-4 w-4" />
                              Unfeature
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4" />
                              Feature
                            </>
                          )}
                        </button>
                        {confirmingBuildDelete === build.id ? (
                          <div className="flex items-center gap-2 rounded-lg bg-black/40 p-1 border border-white/20">
                            <button
                              onClick={() => executeDeleteBuild(build.id)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmingBuildDelete(null)}
                              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/20"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteBuild(build.id)}
                            disabled={deleteBuildMutation.isPending}
                            className="rounded-lg bg-red-500/20 px-4 py-2 text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {buildsQuery.data && buildsQuery.data.length === 0 && (
              <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md">
                <p className="text-gray-400">No builds found</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div>
            <div className="mb-6 rounded-2xl bg-white/10 p-6 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <p className="mt-2 text-gray-400">
                Comprehensive insights into PC builds, laptop recommendations, and user engagement.
              </p>
            </div>

            <AnalyticsDashboard authToken={token || ""} />
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <div>
            <div className="mb-6 rounded-2xl bg-white/10 p-6 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">User Management</h2>
              <p className="mt-2 text-gray-400">
                Manage registered users and admins. Promote users to admins or demote admins to users.
              </p>
            </div>

            <UserManagement authToken={token || ""} />
          </div>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <div>
            <div className="mb-6 rounded-2xl bg-white/10 p-6 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">Blog Management</h2>
              <p className="mt-2 text-gray-400">
                Generate AI-powered blog content and manage published articles.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div
                onClick={() => navigate({ to: "/admin/content/generate" })}
                className="cursor-pointer rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-8 backdrop-blur-md border border-purple-500/30 transition hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30"
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/30 border border-purple-500/50">
                  <Sparkles className="h-8 w-8 text-purple-300" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Generate Blog Content</h3>
                <p className="text-gray-300">
                  Use AI to create SEO-optimized blog articles from PC builds with automatic content generation.
                </p>
              </div>

              <div
                onClick={() => navigate({ to: "/admin/content" })}
                className="cursor-pointer rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-8 backdrop-blur-md border border-blue-500/30 transition hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30"
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/30 border border-blue-500/50">
                  <FileText className="h-8 w-8 text-blue-300" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Manage Blog Posts</h3>
                <p className="text-gray-300">
                  View, edit, publish, or delete existing blog posts. Manage drafts and published content.
                </p>
              </div>

              <div
                onClick={() => navigate({ to: "/admin/ads" })}
                className="cursor-pointer rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-8 backdrop-blur-md border border-green-500/30 transition hover:scale-105 hover:shadow-xl hover:shadow-green-500/30"
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/30 border border-green-500/50">
                  <Monitor className="h-8 w-8 text-green-300" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Banner Ad Management</h3>
                <p className="text-gray-300">
                  Create and manage banner advertisements for passive income. Track clicks and optimize ad placements across the platform.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <div className="mb-6 rounded-2xl bg-white/10 p-6 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white">
                Configuration Settings
              </h2>
              <p className="mt-2 text-gray-400">
                Update OpenRouter API credentials and Amazon affiliate settings.
              </p>
            </div>

            {configQuery.isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            )}

            {configQuery.data && (
              <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md">
                <form onSubmit={handleSubmit(onSubmitConfig)} className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      OpenRouter API Key
                    </label>
                    <input
                      type="password"
                      {...register("openrouterApiKey", {
                        required: "API Key is required",
                      })}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      placeholder="sk-or-v1-..."
                    />
                    {errors.openrouterApiKey && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.openrouterApiKey.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      OpenRouter Model
                    </label>
                    <input
                      type="text"
                      {...register("openrouterModel", {
                        required: "Model is required",
                      })}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      placeholder="anthropic/claude-3.5-sonnet"
                    />
                    {errors.openrouterModel && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.openrouterModel.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Amazon Affiliate ID
                    </label>
                    <input
                      type="text"
                      {...register("amazonAffiliateId", {
                        required: "Affiliate ID is required",
                      })}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      placeholder="eknowledgetre-21"
                    />
                    {errors.amazonAffiliateId && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.amazonAffiliateId.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      This ID will be used for all Amazon affiliate links throughout the platform.
                    </p>
                  </div>

                  <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                      <Package className="h-5 w-5 text-purple-400" />
                      Product Catalog
                    </h3>
                    <p className="mb-4 text-sm text-gray-400">
                      Generate a comprehensive catalog of PC components using AI. This will populate the Browse Products page with realistic product data including prices, specs, and Amazon links.
                    </p>

                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Number of Products to Generate
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={productCount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 1 && value <= 500) {
                            setProductCount(value);
                          }
                        }}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="100"
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        Choose between 1 and 500 products. Products will be distributed across all categories: CPU, GPU, Motherboard, RAM, Storage, PSU, Case, and Cooler.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateProductCatalog}
                      disabled={generateProductCatalogMutation.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generateProductCatalogMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Generating Products...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Generate Product Catalog ({productCount} items)
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                      <Mail className="h-5 w-5 text-blue-400" />
                      Email Configuration
                    </h3>
                    <p className="mb-4 text-sm text-gray-400">
                      Configure SMTP settings for sending emails from the platform.
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate({ to: "/admin/settings/email" })}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60"
                    >
                      <Mail className="h-5 w-5" />
                      Configure Email Settings
                    </button>
                  </div>

                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                      <Lock className="h-5 w-5 text-orange-400" />
                      Change Password
                    </h3>
                    <p className="mb-4 text-sm text-gray-400">
                      Update your admin account password. Make sure to use a strong password.
                    </p>

                    <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showOldPassword ? "text" : "password"}
                            {...registerPassword("oldPassword", {
                              required: "Current password is required",
                            })}
                            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 pr-12 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showOldPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.oldPassword && (
                          <p className="mt-1 text-sm text-red-400">
                            {passwordErrors.oldPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            {...registerPassword("newPassword", {
                              required: "New password is required",
                              minLength: {
                                value: 6,
                                message: "Password must be at least 6 characters",
                              },
                            })}
                            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 pr-12 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-sm text-red-400">
                            {passwordErrors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          {...registerPassword("confirmPassword", {
                            required: "Please confirm your new password",
                            validate: (value) =>
                              value === watchPassword("newPassword") ||
                              "Passwords do not match",
                          })}
                          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                          placeholder="Confirm new password"
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-400">
                            {passwordErrors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={updatePasswordMutation.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/50 transition hover:shadow-xl hover:shadow-orange-500/60 disabled:opacity-50"
                      >
                        {updatePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock className="h-5 w-5" />
                            Update Password
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  <button
                    type="submit"
                    disabled={updateConfigMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 disabled:opacity-50"
                  >
                    {updateConfigMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Configuration
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
