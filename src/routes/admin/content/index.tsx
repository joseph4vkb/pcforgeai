import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { Cpu, ArrowLeft, Plus, Edit, Trash2, Eye, Loader2, Filter, FileText, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { isTokenValid } from "~/utils/tokenValidation";

export const Route = createFileRoute("/admin/content/")({
  component: AdminContentManagement,
});

type PostAction = "delete" | "publish" | "unpublish";

function AdminContentManagement() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { token, logout } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [confirmingPost, setConfirmingPost] = useState<{
    slug: string;
    action: PostAction;
  } | null>(null);

  useEffect(() => {
    if (!token || !isTokenValid(token)) {
      if (token) {
        // Token exists but is invalid/expired, clear it
        logout();
      }
      navigate({ to: "/admin/login" });
    }
  }, [token, logout, navigate]);

  const blogsQuery = useQuery(
    trpc.getAdminBlogs.queryOptions(
      { authToken: token || "", status: statusFilter, limit: 20 },
      { enabled: !!token }
    )
  );

  const deleteBlogMutation = useMutation(
    trpc.deleteBlogPost.mutationOptions()
  );

  const updateBlogMutation = useMutation(
    trpc.updateBlogPost.mutationOptions()
  );

  const handleDelete = async (slug: string, title: string) => {
    console.log("handleDelete: confirming...");
    setConfirmingPost({ slug, action: "delete" });
  };

  const executeDelete = async (slug: string) => {
    try {
      console.log("handleDelete: executing mutation with slug:", slug);
      const result = await deleteBlogMutation.mutateAsync({
        authToken: token || "",
        slug,
      });
      console.log("handleDelete: mutation success, result:", result);

      console.log("handleDelete: invalidating queries...");
      await queryClient.invalidateQueries({ queryKey: [["getAdminBlogs"]] });
      await queryClient.refetchQueries({ queryKey: [["getAdminBlogs"]] });
      console.log("handleDelete: invalidation complete");

      toast.success("Blog post deleted successfully");
    } catch (error: any) {
      console.error("Delete blog error caught:", error);
      toast.error(error.message || "Failed to delete blog post");
    } finally {
      setConfirmingPost(null);
    }
  };

  const handlePublish = (slug: string, title: string) => {
    console.log("handlePublish: confirming...");
    setConfirmingPost({ slug, action: "publish" });
  };

  const executePublish = async (slug: string) => {
    try {
      console.log("handlePublish: executing mutation for slug:", slug);
      await updateBlogMutation.mutateAsync({
        authToken: token || "",
        slug,
        status: "published",
      });
      console.log("handlePublish: mutation success");

      await queryClient.invalidateQueries({ queryKey: [["getAdminBlogs"]] });
      await queryClient.refetchQueries({ queryKey: [["getAdminBlogs"]] });
      toast.success("Blog post published successfully");
    } catch (error: any) {
      console.error("Publish blog error caught:", error);
      toast.error(error.message || "Failed to publish blog post");
    } finally {
      setConfirmingPost(null);
    }
  };

  const handleUnpublish = (slug: string, title: string) => {
    console.log("handleUnpublish clicked for:", title, slug);
    setConfirmingPost({ slug, action: "unpublish" });
  };

  const executeUnpublish = async (slug: string) => {
    try {
      await updateBlogMutation.mutateAsync({
        authToken: token || "",
        slug,
        status: "draft",
      });
      await queryClient.invalidateQueries({ queryKey: [["getAdminBlogs"]] });
      await queryClient.refetchQueries({ queryKey: [["getAdminBlogs"]] });
      toast.success("Blog post reverted to draft successfully");
    } catch (error: any) {
      console.error("Revert blog failed:", error);
      toast.error(error.message || "Failed to revert blog post to draft");
    } finally {
      setConfirmingPost(null);
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
                <FileText className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">Blog Management</span>
              </div>
            </div>
            <button
              onClick={() => navigate({ to: "/admin/content/generate" })}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60"
            >
              <Plus className="h-5 w-5" />
              Generate New Blog
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "draft" | "published")}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            >
              <option value="all" className="bg-slate-800">All Posts</option>
              <option value="draft" className="bg-slate-800">Drafts</option>
              <option value="published" className="bg-slate-800">Published</option>
            </select>
          </div>
        </div>

        {/* Blog Posts List */}
        {blogsQuery.isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          </div>
        )}

        {blogsQuery.data && blogsQuery.data.posts.length > 0 && (
          <div className="space-y-4">
            {blogsQuery.data.posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl bg-white/10 p-6 backdrop-blur-md border border-white/10 hover:border-purple-400/50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">{post.title}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          post.status === "published"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="mb-3 text-sm text-gray-400 line-clamp-2">
                      {post.metaDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="rounded-full bg-purple-500/20 px-2 py-1 text-purple-300">
                        {post.category}
                      </span>
                      <span>{post.wordCount} words</span>
                      <span>{post.readingTime} min read</span>
                      {post.build && (
                        <span>Build: {post.build.category} (₹{(post.build.totalCost / 1000).toFixed(0)}k)</span>
                      )}
                      <span>Created: {formatDate(post.createdAt)}</span>
                      {post.publishedAt && (
                        <span>Published: {formatDate(post.publishedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {confirmingPost?.slug === post.slug ? (
                      <div className="flex items-center gap-2 rounded-lg bg-black/40 p-1.5 border border-white/20 animate-in fade-in zoom-in duration-200">
                        <span className="px-2 text-xs font-bold text-white uppercase">Confirm {confirmingPost.action}?</span>
                        <button
                          onClick={() => {
                            if (confirmingPost.action === "delete") executeDelete(post.slug);
                            else if (confirmingPost.action === "publish") executePublish(post.slug);
                            else if (confirmingPost.action === "unpublish") executeUnpublish(post.slug);
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 shadow-sm"
                        >
                          YES
                        </button>
                        <button
                          onClick={() => setConfirmingPost(null)}
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/20"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <>
                        {post.status === "draft" && (
                          <button
                            onClick={() => handlePublish(post.slug, post.title)}
                            disabled={updateBlogMutation.isPending}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-400 transition hover:bg-green-500/30 disabled:opacity-50"
                            title="Publish"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {post.status === "published" && (
                          <button
                            onClick={() => handleUnpublish(post.slug, post.title)}
                            disabled={updateBlogMutation.isPending}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 transition hover:bg-yellow-500/30 disabled:opacity-50"
                            title="Revert to Draft"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate({ to: `/admin/content/${post.slug}/edit` })}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 transition hover:bg-blue-500/30"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {post.status === "published" && (
                          <button
                            onClick={() => navigate({ to: `/blogs/${post.slug}` })}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-400 transition hover:bg-green-500/30"
                            title="View Public Page"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(post.slug, post.title)}
                          disabled={deleteBlogMutation.isPending}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {blogsQuery.data && blogsQuery.data.posts.length === 0 && (
          <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">No blog posts found</h3>
            <p className="text-gray-400 mb-6">
              {statusFilter === "all"
                ? "Start by generating your first blog post!"
                : `No ${statusFilter} posts available.`}
            </p>
            <button
              onClick={() => navigate({ to: "/admin/content/generate" })}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60"
            >
              <Plus className="h-5 w-5" />
              Generate New Blog
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
