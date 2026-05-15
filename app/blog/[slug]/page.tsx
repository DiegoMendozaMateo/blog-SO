import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getPostBySlug } from "@/lib/markdown";
import TocSidebar from "@/components/TocSidebar";
import type { TocItem } from "@/types/post";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

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

// TOC inline para móvil (Server Component, sin toggle)
function TocInline({ items }: { items: TocItem[] }) {
  if (items.length < 3) return null;

  return (
    <nav className="toc-inline mb-10 rounded-xl border p-5" aria-label="Tabla de contenidos">
      <p className="toc-inline__title text-xs uppercase tracking-widest font-mono mb-3">
        Contenido
      </p>
      <ol className="toc-inline__list">
        {items.map((item) => (
          <li
            key={item.id}
            className="toc-inline__item"
            style={{ paddingLeft: item.level === 3 ? "1rem" : "0" }}
          >
            <a href={`#${item.id}`} className="toc-inline__link">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
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
    <div className="post-layout max-w-6xl mx-auto px-6 py-20">
      <article className="post-layout__main max-w-2xl">
        <Link href="/" className="post-back-link inline-flex items-center gap-2 text-sm mb-14">
          <span>←</span>
          <span>Volver al inicio</span>
        </Link>

        {post.coverImage && (
          <div className="mb-10 rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt={post.title} className="w-full h-64 object-cover" />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map((tag) => (
              <span key={tag} className="post-tag text-xs uppercase tracking-widest px-2.5 py-1 rounded-full border font-mono">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="post-title font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
          {post.title}
        </h1>

        <div className="post-meta flex flex-wrap items-center gap-4 text-sm mb-4 pb-8 border-b font-mono">
          {post.author && <span>{post.author}</span>}
          {post.author && <span>·</span>}
          <time dateTime={post.date}>{formattedDate}</time>
          {post.readingTime && (
            <>
              <span>·</span>
              <span>{post.readingTime} min de lectura</span>
            </>
          )}
        </div>

        {post.excerpt && (
          <p className="post-excerpt text-lg italic mb-10 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* TOC inline solo en móvil/tablet */}
        <div className="toc-inline-wrapper">
          <TocInline items={post.toc} />
        </div>

        <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="mt-16 pt-8 border-t" style={{ borderColor: "var(--color-border)" }}>
          <Link href="/" className="post-back-link inline-flex items-center gap-2 text-sm">
            <span>←</span>
            <span>Todos los artículos</span>
          </Link>
        </div>
      </article>

      {/* Sidebar con toggle — Client Component */}
      <TocSidebar items={post.toc} />
    </div>
  );
}