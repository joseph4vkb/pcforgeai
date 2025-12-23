import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { BlogCard } from "~/components/BlogCard";
import { Cpu, Search, Filter, Loader2, BookOpen } from "lucide-react";
import { useAuthStore } from "~/stores/useAuthStore";

export const Route = createFileRoute("/blogs/")({
  component: BlogsPage,
});

function BlogsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, email, role } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cursor, setCursor] = useState<number | undefined>();

  const categoriesQuery = useQuery(
    trpc.getBlogCategories.queryOptions()
  );

  const blogsQuery = useQuery(
    trpc.getPublishedBlogs.queryOptions({
      cursor,
      limit: 12,
      category: selectedCategory,
      search: searchQuery,
    })
  );

  const recommendedBlogsQuery = useQuery(
    trpc.getHomepageBlogs.queryOptions({ limit: 6 })
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCursor(undefined);
  };

  const handleCategoryChange = (category: string | undefined) => {
    setSelectedCategory(category);
    setCursor(undefined);
  };

  const handleLoadMore = () => {
    if (blogsQuery.data?.nextCursor) {
      setCursor(blogsQuery.data.nextCursor);
    }
  };

  const allPosts = cursor && blogsQuery.data
    ? [...(blogsQuery.data.posts || [])]
    : blogsQuery.data?.posts || [];

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
                onClick={() => navigate({ to: "/products" })}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Browse Components
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
                <>
                  <button
                    onClick={() => navigate({ to: "/login" })}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 backdrop-blur-sm border border-purple-500/30">
            <BookOpen className="h-4 w-4" />
            Tech Blog
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            PC Building Guides & Reviews
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Expert insights, component reviews, and build guides for PC enthusiasts
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full rounded-lg border border-white/20 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
              />
            </div>
          </form>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory || ""}
              onChange={(e) => handleCategoryChange(e.target.value || undefined)}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white backdrop-blur-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            >
              <option value="" className="bg-slate-800">All Categories</option>
              {categoriesQuery.data?.map((cat) => (
                <option key={cat.name} value={cat.name} className="bg-slate-800">
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {blogsQuery.isLoading && !cursor && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          </div>
        )}

        {allPosts.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allPosts.map((post) => (
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

            {/* Load More Button */}
            {blogsQuery.data?.nextCursor && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={blogsQuery.isFetching}
                  className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-6 py-3 font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/30 border border-purple-500/30 disabled:opacity-50"
                >
                  {blogsQuery.isFetching ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {!blogsQuery.isLoading && allPosts.length === 0 && (
          <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">No blog posts found</h3>
            <p className="text-gray-400">
              {searchQuery || selectedCategory
                ? "Try adjusting your filters or search query"
                : "Check back soon for new content!"}
            </p>
          </div>
        )}

        {/* Recommended Blog Posts Section */}
        {recommendedBlogsQuery.data && recommendedBlogsQuery.data.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
                Recommended Articles
              </h2>
              <p className="text-gray-400">
                Discover more insights and guides from our latest posts
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedBlogsQuery.data.map((post) => (
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
