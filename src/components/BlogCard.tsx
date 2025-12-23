import { Link } from "@tanstack/react-router";
import { Clock, Calendar, Tag } from "lucide-react";

interface BlogCardProps {
  slug: string;
  title: string;
  metaDescription: string;
  category: string;
  readingTime: number;
  featuredImage?: string | null;
  publishedAt: Date | string | null;
}

export function BlogCard({
  slug,
  title,
  metaDescription,
  category,
  readingTime,
  featuredImage,
  publishedAt,
}: BlogCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <Link
      to="/blogs/$slug"
      params={{ slug }}
      className="group block overflow-hidden rounded-xl bg-white/10 backdrop-blur-md transition hover:bg-white/15 border border-white/10 hover:border-blue-400/50 hover:scale-[1.02]"
    >
      {/* Featured Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Tag className="h-16 w-16 text-white/20" />
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {category}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="mb-2 text-xl font-bold text-white line-clamp-2 group-hover:text-blue-400 transition">
          {title}
        </h3>

        <p className="mb-4 text-sm text-gray-400 line-clamp-3">
          {metaDescription}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{readingTime} min read</span>
          </div>
        </div>

        {/* Read More */}
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition">
          Read More
          <span className="transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}
