"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
};

type DashboardData = {
  userEmail: string;
  profile: Profile | null;
  resourceCount: number;
  matchCount: number;
  totalImpact: number;
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      const {
        data: profile,
      } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const {
        count: resourceCount,
      } = await supabase
        .from("resources")
        .select("*", {
          count: "exact",
          head: true,
        });

      const {
        count: matchCount,
      } = await supabase
        .from("matches")
        .select("*", {
          count: "exact",
          head: true,
        });

      const {
        data: impacts,
      } = await supabase
        .from("impact_records")
        .select("*");

      const totalImpact =
        impacts?.reduce(
          (sum, item) =>
            sum +
            Number(
              item.amount ??
                item.quantity ??
                0
            ),
          0
        ) ?? 0;

      if (!mounted) {
        return;
      }

      setData({
        userEmail: user.email ?? "",
        profile: profile ?? null,
        resourceCount:
          resourceCount ?? 0,
        matchCount:
          matchCount ?? 0,
        totalImpact,
      });

      setLoading(false);
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06120e] text-white">
        <div className="flex flex-col items-center">

          <Image
            src="/arvena-marks.png"
            alt="ARVENA"
            width={72}
            height={72}
            className="h-14 w-14 object-contain"
          />

          <p className="mt-4 text-xs text-white/30">
            Loading ARVENA...
          </p>

        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06120e] px-5 py-10 text-white sm:px-6 sm:py-12">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="pointer-events-none absolute left-[-15%] top-[-20%] h-[700px] w-[1000px] rotate-[20deg] blur-[110px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(38,180,112,0.03) 20%, rgba(38,180,112,0.06) 42%, rgba(38,180,112,0.025) 70%, transparent 100%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.16)_100%)]" />

      <div className="relative mx-auto max-w-6xl">

        {/* =====================================================
            ARVENA BRAND
        ===================================================== */}

        <div className="border-b border-white/[0.07] pb-8">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            {/* =================================================
                LOCKUP UTAMA
            ================================================= */}

            <div>

              <div className="w-[250px] sm:w-[300px]">
                <Image
                  src="/arvena-lockup.png"
                  alt="ARVENA Connected City Ecosystem"
                  width={900}
                  height={320}
                  priority
                  className="h-auto w-full object-contain"
                />
              </div>

              <p className="mt-6 text-[9px] font-medium uppercase tracking-[0.24em] text-emerald-300/55">
                ARVENA DASHBOARD
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome,{" "}
                {data.profile?.full_name ||
                  "ARVENA user"}.
              </h1>

              <p className="mt-3 text-sm text-white/30">
                {data.userEmail}
              </p>

            </div>

            {/* =================================================
                DASHBOARD DESCRIPTION
            ================================================= */}

            <div className="max-w-sm lg:text-right">

              <p className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                Connected intelligence
              </p>

              <p className="mt-2 text-sm leading-6 text-white/30">
                Kelola resource, request,
                exchange, dan impact dari
                satu ruang ARVENA.
              </p>

            </div>

          </div>
        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">

          {/* RESOURCES */}

          <div className="group rounded-3xl border border-white/[0.08] bg-white/[0.018] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/15 hover:bg-white/[0.025]">

            <div className="text-xs uppercase tracking-[0.16em] text-white/25">
              Resources
            </div>

            <div className="mt-3 text-3xl font-semibold">
              {data.resourceCount}
            </div>

            <p className="mt-2 text-xs leading-5 text-white/25">
              Resource yang tersedia
              dalam ekosistem ARVENA.
            </p>

          </div>

          {/* MATCHES */}

          <div className="group rounded-3xl border border-white/[0.08] bg-white/[0.018] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/15 hover:bg-white/[0.025]">

            <div className="text-xs uppercase tracking-[0.16em] text-white/25">
              Smart Matches
            </div>

            <div className="mt-3 text-3xl font-semibold">
              {data.matchCount}
            </div>

            <p className="mt-2 text-xs leading-5 text-white/25">
              Koneksi resource yang
              berhasil ditemukan.
            </p>

          </div>

          {/* IMPACT */}

          <div className="group rounded-3xl border border-white/[0.08] bg-white/[0.018] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/15 hover:bg-white/[0.025]">

            <div className="text-xs uppercase tracking-[0.16em] text-white/25">
              Impact
            </div>

            <div className="mt-3 text-3xl font-semibold">
              {data.totalImpact} kg
            </div>

            <p className="mt-2 text-xs leading-5 text-white/25">
              Total impact yang
              tercatat pada ARVENA.
            </p>

          </div>

        </div>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

        <section className="mt-9">

          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/25">
            Quick Actions
          </p>

          <div className="mt-3 flex flex-wrap gap-3">

            <Link
              href="/resources"
              className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#06120e] transition hover:-translate-y-0.5 hover:bg-emerald-200"
            >
              Explore Resources
            </Link>

            <Link
              href="/resources/new"
              className="rounded-xl border border-white/[0.08] bg-white/[0.018] px-5 py-3 text-sm text-white/60 transition hover:border-emerald-300/20 hover:bg-emerald-300/[0.03] hover:text-white"
            >
              + Add Resource
            </Link>

            <Link
              href="/my-requests"
              className="rounded-xl border border-white/[0.08] bg-white/[0.018] px-5 py-3 text-sm text-white/60 transition hover:border-emerald-300/20 hover:bg-emerald-300/[0.03] hover:text-white"
            >
              My Requests
            </Link>

            <Link
              href="/resource-requests"
              className="rounded-xl border border-white/[0.08] bg-white/[0.018] px-5 py-3 text-sm text-white/60 transition hover:border-emerald-300/20 hover:bg-emerald-300/[0.03] hover:text-white"
            >
              Resource Requests
            </Link>

          </div>
        </section>

        {/* =====================================================
            ARVENA INTELLIGENCE CARD
        ===================================================== */}

        <section className="relative mt-10 overflow-hidden rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.022]">

          <div
            className="pointer-events-none absolute right-[-100px] top-[-100px] h-[320px] w-[320px] rounded-full blur-[100px]"
            style={{
              background:
                "rgba(16,185,129,0.055)",
            }}
          />

          <div className="relative p-7 sm:p-8">

            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

              <div className="max-w-2xl">

                <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-emerald-300/55">
                  Connected intelligence
                </p>

                <h2 className="mt-3 text-2xl font-medium tracking-tight text-white">
                  Your city. Your resources.
                  Your impact.
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/30">
                  Gunakan ARVENA untuk menemukan
                  resource, menghubungkan kebutuhan,
                  memahami impact, dan nantinya
                  menjelajahi GIS serta kecerdasan
                  kota melalui Cirra.
                </p>

              </div>

              <Link
                href="/explore"
                className="shrink-0 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.045] px-5 py-3 text-sm font-medium text-emerald-200 transition hover:border-emerald-300/25 hover:bg-emerald-300/[0.075]"
              >
                Explore ARVENA
              </Link>

            </div>

          </div>
        </section>

        {/* =====================================================
            BRAND FOOTER
        ===================================================== */}

        <div className="mt-10 pb-8">

          <div className="flex items-center gap-4">

            {/* LOGOGRAM */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              <Image
                src="/arvena-marks.png"
                alt="ARVENA"
                width={60}
                height={60}
                className="h-10 w-10 object-contain"
              />
            </div>

            {/* WORDMARK */}

            <div>

              <p className="text-sm font-semibold tracking-[0.16em] text-white/55">
                ARVENA
              </p>

              <p className="mt-0.5 text-[9px] tracking-[0.12em] text-emerald-300/40">
                Connected City Ecosystem
              </p>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}