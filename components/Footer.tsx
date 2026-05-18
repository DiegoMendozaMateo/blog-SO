export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t mt-20"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p
          className="text-xs font-mono"
          style={{ color: "var(--color-ink-muted)" }}
        >
          © {year} Mi Blog · Hecho con{" "}
          <span style={{ color: "var(--color-accent)" }}>sudor, sangre, lagrimas</span> y Next.js
        </p>

        <div
          className="flex items-center gap-5 text-xs font-mono"
          style={{ color: "var(--color-ink-muted)" }}
        >
          <a
            href="https://github.com/DiegoMendozaMateo?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[var(--color-accent)]"
          >
            --
          </a>
        </div>
      </div>
    </footer>
  );
}