"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hashString } from "@/lib/utils";
import { UserCheck, Upload } from "lucide-react";
import type { KycStatus } from "@/types";

interface Props {
  wallet: string;
  kycStatus: KycStatus;
  onVerified?: () => void;
}

export function IdentityVerificationPanel({ wallet, kycStatus, onVerified }: Props) {
  const [docType, setDocType] = useState("PASSPORT");
  const [docNumber, setDocNumber] = useState("");
  const [selfieFile, setSelfieFile] = useState("");
  const [addressDoc, setAddressDoc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const statusConfig: Record<KycStatus, { label: string; className: string }> = {
    PENDING: { label: "Not Started", className: "text-slate-400" },
    UNDER_REVIEW: { label: "Under Review", className: "text-yellow-400" },
    VERIFIED: { label: "Verified", className: "text-emerald-400" },
    REJECTED: { label: "Rejected", className: "text-red-400" },
  };
  const { label, className } = statusConfig[kycStatus] ?? statusConfig.PENDING;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docNumber || !selfieFile || !addressDoc) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: docType,
          document_hash: hashString(docNumber),
          selfie_hash: hashString(selfieFile),
          proof_of_address_hash: hashString(addressDoc),
          wallet,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onVerified?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (kycStatus === "VERIFIED") {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6">
          <UserCheck className="h-8 w-8 text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-400">Identity Verified</p>
            <p className="text-sm text-slate-400">Your KYC verification is complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Identity Verification
          <span className={`ml-auto text-sm font-normal ${className}`}>{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {kycStatus === "UNDER_REVIEW" ? (
          <p className="text-yellow-400 text-sm">Your documents are currently under review. You will be notified once verification is complete.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Document Type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              options={[
                { value: "PASSPORT", label: "Passport" },
                { value: "NATIONAL_ID", label: "National ID" },
                { value: "DRIVERS_LICENSE", label: "Driver's License" },
              ]}
            />
            <Input
              label="Document Number"
              placeholder="Enter document number"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              hint="Will be securely hashed before submission"
            />
            <Input
              label="Selfie Reference (URL or file ID)"
              placeholder="Selfie hash or reference"
              value={selfieFile}
              onChange={(e) => setSelfieFile(e.target.value)}
            />
            <Input
              label="Proof of Address Reference"
              placeholder="Address document reference"
              value={addressDoc}
              onChange={(e) => setAddressDoc(e.target.value)}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Submit for Verification
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
