import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { getActiveCategories } from "@/lib/tools/registry";
import { siteConfig } from "@/lib/site";

export function Header() {
  const categories = getActiveCategories();

  return (
    <header className="sticky top-0 z-40 bg-black/80 text-white backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-5xl items-center gap-6 px-4">
        <Link href="/" aria-label={siteConfig.name} className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 text-sm sm:flex">
          <Link href="/" className="text-white/70 transition-colors hover:text-white">
            All tools
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="whitespace-nowrap text-white/70 transition-colors hover:text-white"
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
