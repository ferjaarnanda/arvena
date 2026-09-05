"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/context";
import {
  Compass,
  Repeat,
  Users,
  Calendar,
  Activity,
  Radio,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Leaf,
  Recycle,
  Layers,
  Cpu,
  CheckCircle2,
  Lock,
  Globe,
  MapPin,
  Scale,
} from "lucide-react";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#092328] text-white overflow-hidden selection:bg-emerald-400/20 selection:text-emerald-200">
      {/* =====================================================
          1. HERO SECTION WITH ATMOSPHERIC GLOW
      ===================================================== */}
      <section className="relative px-4 pt-16 pb-24 sm:px-6 sm:pt-28 sm:pb-32 lg:px-8">
        {/* Atmospheric beam — soft green from upper-left */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-[600px] w-[900px] -translate-x-1/4 -translate-y-1/4 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 20% 20%, rgba(18,84,79,0.7) 0%, rgba(42,131,95,0.2) 45%, transparent 75%)",
            filter: "blur(80px)",
          }}
        />
        {/* Secondary soft glow center */}
        <div
          className="pointer-events-none absolute left-1/3 top-1/3 h-[400px] w-[600px] opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(42,131,95,0.5) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.landing.heroBadge}</span>
          </div>

          {/* Main Headline — refined scale */}
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.5rem] leading-[1.15] text-white">
            {t.landing.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
            {t.landing.heroSubtitle}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explore"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-2xl bg-[#2A835F] border border-[#12544F] px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(42,131,95,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#32a070] hover:shadow-[0_6px_24px_rgba(42,131,95,0.5)]"
            >
              <Compass className="h-4 w-4" />
              <span>{t.landing.ctaExplore}</span>
            </Link>

            <Link
              href="/community"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/90 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              <Users className="h-4 w-4 text-emerald-400" />
              <span>{t.landing.ctaCommunity}</span>
            </Link>
          </div>

          {/* Ecosystem Teaser — 3 short value props, NO fake numbers */}
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-white/[0.07] pt-10">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
              <Layers className="h-6 w-6 text-emerald-400 opacity-80" />
              <span className="text-sm font-semibold text-white/90">Circular Marketplace</span>
              <span className="text-xs text-white/40 text-center">Browse, list & exchange surplus materials</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
              <Users className="h-6 w-6 text-emerald-400 opacity-80" />
              <span className="text-sm font-semibold text-white/90">Community Hubs</span>
              <span className="text-xs text-white/40 text-center">Build local circular economy groups</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
              <Activity className="h-6 w-6 text-emerald-400 opacity-80" />
              <span className="text-sm font-semibold text-white/90">Impact Tracking</span>
              <span className="text-xs text-white/40 text-center">Measure & log your CO₂ avoidance</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          2. THE PROBLEM VS ARVENA SOLUTION
      ===================================================== */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 border-t border-white/[0.06] bg-[#07130f]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              MUNICIPAL CIRCULAR CHALLENGE
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
              Over 60% of Municipal Waste is Reusable Secondary Material
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/50">
              Coffee grounds, agricultural husks, factory textile scraps, and clean plastics are discarded daily because generators lack automated local matching with recyclers and creators.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-8">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-lg mb-6">
                ✕
              </div>
              <h3 className="text-lg font-bold text-white">Linear Landfill Overflow</h3>
              <p className="mt-2 text-xs leading-6 text-white/50">
                Secondary resources are mixed with municipal refuse, releasing methane and overwhelming city waste management facilities.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.03] p-8">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg mb-6">
                !
              </div>
              <h3 className="text-lg font-bold text-white">Fragmented Local Supply</h3>
              <p className="mt-2 text-xs leading-6 text-white/50">
                Artisans, urban farmers, and composters struggle to find reliable nearby supplies of organic or packaging materials.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/[0.06] p-8 shadow-[0_0_30px_rgba(52,211,153,0.1)]">
              <div className="h-10 w-10 rounded-2xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-lg mb-6">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white">ARVENA Connected Loop</h3>
              <p className="mt-2 text-xs leading-6 text-white/60">
                Automated location-based matchmaking, real-time IoT weighing nodes, community hubs, and verified CO₂ reduction tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          3. 6 CORE PILLARS OF ARVENA
      ===================================================== */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/[0.06] bg-[#040b08]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              INTEGRATED ARCHITECTURE
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
              {t.landing.pillarTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/50">
              {t.landing.pillarSubtitle}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1: Marketplace */}
            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{t.landing.p1Title}</h3>
              <p className="mt-3 text-xs leading-6 text-white/50">{t.landing.p1Desc}</p>
              <Link
                href="/explore"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300"
              >
                <span>{t.nav.explore}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Pillar 2: Community Hub */}
            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{t.landing.p2Title}</h3>
              <p className="mt-3 text-xs leading-6 text-white/50">{t.landing.p2Desc}</p>
              <Link
                href="/community"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300"
              >
                <span>{t.nav.community}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Pillar 3: Exchange */}
            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{t.landing.p3Title}</h3>
              <p className="mt-3 text-xs leading-6 text-white/50">{t.landing.p3Desc}</p>
              <Link
                href="/exchange"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300"
              >
                <span>{t.nav.exchange}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Pillar 4: CIRRA AI */}
            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{t.landing.p4Title}</h3>
              <p className="mt-3 text-xs leading-6 text-white/50">{t.landing.p4Desc}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span>Available via Ask CIRRA in Top Navbar</span>
              </span>
            </div>

            {/* Pillar 5: IoT Network */}
            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <Radio className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{t.landing.p5Title}</h3>
              <p className="mt-3 text-xs leading-6 text-white/50">{t.landing.p5Desc}</p>
              <Link
                href="/iot"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300"
              >
                <span>{t.nav.iot}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Pillar 6: Cryptographic Traceability */}
            <div className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{t.landing.p6Title}</h3>
              <p className="mt-3 text-xs leading-6 text-white/50">{t.landing.p6Desc}</p>
              <Link
                href="/traceability"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300"
              >
                <span>{t.nav.traceability}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          4. CTA BANNER
      ===================================================== */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 border-t border-white/[0.06] bg-gradient-to-b from-[#06120e] to-[#040b08]">
        <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-400/[0.1] via-white/[0.02] to-transparent p-8 sm:p-12 text-center shadow-[0_0_40px_rgba(52,211,153,0.15)]">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Connect Your City to the Circular Economy?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60">
            Start diverting materials, collaborating with local hubs, and logging verified carbon avoidance today.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explore"
              className="w-full sm:w-auto rounded-2xl bg-emerald-400 px-8 py-3.5 text-sm font-bold text-[#040b08] hover:bg-emerald-300 transition shadow-[0_0_25px_rgba(52,211,153,0.3)]"
            >
              Explore Marketplace Now
            </Link>
            <Link
              href="/resources/new"
              className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition"
            >
              + List Surplus Resource
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          5. FOOTER
      ===================================================== */}
      <footer className="border-t border-white/[0.08] bg-[#020705] px-4 py-12 sm:px-6 lg:px-8 text-white/50 text-xs">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/arvena-marks.png"
              alt="ARVENA Mark"
              width={24}
              height={24}
              className="object-contain opacity-80"
            />
            <span className="text-sm font-bold text-white tracking-wider">ARVENA</span>
            <span>— Connected City Ecosystem</span>
          </div>

          <div className="flex flex-wrap gap-6 text-white/40">
            <Link href="/explore" className="hover:text-emerald-300 transition">Marketplace</Link>
            <Link href="/exchange" className="hover:text-emerald-300 transition">Exchange</Link>
            <Link href="/community" className="hover:text-emerald-300 transition">Communities</Link>
            <Link href="/community/events" className="hover:text-emerald-300 transition">Events</Link>
            <Link href="/impact" className="hover:text-emerald-300 transition">Impact GIS</Link>
            <Link href="/iot" className="hover:text-emerald-300 transition">IoT Network</Link>
            <Link href="/traceability" className="hover:text-emerald-300 transition">Traceability</Link>
          </div>

          <p>© {new Date().getFullYear()} ARVENA. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}