import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getPostBySlug } from "@/lib/markdown";

interface Props {
  params: Promise<{ slug: string }>;
}

// Genera las rutas estáticas en build time
export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// Metadatos dinámicos por post
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post no encontrado" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      ...(post.coverImage && { images: [{ url: post.coverImage }] }),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.date));

  return (
    <article className="max-w-2xl mx-auto px-6 py-20">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm mb-14 transition-opacity hover:opacity-70"
        style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
      >
        <span>←</span>
        <span>Volver al inicio</span>
      </Link>

      {/* Cover image */}
      {post.coverImage && (
        <div className="mb-10 rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs uppercase tracking-widest px-2.5 py-1 rounded-full border font-mono"
              style={{
                color: "var(--color-accent)",
                borderColor: "var(--color-border)",
                background: "var(--color-accent-glow)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1
        className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6"
        style={{ color: "#f0ebe2" }}
      >
        {post.title}
      </h1>

      {/* Meta */}
      <div
        className="flex flex-wrap items-center gap-4 text-sm mb-4 pb-8 border-b font-mono"
        style={{
          color: "var(--color-ink-muted)",
          borderColor: "var(--color-border)",
        }}
      >
        {post.author && <span>{post.author}</span>}
        <span>·</span>
        <time dateTime={post.date}>{formattedDate}</time>
        {post.readingTime && (
          <>
            <span>·</span>
            <span>{post.readingTime} min de lectura</span>
          </>
        )}
      </div>

      {/* Excerpt */}
      {post.excerpt && (
        <p
          className="text-lg italic mb-10 leading-relaxed"
          style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-body)" }}
        >
          {post.excerpt}
        </p>
      )}

      {/* Content */}
      <div
        className="prose-blog"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Footer del post */}
      <div
        className="mt-16 pt-8 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
        >
          <span>←</span>
          <span>Todos los artículos</span>
        </Link>
      </div>
    </article>
  );
}