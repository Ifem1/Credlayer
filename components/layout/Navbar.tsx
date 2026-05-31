"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { BarChart2, Layers, ShieldCheck } from "lucide-react";

const OWNER = (process.env.NEXT_PUBLIC_OWNER_ADDRESS || "").toLowerCase();

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/apply", label: "Apply" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/treasury", label: "Treasury" },
];

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Layers className="h-4 w-4 text-white" />
            </div>
            Cred<span className="text-blue-400">Layer</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/risk"
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                pathname === "/risk"
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Risk
            </Link>
            {address && address.toLowerCase() === OWNER && (
              <Link
                href="/cdl-adm"
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  pathname === "/cdl-adm"
                    ? "bg-emerald-600/20 text-emerald-400"
                    : "text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-900/20"
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {address && <NotificationBell wallet={address} />}
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
