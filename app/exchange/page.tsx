"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Resource = {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  city: string | null;
  description: string | null;
  status: string;
  price: number | null;
  negotiation_percent: number | null;
  images: string[] | null;
};

export default function ExchangePage() {
  const supabase = useMemo(() => createClient(), []);

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "matches">("available");

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setResources(data as Resource[]);
      }

      setLoading(false);
    }

    loadData();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-[#06120e] px-4 py-10 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300/80">
              ARVENA EXCHANGE
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Circular Exchange Hub
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Connect supply and demand to divert materials from landfills, barter circular resources, and negotiate trades across your city.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/resources/new"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-6 text-sm font-semibold text-[#06120e] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-200"
            >
              + Offer Resource
            </Link>
          </div>
        </div>

        {/* =====================================================
            HOW IT WORKS HERO BANNER
        ===================================================== */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-emerald-300/15 bg-gradient-to-r from-emerald-300/[0.08] via-emerald-300/[0.02] to-transparent p-7">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300 font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white/90">Find or List Surplus</h4>
                <p className="mt-1 text-xs leading-5 text-white/40">
                  Register surplus organic waste, recyclables, or packaging materials you want to exchange.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300 font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white/90">Negotiate & Propose</h4>
                <p className="mt-1 text-xs leading-5 text-white/40">
                  Submit transparent requests with custom quantities and flexible negotiation parameters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300 font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white/90">Track Environmental Impact</h4>
                <p className="mt-1 text-xs leading-5 text-white/40">
                  Every completed exchange records $CO_2$ avoided and material diverted from municipal waste.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            TAB NAVIGATION
        ===================================================== */}
        <div className="mt-8 flex items-center gap-3 border-b border-white/[0.07] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("available")}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
              activeTab === "available"
                ? "bg-emerald-300/[0.12] text-emerald-200 border border-emerald-300/20"
                : "text-white/40 hover:text-white"
            }`}
          >
            Available for Exchange ({resources.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("matches")}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
              activeTab === "matches"
                ? "bg-emerald-300/[0.12] text-emerald-200 border border-emerald-300/20"
                : "text-white/40 hover:text-white"
            }`}
          >
            Smart Match Opportunities
          </button>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}
        <div className="mt-6">
          {activeTab === "available" ? (
            loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.02]" />
                ))}
              </div>
            ) : resources.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
                <p className="text-white/40">No exchange resources available right now.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-white/[0.04]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-0.5 text-[11px] font-medium capitalize text-emerald-300">
                          {resource.category}
                        </span>
                        <span className="text-xs text-white/30">📍 {resource.city || "Location"}</span>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-white/90">{resource.title}</h3>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/40">
                        {resource.description || "Available for circular trade or purchase."}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-white/[0.07] pt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/50">
                          Supply: <strong className="text-white">{resource.quantity} {resource.unit}</strong>
                        </span>
                        {resource.price && Number(resource.price) > 0 ? (
                          <span className="font-semibold text-emerald-300">
                            Rp{Number(resource.price).toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-emerald-300/80 font-medium">Free / Barter</span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          href={`/resources/${resource.id}`}
                          className="rounded-xl border border-white/10 py-2.5 text-center text-xs text-white/70 hover:bg-white/[0.04] hover:text-white transition"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/resources/${resource.id}/request`}
                          className="rounded-xl bg-emerald-300 py-2.5 text-center text-xs font-semibold text-[#06120e] hover:bg-emerald-200 transition"
                        >
                          Propose Exchange →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <div className="text-4xl opacity-30">⚡</div>
              <h3 className="mt-4 text-lg font-semibold">Smart Match Engine</h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-white/40">
                ARVENA matches registered supply with local business demand to automate circular trade proposals. Register your resources to receive automatic match suggestions.
              </p>
              <Link
                href="/resources/new"
                className="mt-6 inline-flex rounded-xl bg-emerald-300 px-6 py-3 text-xs font-semibold text-[#06120e] transition hover:bg-emerald-200"
              >
                + Register Resource for Matching
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}