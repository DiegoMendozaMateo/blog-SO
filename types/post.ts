export interface TocItem {
  id: string;    // ancla del heading: "introduccion-a-procesos"
  text: string;  // texto visible: "Introducción a procesos"
  level: number; // 2 = h2, 3 = h3
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  tags?: string[];
  author?: string;
  readingTime?: number;
  content: string;
  toc: TocItem[];
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