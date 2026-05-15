"use client";

import { useState } from "react";
import type { TocItem } from "@/types/post";

interface Props {
  items: TocItem[];
}

export default function TocSidebar({ items }: Props) {
  const [open, setOpen] = useState(true);

  if (items.length < 3) return null;

  return (
    <aside className="toc-sidebar" aria-label="Tabla de contenidos">
      <div className="toc-sidebar__inner">
        {/* Header con botón toggle */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="toc-sidebar__header"
          aria-expanded={open}
          aria-controls="toc-list"
        >
          <span className="toc-sidebar__title">Contenido</span>
          <span
            className="toc-sidebar__chevron"
            style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            ▾
          </span>
        </button>

        {/* Lista colapsable */}
        {open && (
          <nav id="toc-list">
            <ol className="toc-sidebar__list">
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{ paddingLeft: item.level === 3 ? "0.75rem" : "0" }}
                >
                  <a href={`#${item.id}`} className="toc-sidebar__link">
                    {item.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </aside>
  );
}