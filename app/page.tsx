import type { Metadata } from "next";
import { getAllPostsMeta } from "@/lib/markdown";
import PostCard from "@/components/PostCard";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Artículos sobre desarrollo web, tecnología y experiencias.",
};

export default function HomePage() {
  const posts = getAllPostsMeta();

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      {/* Hero */}
      <header className="mb-20">
        <div className="inline-block mb-4">
          <span
            className="text-xs uppercase tracking-[0.3em] font-mono px-3 py-1 rounded-full border"
            style={{
              color: "var(--color-accent)",
              borderColor: "var(--color-border)",
              background: "var(--color-accent-glow)",
            }}
          >
            Blog personal
          </span>
        </div>
        <h1
          className="font-display text-5xl md:text-6xl font-bold leading-tight mb-5"
          style={{ color: "#f0ebe2" }}
        >
          Ideas, notas
          <br />
          <em className="italic" style={{ color: "var(--color-accent)" }}>
            y aprendizajes.
          </em>
        </h1>
        <p
          className="text-lg max-w-xl leading-relaxed"
          style={{ color: "var(--color-ink-muted)" }}
        >
          Un blog para compartir lo que aprendo a lo largo de la carrera de ingeniería en computación.
        </p>
      </header>

      {/* Posts */}
      {posts.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl border"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p
            className="font-display text-2xl mb-2"
            style={{ color: "var(--color-ink-muted)" }}
          >
            Aún no hay artículos.
          </p>
          <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
            Agrega archivos <code className="font-mono">.md</code> en la carpeta{" "}
            <code className="font-mono">content/</code>.
          </p>
        </div>
      ) : (
        <section>
          <div
            className="flex items-center gap-4 mb-10"
            style={{ color: "var(--color-ink-muted)" }}
          >
            <span className="text-xs uppercase tracking-widest font-mono">
              {posts.length} {posts.length === 1 ? "artículo" : "artículos"}
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--color-border)" }}
            />
          </div>

          <div className="flex flex-col gap-6">
            {posts.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}