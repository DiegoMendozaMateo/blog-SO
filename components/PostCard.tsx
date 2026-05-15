import Link from "next/link";
import type { PostMeta } from "@/types/post";

interface Props {
  post: PostMeta;
  index?: number;
}

export default function PostCard({ post, index = 0 }: Props) {
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(post.date));

  return (
    <Link href={`/blog/${post.slug}`} className="post-card group block rounded-xl border p-6">
      <div className="flex items-start justify-between gap-4">
        {/* Número */}
        <span className="post-card__num font-mono text-xs shrink-0 mt-1">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="flex-1 min-w-0">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="post-card__tag text-xs uppercase tracking-wider px-2 py-0.5 rounded-full border font-mono">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Título */}
          <h2 className="post-card__title font-display text-xl font-bold leading-snug mb-2">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="post-card__excerpt text-sm leading-relaxed mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="post-card__meta flex items-center gap-3 text-xs font-mono">
            {post.author && <span>{post.author}</span>}
            {post.author && <span>·</span>}
            <time dateTime={post.date}>{formattedDate}</time>
            {post.readingTime && (
              <>
                <span>·</span>
                <span>{post.readingTime} min</span>
              </>
            )}
          </div>
        </div>

        {/* Flecha */}
        <span className="post-card__arrow shrink-0 text-lg transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}