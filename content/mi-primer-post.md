---
title: "Mi primer post: Bienvenido al blog"
date: "2025-05-10"
excerpt: "El inicio de un espacio para compartir ideas, aprendizajes y reflexiones sobre desarrollo web y tecnología."
tags: ["bienvenida personal"]
author: "Tu Nombre"
---

## ¿Por qué empezar un blog?

Escribir es una de las formas más efectivas de consolidar lo que aprendes. Cada vez que intentas explicar un concepto con tus propias palabras, descubres los huecos en tu comprensión, y eso es exactamente lo que quiero lograr con este espacio.

Este blog nació de una simple pregunta: **¿dónde guardo todas esas notas dispersas que acumulo mientras aprendo?**

La respuesta fue clara: en un lugar público, donde también puedan servirle a otros.

## Qué puedes esperar encontrar aquí

El contenido girará principalmente alrededor de tres áreas:

- **Desarrollo web**: React, Next.js, TypeScript, CSS... todo lo que uso en el día a día.
- **Herramientas y flujos de trabajo**: editores, terminales, shortcuts y configuraciones que me hacen más productivo.
- **Reflexiones**: el lado humano del desarrollo, aprender a aprender, y gestionar la sobreinformación.

## El stack de este blog

Por curiosidad, así está construido este sitio:

```bash
# Framework
Next.js 15 con App Router

# Lenguaje
TypeScript

# Estilos
Tailwind CSS

# Contenido
Archivos Markdown procesados con remark + gray-matter
```

Es una configuración intencionalmente simple. Sin base de datos, sin CMS, solo archivos `.md` en una carpeta. Rápido, fácil de mantener y 100% bajo mi control.

## Un bloque de código de ejemplo

```tsx
// components/PostCard.tsx
export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article>
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
    </article>
  );
}
```

## Una cita para empezar bien

> "El escritor escribe. Si no escribe, no es escritor."
> — Algún escritor sabio, en algún momento.

---

Gracias por leer hasta aquí. Esto apenas empieza.