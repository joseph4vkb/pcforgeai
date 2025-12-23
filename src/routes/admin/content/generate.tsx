import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { BlogPreview } from "~/components/BlogPreview";
import { Cpu, ArrowLeft, Sparkles, Loader2, Save, Eye, FileText, Send } from "lucide-react";
import toast from "react-hot-toast";
import { isTokenValid } from "~/utils/tokenValidation";

export const Route = createFileRoute("/admin/content/generate")({
  component: GenerateBlogContent,
});

interface GenerateForm {
  buildId: number;
  tone: "technical" | "beginner-friendly" | "comparison" | "influencer" | "youtube-script";
}

interface GeneratedContent {
  titleVariations: string[];
  metaDescription: string;
  seoKeywords: string[];
  articleContent: string;
  category: string;
  tags: string[];
  wordCount: number;
  readingTime: number;
  buildId: number;
}

function GenerateBlogContent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { token, logout } = useAuthStore();
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
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

  const buildsQuery = useQuery(
    trpc.getAllBuilds.queryOptions(
      { authToken: token || "" },
      { enabled: !!token }
    )
  );

  const generateMutation = useMutation(
    trpc.generateBlogContent.mutationOptions()
  );

  const createBlogMutation = useMutation(
    trpc.createBlogPost.mutationOptions()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateForm>({
    defaultValues: {
      tone: "beginner-friendly",
    },
  });

  const onGenerate = async (data: GenerateForm) => {
    const promise = generateMutation.mutateAsync({
      authToken: token || "",
      buildId: data.buildId,
      tone: data.tone,
    });

    toast.promise(promise, {
      loading: "Generating blog content with AI... This may take a minute.",
      success: "Blog content generated successfully!",
      error: (err: any) => {
        // Extract user-friendly error message from TRPC error
        if (err?.message) {
          return err.message;
        } else if (err?.data?.message) {
          return err.data.message;
        } else if (typeof err === 'string') {
          return err;
        }
        return "Failed to generate content. Please try again.";
      },
    });

    try {
      const result = await promise;
      setGeneratedContent(result as GeneratedContent);
      setSelectedTitle(result.titleVariations[0]);
      setShowPreview(true);
    } catch (error) {
      console.error("Blog generation error:", error);
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!generatedContent) return;

    const promise = createBlogMutation.mutateAsync({
      authToken: token || "",
      title: selectedTitle,
      metaDescription: generatedContent.metaDescription,
      content: generatedContent.articleContent,
      tags: generatedContent.tags,
      category: generatedContent.category,
      seoKeywords: generatedContent.seoKeywords,
      buildId: generatedContent.buildId,
      wordCount: generatedContent.wordCount,
      readingTime: generatedContent.readingTime,
      status,
    });

    toast.promise(promise, {
      loading: status === "published" ? "Publishing blog post..." : "Saving as draft...",
      success: status === "published" ? "Blog post published successfully!" : "Blog post saved as draft!",
      error: (err: any) => {
        // Extract user-friendly error message from TRPC error
        if (err?.message) {
          return err.message;
        } else if (err?.data?.message) {
          return err.data.message;
        } else if (typeof err === 'string') {
          return err;
        }
        return "Failed to save blog post. Please try again.";
      },
    });

    try {
      const result = await promise;
      await queryClient.invalidateQueries({ queryKey: [["getAdminBlogs"]] });
      navigate({ to: "/admin/content" });
    } catch (error: any) {
      console.error("Blog save error:", error);
      toast.error(error.message || "Failed to save blog post");
      if (error.data) console.error("Error data:", error.data);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: "/admin/content" })}
              className="flex items-center gap-2 text-gray-400 transition hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Blog Management
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Generate Blog Content</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!generatedContent ? (
          // Generation Form
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md">
            <h2 className="mb-6 text-2xl font-bold text-white">AI Blog Content Generator</h2>
            <p className="mb-8 text-gray-400">
              Select a PC build and choose a writing tone to generate a comprehensive, SEO-optimized blog article.
            </p>

            <form onSubmit={handleSubmit(onGenerate)} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Select PC Build
                </label>
                <select
                  {...register("buildId", { required: "Please select a build", valueAsNumber: true })}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                >
                  <option value="" className="bg-slate-800">Choose a build...</option>
                  {buildsQuery.data?.map((build) => {
                    // Defensive check: ensure build.parts exists and is an array
                    const parts = Array.isArray(build.parts) ? build.parts as Array<{ category: string; name: string }> : [];
                    const cpuPart = parts.find(p => p?.category === "CPU");
                    const displayName = cpuPart?.name ? cpuPart.name.substring(0, 40) : "Components";
                    return (
                      <option key={build.id} value={build.id} className="bg-slate-800">
                        {build.category} - ₹{(build.totalCost / 1000).toFixed(0)}k
                        {cpuPart && ` - ${displayName}...`}
                      </option>
                    );
                  })}
                </select>
                {errors.buildId && (
                  <p className="mt-1 text-sm text-red-400">{errors.buildId.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Writing Tone
                </label>
                <select
                  {...register("tone")}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                >
                  <option value="beginner-friendly" className="bg-slate-800">
                    Beginner-Friendly - Simple, approachable language
                  </option>
                  <option value="technical" className="bg-slate-800">
                    Technical - Detailed specs and in-depth analysis
                  </option>
                  <option value="comparison" className="bg-slate-800">
                    Comparison - Focus on alternatives and value
                  </option>
                  <option value="influencer" className="bg-slate-800">
                    Influencer - Engaging, conversational with personality
                  </option>
                  <option value="youtube-script" className="bg-slate-800">
                    YouTube Script - Video narration format
                  </option>
                </select>
              </div>

              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-6">
                <h3 className="mb-3 font-semibold text-white">What will be generated:</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>3-5 SEO-optimized title variations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Compelling meta description under 160 characters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>3-5 primary and secondary SEO keywords</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>800-1200 word comprehensive article with proper H1/H2/H3 structure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Naturally embedded Amazon affiliate links for all components</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>Category assignment and relevant tags</span>
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending || buildsQuery.isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-xl hover:shadow-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-6 w-6" />
                    Generate Blog Content
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          // Generated Content Review - Side by Side Layout
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Metadata, Controls, and Actions */}
            <div className="space-y-6">
              {/* Title Selection */}
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
                <h3 className="mb-4 text-xl font-bold text-white">Select Title</h3>
                <div className="space-y-3">
                  {(generatedContent.titleVariations || []).map((title, index) => (
                    <label
                      key={index}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/20 bg-white/5 p-4 transition hover:border-purple-400/50"
                    >
                      <input
                        type="radio"
                        name="title"
                        value={title}
                        checked={selectedTitle === title}
                        onChange={(e) => setSelectedTitle(e.target.value)}
                        className="mt-1 h-4 w-4 text-purple-500"
                      />
                      <span className="flex-1 text-white">{title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Meta Description */}
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
                <h3 className="mb-3 text-lg font-bold text-white">Meta Description</h3>
                <p className="text-sm text-gray-300">{generatedContent.metaDescription}</p>
              </div>

              {/* SEO Keywords */}
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
                <h3 className="mb-3 text-lg font-bold text-white">SEO Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {(generatedContent.seoKeywords || []).map((keyword, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300 border border-purple-500/30"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Article Stats */}
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
                <h3 className="mb-3 text-lg font-bold text-white">Article Stats</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Word Count:</span>
                    <span className="font-semibold text-white">{generatedContent.wordCount} words</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reading Time:</span>
                    <span className="font-semibold text-white">{generatedContent.readingTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-semibold text-white">{generatedContent.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tags:</span>
                    <span className="font-semibold text-white">{(generatedContent.tags || []).length} tags</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setGeneratedContent(null)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  Generate New Content
                </button>
                <button
                  onClick={() => handleSave("draft")}
                  disabled={createBlogMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-500/20 px-6 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/30 disabled:opacity-50"
                >
                  {createBlogMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSave("published")}
                  disabled={createBlogMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-green-500/50 transition hover:shadow-xl hover:shadow-green-500/60 disabled:opacity-50"
                >
                  {createBlogMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  Publish Now
                </button>
              </div>
            </div>

            {/* Right Column: Blog Preview */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Blog Post Preview</h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/30"
                  >
                    {showPreview ? (
                      <>
                        <FileText className="h-4 w-4" />
                        Show Raw
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Show Preview
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-[800px] overflow-y-auto rounded-lg border border-white/20 bg-black/20 p-6">
                  {showPreview ? (
                    <BlogPreview content={generatedContent.articleContent} />
                  ) : (
                    <pre className="whitespace-pre-wrap text-xs text-gray-300">
                      {generatedContent.articleContent}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
