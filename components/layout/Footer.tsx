import Link from "next/link";

export function Footer() {
  return (
    <footer
      style={{
        background: "#000",
        borderTop: "1px solid rgba(252,163,17,0.15)",
        marginTop: "auto",
      }}
    >
      <style>{`
        .footer-link { color: #9ca3af; font-size: 13px; display: block; transition: color 0.2s; text-decoration: none; }
        .footer-link:hover { color: #FCA311; }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "#FCA311" }}
              >
                <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 12, color: "#000" }}>CL</span>
              </div>
              <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, color: "#FCA311" }}>CredLayer</span>
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
              AI-powered under-collateralized lending on GenLayer. Building the future of decentralized credit.
            </p>
          </div>

          {/* Protocol */}
          <div>
            <p style={{ fontFamily: "Manrope", fontWeight: 600, fontSize: 13, color: "#FCA311", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Protocol</p>
            <div className="space-y-2">
              <Link href="/explore" className="footer-link">Lending Pools</Link>
              <Link href="/treasury" className="footer-link">Treasury</Link>
              <Link href="/risk" className="footer-link">Risk Analytics</Link>
            </div>
          </div>

          {/* Borrowers */}
          <div>
            <p style={{ fontFamily: "Manrope", fontWeight: 600, fontSize: 13, color: "#FCA311", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Borrowers</p>
            <div className="space-y-2">
              <Link href="/apply" className="footer-link">Apply for Loan</Link>
              <Link href="/dashboard" className="footer-link">My Dashboard</Link>
            </div>
          </div>

          {/* Lenders */}
          <div>
            <p style={{ fontFamily: "Manrope", fontWeight: 600, fontSize: 13, color: "#FCA311", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Lenders</p>
            <div className="space-y-2">
              <Link href="/explore" className="footer-link">Browse Pools</Link>
              <Link href="/dashboard/lender" className="footer-link">Lender Dashboard</Link>
            </div>
          </div>
        </div>

        {/* Accent line */}
        <div className="accent-line mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p style={{ fontSize: 12, color: "#4b5563" }}>© 2026 CredLayer Protocol. GenLayer source of truth.</p>
          <p style={{ fontSize: 12, color: "#4b5563" }}>
            Powered by{" "}
            <span style={{ color: "#FCA311" }}>GenLayer</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
