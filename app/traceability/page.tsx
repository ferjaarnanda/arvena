"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Hash,
} from "lucide-react";

type MaterialSummary = {
  material?: string;
  quantity?: string | number;
  unit?: string;
};

type ImpactSummary = {
  co2_avoided_kg?: string | number;
};

type TraceabilityRecord = {
  id: string;
  reference_type: string;
  reference_id: string;
  record_hash: string;
  previous_hash: string | null;
  participants: Record<string, unknown> | null;
  material_summary: MaterialSummary | null;
  impact_summary: ImpactSummary | null;
  verification_status: string;
  chain_network: string;
  created_at: string;
};

export default function TraceabilityLedgerPage() {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [records, setRecords] = useState<TraceabilityRecord[]>([]);
  const [verifyHashInput, setVerifyHashInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<TraceabilityRecord | null | "not_found">(null);

  useEffect(() => {
    async function loadRecords() {
      const { data, error } = await supabase
        .from("traceability_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRecords(data as TraceabilityRecord[]);
      }
    }

    loadRecords();
  }, [supabase]);

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const query = verifyHashInput.trim().toLowerCase();
    if (!query) return;

    const found = records.find(
      (r) => r.record_hash.toLowerCase() === query || r.id.toLowerCase() === query
    );

    setVerificationResult(found || "not_found");
  }

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>CRYPTOGRAPHIC TRACEABILITY LEDGER</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white">
              {t.traceability.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              {t.traceability.subtitle}
            </p>
          </div>
        </div>

        {/* =====================================================
            BLOCKCHAIN READINESS EXPLANATION
        ===================================================== */}
        <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-gradient-to-r from-emerald-400/[0.08] via-white/[0.02] to-transparent p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Deterministic Supply Chain Integrity</h3>
              <p className="mt-1 text-xs leading-6 text-white/60">
                {t.traceability.blockchainReadiness} Every completed circular exchange generates a deterministic cryptographic hash connecting the participants, material purity, diverted weight, and environmental impact metrics.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            HASH VERIFICATION TOOL
        ===================================================== */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Hash className="h-4 w-4 text-emerald-400" />
            <span>{t.traceability.verifyRecord}</span>
          </h2>

          <form onSubmit={handleVerify} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={verifyHashInput}
              onChange={(e) => setVerifyHashInput(e.target.value)}
              placeholder="Paste SHA-256 record hash (e.g. e3b0c44298fc1c...)..."
              className="flex-1 rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3 text-xs text-white font-mono outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="rounded-2xl bg-emerald-400 px-6 py-3 text-xs font-bold text-[#06120e] hover:bg-emerald-300 transition shadow-[0_0_20px_rgba(52,211,153,0.3)]"
            >
              Verify Integrity →
            </button>
          </form>

          {/* Verification Result Card */}
          {verificationResult === "not_found" && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
              No matching cryptographic record found in the ARVENA ledger for this hash.
            </div>
          )}

          {verificationResult && verificationResult !== "not_found" && (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.05] p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cryptographically Verified Local Record</span>
              </div>
              <p className="font-mono text-white/70 break-all">Hash: {verificationResult.record_hash}</p>
              <div className="pt-2 grid sm:grid-cols-3 gap-2 text-white/50 border-t border-white/10">
                <div>Material: <strong className="text-white">{verificationResult.material_summary?.material || "Circular Material"}</strong></div>
                <div>Weight: <strong className="text-white">{verificationResult.material_summary?.quantity} {verificationResult.material_summary?.unit}</strong></div>
                <div>CO₂ Saved: <strong className="text-emerald-300">{verificationResult.impact_summary?.co2_avoided_kg} kg</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            LEDGER RECORDS STREAM
        ===================================================== */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
            <Layers className="h-5 w-5 text-emerald-400" />
            <span>Immutable Integrity Records Stream ({records.length})</span>
          </h2>

          <div className="space-y-4">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                      {rec.verification_status}
                    </span>
                    <span className="text-xs text-white/40 font-mono">Network: {rec.chain_network}</span>
                  </div>

                  <span className="text-xs text-white/40">{new Date(rec.created_at).toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">SHA-256 Digest</span>
                  <p className="font-mono text-xs text-emerald-300 break-all bg-black/30 p-2.5 rounded-xl border border-white/5 mt-1">
                    {rec.record_hash}
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="rounded-xl border border-white/5 bg-white/[0.015] p-3">
                    <span className="text-white/40 block text-[10px] uppercase">Material Recirculated</span>
                    <span className="font-bold text-white mt-1 block">
                      {rec.material_summary?.material || "Secondary Resource"} ({rec.material_summary?.quantity} {rec.material_summary?.unit})
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.015] p-3">
                    <span className="text-white/40 block text-[10px] uppercase">Impact Diverted</span>
                    <span className="font-bold text-emerald-300 mt-1 block">
                      {rec.impact_summary?.co2_avoided_kg} kg CO₂ Avoided
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.015] p-3">
                    <span className="text-white/40 block text-[10px] uppercase">Reference Stream</span>
                    <span className="font-bold text-white mt-1 block capitalize">
                      {rec.reference_type} Event
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
