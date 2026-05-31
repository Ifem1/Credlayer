"use client";
import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { UserCheck, Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import type { KycStatus } from "@/types";

interface Props {
  wallet: string;
  kycStatus: KycStatus;
  onVerified?: () => void;
}

interface FileState {
  file: File | null;
  hash: string;
  preview: string | null;
  error: string;
}

const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.bmp,.tiff,.gif";
const MAX_MB = 10;

// Hash a file's raw bytes using SubtleCrypto — runs entirely in the browser
async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function FileUploadZone({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: FileState;
  onChange: (s: FileState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_MB * 1024 * 1024) {
        onChange({ file: null, hash: "", preview: null, error: `File exceeds ${MAX_MB} MB limit` });
        return;
      }
      // Generate preview for images
      let preview: string | null = null;
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }
      const hash = await hashFile(file);
      onChange({ file, hash, preview, error: "" });
    },
    [onChange]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function clear() {
    if (value.preview) URL.revokeObjectURL(value.preview);
    onChange({ file: null, hash: "", preview: null, error: "" });
    if (inputRef.current) inputRef.current.value = "";
  }

  const hasFile = !!value.file;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}

      {hasFile ? (
        // ── Uploaded state ──────────────────────────────────────────────────
        <div className="flex items-start gap-3 rounded-lg border border-emerald-700/50 bg-emerald-900/10 p-3">
          {value.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.preview}
              alt="preview"
              className="h-14 w-14 rounded object-cover border border-slate-700 shrink-0"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded border border-slate-700 bg-slate-800 shrink-0">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{value.file!.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {(value.file!.size / 1024).toFixed(1)} KB
            </p>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400 font-mono truncate">{value.hash.slice(0, 20)}…</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded p-1 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // ── Drop zone ───────────────────────────────────────────────────────
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
            px-4 py-6 cursor-pointer transition-colors
            ${dragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/60"
            }
          `}
        >
          <Upload className="h-6 w-6 text-slate-400" />
          <div className="text-center">
            <p className="text-sm text-slate-300">
              <span className="text-blue-400 font-medium">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              PDF, PNG, JPG, JPEG, WEBP, HEIC, BMP, TIFF, GIF — up to {MAX_MB} MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}

      {value.error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {value.error}
        </div>
      )}
    </div>
  );
}

const EMPTY: FileState = { file: null, hash: "", preview: null, error: "" };

export function IdentityVerificationPanel({ wallet, kycStatus, onVerified }: Props) {
  const [docType, setDocType] = useState("PASSPORT");
  const [docFile, setDocFile] = useState<FileState>(EMPTY);
  const [selfieFile, setSelfieFile] = useState<FileState>(EMPTY);
  const [addressFile, setAddressFile] = useState<FileState>(EMPTY);
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
    if (!docFile.hash || !selfieFile.hash || !addressFile.hash) {
      setError("Please upload all three documents before submitting.");
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
          document_hash: docFile.hash,
          selfie_hash: selfieFile.hash,
          proof_of_address_hash: addressFile.hash,
          wallet,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === "string" ? data.error : "Verification failed");
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

  const allUploaded = !!docFile.hash && !!selfieFile.hash && !!addressFile.hash;

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
          <div className="flex items-start gap-3 rounded-lg border border-yellow-700/40 bg-yellow-900/10 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Documents Under Review</p>
              <p className="text-sm text-slate-400 mt-0.5">
                Your documents are being verified. You will be notified once the review is complete — this typically takes a few moments.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm text-slate-400">
              Upload your identity documents below. Files are hashed locally in your browser
              — only the cryptographic hash is sent to the blockchain, never the file itself.
            </p>

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

            <FileUploadZone
              label="Identity Document"
              hint="Upload your passport, national ID, or driver's license"
              value={docFile}
              onChange={setDocFile}
            />

            <FileUploadZone
              label="Selfie / Photo"
              hint="A clear photo of yourself holding your ID document"
              value={selfieFile}
              onChange={setSelfieFile}
            />

            <FileUploadZone
              label="Proof of Address"
              hint="Bank statement, utility bill, or official letter dated within 3 months"
              value={addressFile}
              onChange={setAddressFile}
            />

            {/* Progress indicator */}
            <div className="flex gap-2">
              {[docFile, selfieFile, addressFile].map((f, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    f.hash ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500 -mt-3">
              {[docFile, selfieFile, addressFile].filter((f) => f.hash).length} of 3 documents uploaded
            </p>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-400/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={!allUploaded}
              className="w-full"
            >
              {allUploaded ? "Submit for Verification" : "Upload all 3 documents to continue"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
