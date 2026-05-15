"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        background: "rgba(22, 20, 18, 0.85)",
        borderColor: "var(--color-border)",
      }}
    >
      <nav className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          href="/"
          className="font-display text-xl font-bold transition-opacity hover:opacity-80"
          style={{ color: "#f0ebe2" }}
        >
          My<span style={{ color: "var(--color-accent)" }}>B</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <NavLink href="/" active={pathname === "/"}>
            Inicio
          </NavLink>
          <NavLink href="/blog" active={pathname.startsWith("/blog")}>
            Artículos
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-mono transition-colors relative group"
      style={{ color: active ? "var(--color-accent)" : "var(--color-ink-muted)" }}
    >
      {children}
      <span
        className="absolute -bottom-0.5 left-0 h-px transition-all duration-300"
        style={{
          background: "var(--color-accent)",
          width: active ? "100%" : "0%",
        }}
      />
    </Link>
  );
}