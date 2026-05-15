import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import type { Post, PostMeta } from "@/types/post";

const CONTENT_DIR = path.join(process.cwd(), "content");

/** Calcula el tiempo de lectura estimado en minutos */
function calcReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(wordCount / wordsPerMinute));
}

/** Devuelve la lista de slugs disponibles en /content */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx?$/, ""));
}

/** Lee los metadatos de todos los posts (sin el contenido HTML) */
export function getAllPostsMeta(): PostMeta[] {
  const slugs = getAllSlugs();

  const posts: PostMeta[] = slugs.map((slug) => {
    const fullPath = path.join(CONTENT_DIR, `${slug}.md`);
    const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
    const filePath = fs.existsSync(fullPath) ? fullPath : mdxPath;

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title ?? "Sin título",
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      excerpt: data.excerpt ?? "",
      coverImage: data.coverImage ?? undefined,
      tags: data.tags ?? [],
      author: data.author ?? "Anónimo",
      readingTime: calcReadingTime(content),
    };
  });

  // Ordenar del más reciente al más antiguo
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/** Lee un post completo (metadatos + contenido HTML) por su slug */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPath = path.join(CONTENT_DIR, `${slug}.md`);
  const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
  const filePath = fs.existsSync(fullPath) ? fullPath : mdxPath;

  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const processedContent = await remark()
    .use(remarkGfm)
    .use(html, { sanitize: false })
    .process(content);

  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title ?? "Sin título",
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    excerpt: data.excerpt ?? "",
    coverImage: data.coverImage ?? undefined,
    tags: data.tags ?? [],
    author: data.author ?? "Anónimo",
    readingTime: calcReadingTime(content),
    content: contentHtml,
  };
}