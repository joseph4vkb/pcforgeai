import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { BlogPreview } from "~/components/BlogPreview";
import { BlogCard } from "~/components/BlogCard";
import { SocialShareButtons } from "~/components/SocialShareButtons";
import { Cpu, Clock, Calendar, Tag, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "~/stores/useAuthStore";

export const Route = createFileRoute("/blogs/$slug")({
  component: BlogPostPage,
});

function BlogPostPage() {
  const navigate = useNavigate();
  const { slug } = Route.useParams();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();

  const blogQuery = useQuery(
    trpc.getBlogBySlug.queryOptions({ slug })
  );

  const relatedPostsQuery = useQuery(
    trpc.getRelatedBlogPosts.queryOptions(
      {
        currentPostId: blogQuery.data?.id ?? 0,
        category: blogQuery.data?.category ?? "",
        tags: Array.isArray(blogQuery.data?.tags) ? (blogQuery.data.tags as string[]) : [],
      },
      {
        enabled: !!blogQuery.data,
      }
    )
  );

  const formatPrice = (price: number) => {
    return `₹${(price / 1000).toFixed(0)}k`;
  };

  const formattedDate = blogQuery.data?.publishedAt
    ? new Date(blogQuery.data.publishedAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Get current page URL for sharing
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 cursor-pointer transition hover:opacity-80"
            >
              <Cpu className="h-7 w-7 text-blue-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                pcforgeai
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ to: "/blogs" })}
                className="rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
              >
                All Posts
              </button>
              {token ? (
                <>
                  <button
                    onClick={() => navigate({ to: role === "admin" ? "/admin/dashboard" : "/account" })}
                    className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                  >
                    {email}
                  </button>
                  {role === "admin" && (
                    <button
                      onClick={() => navigate({ to: "/admin/dashboard" })}
                      className="rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30"
                    >
                      Admin Dashboard
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => navigate({ to: "/login" })}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate({ to: "/blogs" })}
          className="mb-6 flex items-center gap-2 text-blue-400 transition hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all posts
        </button>

        {blogQuery.isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          </div>
        )}

        {blogQuery.isError && (
          <div className="rounded-2xl bg-red-500/10 p-12 text-center backdrop-blur-md border border-red-500/30">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
            <h2 className="mb-2 text-2xl font-bold text-white">Blog Post Not Found</h2>
            <p className="text-gray-400 mb-4">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate({ to: "/blogs" })}
              className="rounded-lg bg-blue-500/20 px-6 py-2 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
            >
              Browse All Posts
            </button>
          </div>
        )}

        {blogQuery.data && (
          <div className="mx-auto max-w-4xl">
            {/* Article Header */}
            <article className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 overflow-hidden">
              {/* Featured Image */}
              {blogQuery.data.featuredImage && (
                <div className="relative h-64 md:h-96 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <img
                    src={blogQuery.data.featuredImage}
                    alt={blogQuery.data.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 md:p-10">
                {/* Category Badge */}
                <div className="mb-4 inline-block rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-semibold text-purple-300 border border-purple-500/30">
                  {blogQuery.data.category}
                </div>

                {/* Title */}
                <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {blogQuery.data.title}
                </h1>

                {/* Meta Description */}
                <p className="mb-6 text-lg text-gray-400">
                  {blogQuery.data.metaDescription}
                </p>

                {/* Meta Info */}
                <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-500 border-b border-white/10 pb-6">
                  {formattedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{blogQuery.data.readingTime} min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>{blogQuery.data.wordCount} words</span>
                  </div>
                </div>

                {/* Tags */}
                {blogQuery.data.tags && Array.isArray(blogQuery.data.tags) && blogQuery.data.tags.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {(blogQuery.data.tags as string[]).map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400 border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Social Share */}
                <div className="mb-8 border-b border-white/10 pb-6">
                  <SocialShareButtons
                    url={currentUrl}
                    title={blogQuery.data.title}
                  />
                </div>

                {/* Article Content */}
                <BlogPreview content={blogQuery.data.content} />

                {/* Related Build Info */}
                {blogQuery.data.build && (
                  <div className="mt-10 rounded-xl bg-blue-500/10 p-6 border border-blue-500/30">
                    <h3 className="mb-4 text-xl font-bold text-white">Featured Build</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">{blogQuery.data.build.category}</p>
                        <p className="text-2xl font-bold text-white">
                          {formatPrice(blogQuery.data.build.totalCost)}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate({ to: `/build/${blogQuery.data.build!.id}` })}
                        className="rounded-lg bg-blue-500/20 px-6 py-2 font-medium text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/30 border border-blue-500/30"
                      >
                        View Full Build
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Social Share */}
                <div className="mt-10 border-t border-white/10 pt-6">
                  <p className="mb-3 text-sm font-medium text-gray-400">Found this helpful? Share it!</p>
                  <SocialShareButtons
                    url={currentUrl}
                    title={blogQuery.data.title}
                  />
                </div>
              </div>
            </article>

            {/* Related Posts Section */}
            {relatedPostsQuery.data && relatedPostsQuery.data.length > 0 && (
              <div className="mt-12">
                <h2 className="mb-6 text-2xl md:text-3xl font-bold text-white">
                  Related Articles
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {relatedPostsQuery.data.map((post) => (
                    <BlogCard
                      key={post.id}
                      slug={post.slug}
                      title={post.title}
                      metaDescription={post.metaDescription}
                      category={post.category}
                      readingTime={post.readingTime}
                      featuredImage={post.featuredImage}
                      publishedAt={post.publishedAt}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-400">
            <p>&copy; 2024 pcforgeai. Powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
