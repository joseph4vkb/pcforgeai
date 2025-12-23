import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { ArrowLeft, Save, Eye, Loader2, Upload, X, Image } from "lucide-react";
import toast from "react-hot-toast";
import { BlogPreview } from "~/components/BlogPreview";
import { isTokenValid } from "~/utils/tokenValidation";

export const Route = createFileRoute("/admin/content/$slug/edit")({
  component: BlogEditPage,
});

function BlogEditPage() {
  const navigate = useNavigate();
  const { slug } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { token, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [seoKeywordInput, setSeoKeywordInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!token || !isTokenValid(token)) {
      if (token) {
        // Token exists but is invalid/expired, clear it
        logout();
      }
      navigate({ to: "/admin/login" });
    }
  }, [token, logout, navigate]);

  // Fetch blog post data
  const blogQuery = useQuery({
    ...trpc.getBlogBySlug.queryOptions({ slug, authToken: token }),
    enabled: !!token,
    retry: false,
  });

  // Fetch categories for dropdown
  const categoriesQuery = useQuery(
    trpc.getBlogCategories.queryOptions()
  );

  // Populate form when data loads
  useEffect(() => {
    if (blogQuery.data) {
      setTitle(blogQuery.data.title);
      setMetaDescription(blogQuery.data.metaDescription);
      setContent(blogQuery.data.content);
      setCategory(blogQuery.data.category);
      setTags(Array.isArray(blogQuery.data.tags) ? (blogQuery.data.tags as string[]) : []);
      setSeoKeywords(Array.isArray(blogQuery.data.seoKeywords) ? (blogQuery.data.seoKeywords as string[]) : []);
      setStatus(blogQuery.data.status as "draft" | "published");
      setFeaturedImage(blogQuery.data.featuredImage || null);
    }
  }, [blogQuery.data]);

  const updateBlogMutation = useMutation(
    trpc.updateBlogPost.mutationOptions()
  );

  const getPresignedUrlMutation = useMutation(
    trpc.getMinioPresignedUrl.mutationOptions()
  );

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddSeoKeyword = () => {
    if (seoKeywordInput.trim() && !seoKeywords.includes(seoKeywordInput.trim())) {
      setSeoKeywords([...seoKeywords, seoKeywordInput.trim()]);
      setSeoKeywordInput("");
    }
  };

  const handleRemoveSeoKeyword = (keywordToRemove: string) => {
    setSeoKeywords(seoKeywords.filter(keyword => keyword !== keywordToRemove));
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

      setFeaturedImage(data.imageUrl);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Image upload failed:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setFeaturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (!category.trim()) {
      toast.error("Category is required");
      return;
    }

    // Calculate word count and reading time
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min

    try {
      await updateBlogMutation.mutateAsync({
        authToken: token || "",
        slug,
        title,
        metaDescription,
        content,
        category,
        tags,
        seoKeywords,
        status,
        featuredImage: featuredImage || undefined,
        wordCount,
        readingTime,
      });

      await queryClient.invalidateQueries({ queryKey: [["getAdminBlogs"]] });
      await queryClient.invalidateQueries({ queryKey: [["getBlogBySlug"], { slug }] });

      toast.success("Blog post updated successfully");
      navigate({ to: "/admin/content" });
    } catch (error: any) {
      console.error("Save blog failed:", error);
      toast.error(error.message || "Failed to update blog post");
      if (error.data) console.error("Error data:", error.data);
    }
  };

  if (!token) return null;

  if (blogQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (blogQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="rounded-2xl bg-red-500/10 p-12 text-center backdrop-blur-md border border-red-500/30">
          <h2 className="mb-2 text-2xl font-bold text-white">Blog Post Not Found</h2>
          <p className="text-gray-400 mb-4">The blog post you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate({ to: "/admin/content" })}
            className="rounded-lg bg-blue-500/20 px-6 py-2 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
          >
            Back to Content Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: "/admin/content" })}
                className="flex items-center gap-2 text-gray-400 transition hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Content
              </button>
              <h1 className="text-2xl font-bold text-white">Edit Blog Post</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? "Edit" : "Preview"}
              </button>
              <button
                onClick={handleSave}
                disabled={updateBlogMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60 disabled:opacity-50"
              >
                {updateBlogMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {showPreview ? (
          /* Preview Mode */
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 overflow-hidden">
              {featuredImage && (
                <div className="relative h-64 md:h-96 overflow-hidden">
                  <img
                    src={featuredImage}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 md:p-10">
                <div className="mb-4 inline-block rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-semibold text-purple-300 border border-purple-500/30">
                  {category}
                </div>
                <h1 className="mb-4 text-3xl md:text-4xl font-bold text-white">{title}</h1>
                <p className="mb-6 text-lg text-gray-400">{metaDescription}</p>
                {tags.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400 border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <BlogPreview content={content} />
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Featured Image Upload */}
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-md border border-white/10">
              <h3 className="mb-4 text-lg font-semibold text-white">Featured Image</h3>

              {featuredImage ? (
                <div className="relative">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 rounded-full bg-red-500/80 p-2 text-white transition hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <Image className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 mb-4">Upload a featured image for your blog post</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-2 mx-auto rounded-lg bg-blue-500/20 px-6 py-2 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30 disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Choose Image
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Max size: 5MB</p>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-md border border-white/10">
              <h3 className="mb-4 text-lg font-semibold text-white">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="Enter blog post title"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Meta Description *
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="Brief description for SEO (160 characters max)"
                    maxLength={160}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {metaDescription.length}/160 characters
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    list="categories"
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="e.g., Gaming PC, Budget Build"
                  />
                  <datalist id="categories">
                    {categoriesQuery.data?.map((cat) => (
                      <option key={cat.name} value={cat.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  >
                    <option value="draft" className="bg-slate-800">Draft</option>
                    <option value="published" className="bg-slate-800">Published</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-md border border-white/10">
              <h3 className="mb-4 text-lg font-semibold text-white">Tags</h3>

              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  placeholder="Add a tag"
                />
                <button
                  onClick={handleAddTag}
                  className="rounded-lg bg-blue-500/20 px-6 py-2 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300 border border-purple-500/30"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-purple-300 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* SEO Keywords */}
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-md border border-white/10">
              <h3 className="mb-4 text-lg font-semibold text-white">SEO Keywords</h3>

              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={seoKeywordInput}
                  onChange={(e) => setSeoKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSeoKeyword())}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  placeholder="Add an SEO keyword"
                />
                <button
                  onClick={handleAddSeoKeyword}
                  className="rounded-lg bg-blue-500/20 px-6 py-2 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                >
                  Add
                </button>
              </div>

              {seoKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {seoKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300 border border-green-500/30"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveSeoKeyword(keyword)}
                        className="text-green-300 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-md border border-white/10">
              <h3 className="mb-4 text-lg font-semibold text-white">Content (Markdown) *</h3>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                placeholder="Write your blog content in Markdown format..."
              />
              <p className="mt-2 text-xs text-gray-500">
                {content.trim().split(/\s+/).length} words · {Math.ceil(content.trim().split(/\s+/).length / 200)} min read
              </p>
            </div>

            {/* Associated Build */}
            {blogQuery.data.build && (
              <div className="rounded-xl bg-blue-500/10 p-6 backdrop-blur-md border border-blue-500/30">
                <h3 className="mb-2 text-lg font-semibold text-white">Associated Build</h3>
                <p className="text-gray-400">
                  {blogQuery.data.build.category} · ₹{(blogQuery.data.build.totalCost / 1000).toFixed(0)}k
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
