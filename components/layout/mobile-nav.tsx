"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Mobile-only navigation: a hamburger that toggles a dropdown of the same links
 * the desktop nav shows inline. Hidden from `sm` up (desktop uses the inline nav).
 */
export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative ml-auto sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <>
          {/* Click-away layer below the header. */}
          <div
            className="fixed inset-0 top-12 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-white/10 bg-black/90 p-2 shadow-xl backdrop-blur-xl">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
