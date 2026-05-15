export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  tags?: string[];
  author?: string;
  readingTime?: number; // minutos estimados
  content: string; // HTML procesado desde Markdown
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  tags?: string[];
  author?: string;
  readingTime?: number;
}