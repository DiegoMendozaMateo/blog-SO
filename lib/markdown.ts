import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";
import type { Post, PostMeta, TocItem } from "@/types/post";

const CONTENT_DIR = path.join(process.cwd(), "content");

/** Calcula el tiempo de lectura estimado en minutos */
function calcReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(wordCount / wordsPerMinute));
}

/** Convierte un texto de heading en un id válido para usar como ancla */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")                     // descompone acentos
    .replace(/[\u0300-\u036f]/g, "")      // elimina diacríticos
    .replace(/[^\w\s-]/g, "")            // elimina caracteres especiales
    .trim()
    .replace(/\s+/g, "-")               // espacios → guiones
    .replace(/-+/g, "-");               // guiones múltiples → uno
}

/**
 * Recibe el HTML procesado, le inyecta id="..." a cada h2 y h3,
 * y devuelve el HTML modificado junto con la tabla de contenidos.
 */
function processHeadings(contentHtml: string): {
  html: string;
  toc: TocItem[];
} {
  const toc: TocItem[] = [];
  const usedIds = new Map<string, number>();

  const processed = contentHtml.replace(
    /<(h[23])>(.*?)<\/h[23]>/gi,
    (_match, tag: string, innerHtml: string) => {
      // Quitar tags HTML del texto para el id y el texto del TOC
      const plainText = innerHtml.replace(/<[^>]+>/g, "");
      let id = slugifyHeading(plainText);

      // Si el mismo id ya existe, añadir sufijo numérico
      const count = usedIds.get(id) ?? 0;
      usedIds.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`;

      const level = parseInt(tag[1]); // 2 o 3
      toc.push({ id, text: plainText, level });

      return `<${tag} id="${id}">${innerHtml}</${tag}>`;
    }
  );

  return { html: processed, toc };
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

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/** Lee un post completo (metadatos + contenido HTML + TOC) por su slug */
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

  const rawHtml = processedContent.toString();
  const { html: contentHtml, toc } = processHeadings(rawHtml);

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
    toc,
  };
}