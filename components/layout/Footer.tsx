import Link from "next/link";
import { Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-100">CredLayer</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI-powered under-collateralized lending on GenLayer.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-3">Protocol</p>
            <div className="space-y-2">
              {[
                { href: "/explore", label: "Lending Pools" },
                { href: "/treasury", label: "Treasury" },
                { href: "/risk", label: "Risk Analytics" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-3">Borrowers</p>
            <div className="space-y-2">
              {[
                { href: "/apply", label: "Apply for Loan" },
                { href: "/dashboard", label: "My Dashboard" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-3">Lenders</p>
            <div className="space-y-2">
              {[
                { href: "/explore", label: "Browse Pools" },
                { href: "/dashboard/lender", label: "Lender Dashboard" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-600">© 2026 CredLayer Protocol. GenLayer source of truth.</p>
          <p className="text-xs text-slate-600">Powered by GenLayer</p>
        </div>
      </div>
    </footer>
  );
}
