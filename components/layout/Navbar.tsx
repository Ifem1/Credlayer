"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { BarChart2, ShieldCheck } from "lucide-react";

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
    <nav
      className="sticky top-0 z-40"
      style={{
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(252,163,17,0.15)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#FCA311", boxShadow: "0 0 16px #FCA31160" }}
            >
              <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 14, color: "#000" }}>CL</span>
            </div>
            <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 18, color: "#FCA311" }}>
              CredLayer
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm font-medium transition-all duration-200"
                  style={{
                    fontFamily: "Manrope",
                    color: active ? "#FCA311" : "#E5E5E5",
                    borderBottom: active ? "2px solid #FCA311" : "2px solid transparent",
                    letterSpacing: "0.02em",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/risk"
              className="px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
              style={{
                fontFamily: "Manrope",
                color: pathname === "/risk" ? "#FCA311" : "#E5E5E5",
                borderBottom: pathname === "/risk" ? "2px solid #FCA311" : "2px solid transparent",
                letterSpacing: "0.02em",
              }}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Risk
            </Link>
            {address && address.toLowerCase() === OWNER && (
              <Link
                href="/cdl-adm"
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                )}
                style={{
                  fontFamily: "Manrope",
                  color: pathname === "/cdl-adm" ? "#00F5A0" : "rgba(0,245,160,0.6)",
                  borderBottom: pathname === "/cdl-adm" ? "2px solid #00F5A0" : "2px solid transparent",
                }}
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
