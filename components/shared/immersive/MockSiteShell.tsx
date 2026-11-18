"use client";

/**
 * A stand-in for ape.church's site shell (the 80 px top nav + the left sidebar), for previewing a full-screen game the
 * way it will really sit on the site. DO NOT EDIT, and don't ship it: on ape.church the real shell wraps your page.
 *
 * It carries the same hooks the real shell has, so ./immersive.css reshapes it exactly as it does on the site:
 * - [data-app-header] on the top nav (hidden in browser full screen),
 * - [data-slot="sidebar-gap"] + [data-slot="sidebar-container"] on the sidebar (parked off-canvas while a full-screen
 *   game is on the page; the stage's Menu pill slides it back in),
 * - the root layout's `.container.isolate` wrapper (its padding and max width drop away).
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, LayoutPanelLeft, Maximize, Table2 } from "lucide-react";

const LINKS = [
  { href: "/", label: "HUD", icon: LayoutPanelLeft, title: "HUD example (setup card layout)" },
  { href: "/full-screen", label: "Full screen", icon: Maximize, title: "Full-screen slot example" },
  { href: "/full-screen/table", label: "Table kit", icon: Table2, title: "Full-screen table kit reference" },
];

export default function MockSiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex w-full" style={{ "--sidebar-width": "100px" } as React.CSSProperties}>
      {/* width as a class, not inline: immersive.css must be able to collapse it to 0 */}
      <div data-slot="sidebar-gap" className="hidden w-(--sidebar-width) shrink-0 md:block" />
      <aside
        data-slot="sidebar-container"
        className="fixed inset-y-0 left-0 z-40 hidden flex-col items-center gap-2 border-r border-white/10 bg-[#11171b] py-6 md:flex"
        style={{ width: "var(--sidebar-width)" }}
      >
        <Gamepad2 className="mb-4 size-8 text-primary" aria-hidden />
        {LINKS.map(({ href, label, icon: Icon, title }) => (
          <Link
            key={href}
            href={href}
            title={title}
            className={`flex w-[84px] flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold ${
              pathname === href ? "bg-white/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </aside>

      <div className="min-w-0 flex-1">
        <header
          data-app-header
          className="sticky top-0 z-50 flex h-20 items-center gap-4 border-b border-white/10 bg-[#11171b]/95 px-4 backdrop-blur md:px-6"
        >
          <span className="text-lg font-black tracking-tight">Ape Church</span>
          <span className="hidden rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
            Template preview: site nav stand-in
          </span>
          <nav className="ml-auto flex items-center gap-1 md:hidden">
            {LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={`rounded px-2 py-1 text-xs ${pathname === href ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <span className="text-sm text-muted-foreground">25.00 APE</span>
            <span className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">Connected</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
