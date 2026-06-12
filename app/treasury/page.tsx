"use client";
import { useEffect, useState } from "react";
import { TreasuryPanel } from "@/components/dashboard/TreasuryPanel";
import type { Treasury, ProtocolFees } from "@/types";

export default function TreasuryPage() {
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [fees, setFees] = useState<ProtocolFees | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/treasury")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTreasury(d.data.treasury);
          setFees(d.data.protocol_fees);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div
          className="h-10 w-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(252,163,17,0.2)", borderTopColor: "#FCA311" }}
        />
      </div>
    );
  }

  if (!treasury || !fees) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center" style={{ color: "#9ca3af" }}>
        Unable to load treasury data. Ensure GenLayer is running.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Manrope" }}>
      {/* Hero */}
      <section
        className="relative px-4 pt-20 pb-16"
        style={{
          background: "linear-gradient(180deg, rgba(20,33,61,0.5) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(252,163,17,0.1)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(252,163,17,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-5xl">
          <div
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs"
            style={{ background: "rgba(252,163,17,0.08)", border: "1px solid rgba(252,163,17,0.25)", color: "#FCA311", fontWeight: 600, letterSpacing: "0.08em" }}
          >
            ⬡ REAL-TIME RESERVES
          </div>
          <h1
            style={{
              fontFamily: "Space Grotesk", fontWeight: 700,
              fontSize: "clamp(36px,5vw,56px)", color: "#FFFFFF", lineHeight: 1.1, marginBottom: 12,
            }}
          >
            Protocol{" "}
            <span style={{ color: "#FCA311" }}>Treasury</span>
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 16, maxWidth: 500, lineHeight: 1.7 }}>
            Institutional-grade asset management and liquidity reserves secured by decentralized AI protocols.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-14">
        <TreasuryPanel treasury={treasury} fees={fees} />
      </div>
    </div>
  );
}
