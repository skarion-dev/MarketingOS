"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/marketing", label: "Dashboard" },
  { href: "/marketing/channels", label: "Channels" },
  { href: "/marketing/campaigns", label: "Campaigns" },
  { href: "/marketing/prospects", label: "Prospects" },
  { href: "/marketing/tasks", label: "Tasks" },
  { href: "/marketing/opportunities", label: "Opportunities" },
  { href: "/marketing/content", label: "Content" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <Link href="/marketing" className="font-semibold text-lg">
            Marketing OS
          </Link>
          <div className="flex gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
