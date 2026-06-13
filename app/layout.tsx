import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/layout/WalletProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SparkleCanvas } from "@/components/layout/SparkleCanvas";

export const metadata: Metadata = {
  title: "CredLayer — AI-Powered Under-Collateralized Lending",
  description:
    "Access capital using identity, reputation, and AI credit adjudication on GenLayer. No over-collateralization required.",
  keywords: ["DeFi", "lending", "credit", "GenLayer", "AI", "under-collateralized"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased" style={{ background: '#000000', color: '#FFFFFF' }}>
        <WalletProvider>
          <SparkleCanvas />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
