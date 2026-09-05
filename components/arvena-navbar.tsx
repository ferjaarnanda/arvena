"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import CirraPanel from "./cirra-panel";
import { useLanguage } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import {
  Compass,
  Repeat,
  Users,
  Activity,
  User as UserIcon,
  Search,
  MapPin,
  Globe,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  type Province,
  type Regency,
  type District,
} from "@/lib/regions";

function IndonesiaFlag({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`rounded-full shadow-sm overflow-hidden shrink-0 ${className}`}>
      <rect width="32" height="16" fill="#e11d48" />
      <rect y="16" width="32" height="16" fill="#ffffff" />
      <circle cx="16" cy="16" r="15.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    </svg>
  );
}

function UsFlag({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`rounded-full shadow-sm overflow-hidden shrink-0 ${className}`}>
      <clipPath id="us-circle-flag">
        <circle cx="16" cy="16" r="16" />
      </clipPath>
      <g clipPath="url(#us-circle-flag)">
        <rect width="32" height="32" fill="#e11d48" />
        <path stroke="#ffffff" strokeWidth="2.46" d="M0 3.7h32M0 8.6h32M0 13.5h32M0 18.5h32M0 23.4h32M0 28.3h32" />
        <rect width="14" height="15" fill="#1e3a8a" />
        <circle cx="3.5" cy="4" r="1" fill="#fff" />
        <circle cx="7" cy="4" r="1" fill="#fff" />
        <circle cx="10.5" cy="4" r="1" fill="#fff" />
        <circle cx="5.25" cy="7.5" r="1" fill="#fff" />
        <circle cx="8.75" cy="7.5" r="1" fill="#fff" />
        <circle cx="3.5" cy="11" r="1" fill="#fff" />
        <circle cx="7" cy="11" r="1" fill="#fff" />
        <circle cx="10.5" cy="11" r="1" fill="#fff" />
      </g>
      <circle cx="16" cy="16" r="15.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    </svg>
  );
}

export default function ArvenaNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, toggleLocale, t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [isCirraOpen, setIsCirraOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);

  // Mobile contextual controls
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileLocationOpen, setIsMobileLocationOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");

  // Mobile location cascade
  const [mobileProvinces, setMobileProvinces] = useState<Province[]>([]);
  const [mobileRegencies, setMobileRegencies] = useState<Regency[]>([]);
  const [mobileDistricts, setMobileDistricts] = useState<District[]>([]);
  const [mobileSelectedProvince, setMobileSelectedProvince] = useState("");
  const [mobileSelectedCity, setMobileSelectedCity] = useState("");
  const [mobileSelectedDistrict, setMobileSelectedDistrict] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email });
      }
    }
    checkAuth();
  }, [supabase, pathname]);

  const navigation = useMemo(
    () => [
      { name: t.nav.explore, href: "/explore", icon: Compass },
      { name: t.nav.exchange, href: "/exchange", icon: Repeat },
      { name: t.nav.community, href: "/community", icon: Users },
      { name: t.nav.impact, href: "/impact", icon: Activity },
    ],
    [t]
  );

  const isResourceRoute = pathname.startsWith("/resources");
  const activeHref = isResourceRoute
    ? "/explore"
    : navigation.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      )?.href ?? null;

  const indicatorHref = hoveredHref ?? activeHref;

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  function handleMobileSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mobileSearchQuery.trim()) return;
    setIsMobileSearchOpen(false);
    const q = encodeURIComponent(mobileSearchQuery.trim());
    if (pathname.startsWith("/exchange")) {
      router.push(`/exchange?q=${q}`);
    } else if (pathname.startsWith("/community/events")) {
      router.push(`/community/events?q=${q}`);
    } else if (pathname.startsWith("/community")) {
      router.push(`/community?q=${q}`);
    } else {
      router.push(`/explore?q=${q}`);
    }
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] h-[68px] border-b border-emerald-300/[0.08] bg-[#040b08]/90 backdrop-blur-xl transition-colors">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent" />

        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* LEFT GROUP: BRAND LOGO + DESKTOP NAVIGATION (Shifted comfortably toward left) */}
          <div className="flex items-center gap-6 xl:gap-8">
            <Link href="/" className="group flex items-center gap-2 shrink-0">
              <div className="relative flex h-9 items-center justify-center transition-all duration-300 group-hover:opacity-90">
                <Image
                  src="/arvena-lockup.png"
                  alt="ARVENA — Connected City"
                  width={130}
                  height={32}
                  style={{ width: "auto", height: "32px" }}
                  priority
                />
              </div>
            </Link>

            {/* DESKTOP NAVIGATION */}
            <nav
              className="hidden lg:flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
              onMouseLeave={() => setHoveredHref(null)}
            >
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = indicatorHref === item.href;
                const isCurrent = activeHref === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onMouseEnter={() => setHoveredHref(item.href)}
                    className={`relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      isCurrent
                        ? "text-emerald-200 font-semibold"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-full border border-emerald-300/25 bg-emerald-300/[0.1] shadow-[0_0_12px_rgba(52,211,153,0.12)]" />
                    )}
                    <Icon className="relative z-10 h-3.5 w-3.5 opacity-80" />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* MOBILE SEARCH ICON BUTTON (lg:hidden) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                setIsMobileLocationOpen(false);
              }}
              title="Search"
              className={`flex h-9 w-9 items-center justify-center rounded-full border lg:hidden transition ${
                isMobileSearchOpen
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/[0.03] text-white/70 hover:text-white"
              }`}
            >
              <Search className="h-4 w-4" />
            </button>

            {/* MOBILE LOCATION ICON BUTTON (lg:hidden) */}
            <button
              type="button"
              onClick={async () => {
                const nextState = !isMobileLocationOpen;
                setIsMobileLocationOpen(nextState);
                setIsMobileSearchOpen(false);
                if (nextState && mobileProvinces.length === 0) {
                  const provs = await fetchProvinces();
                  setMobileProvinces(provs);
                }
              }}
              title="Filter Location"
              className={`flex h-9 w-9 items-center justify-center rounded-full border lg:hidden transition ${
                isMobileLocationOpen
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/[0.03] text-white/70 hover:text-white"
              }`}
            >
              <MapPin className="h-4 w-4" />
            </button>

            {/* 3-STATE LANGUAGE SWITCHER: Globe MIX -> ID Flag ID -> EN Flag EN */}
            <button
              type="button"
              onClick={toggleLocale}
              title={
                locale === "id"
                  ? "Bahasa Indonesia — Klik untuk English"
                  : locale === "en"
                  ? "English — Click for Mixed"
                  : "Mixed (ID+EN) — Click for Indonesian"
              }
              className="group relative flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-white/80 transition-all duration-200 hover:border-emerald-300/30 hover:bg-white/[0.06] hover:text-white"
            >
              {locale === "id" ? (
                <IndonesiaFlag className="h-4 w-4 flex-shrink-0" />
              ) : locale === "en" ? (
                <UsFlag className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Globe className="h-4 w-4 flex-shrink-0 text-emerald-300/90" />
              )}
              <span className="leading-none">
                {locale === "id" ? "ID" : locale === "en" ? "EN" : "MIX"}
              </span>
            </button>

            {/* Cirra BUTTON */}
            <button
              type="button"
              onClick={() => setIsCirraOpen(true)}
              className="group relative flex h-9 items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/[0.1] px-3.5 text-xs font-semibold text-emerald-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/50 hover:bg-emerald-300/[0.18] hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]"
            >
              <div className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full">
                <Image
                  src="/cirra-logo.png"
                  alt="CIRRA"
                  width={16}
                  height={16}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="hidden sm:inline">CIRRA</span>
            </button>

            {/* USER PROFILE / AUTH */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 text-xs font-medium text-white/80 transition hover:border-emerald-300/30 hover:bg-white/[0.06] hover:text-white"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-emerald-300" />
                  <span>{t.nav.dashboard}</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 transition hover:border-emerald-300/30 hover:text-white"
                  title="Profile"
                >
                  <UserIcon className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-white transition hover:border-emerald-300/30 hover:bg-white/[0.06]"
              >
                {t.nav.signIn}
              </Link>
            )}
          </div>
        </div>

        {/* MOBILE CONTEXTUAL SEARCH EXPANSION (lg:hidden) */}
        {isMobileSearchOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[68px] border-b border-emerald-300/15 bg-[#040b08]/98 px-4 py-3 shadow-2xl backdrop-blur-2xl">
            <form onSubmit={handleMobileSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  placeholder={
                    pathname.startsWith("/exchange")
                      ? (locale === "id" ? "Cari barang pertukaran / barter..." : "Search exchange & barter...")
                      : pathname.startsWith("/community/events")
                      ? (locale === "id" ? "Cari kegiatan & workshop..." : "Search circular events...")
                      : pathname.startsWith("/community")
                      ? (locale === "id" ? "Cari komunitas & bank sampah..." : "Search community hubs...")
                      : (locale === "id" ? "Cari resource sirkular..." : "Search circular resources...")
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#2A835F] border border-[#12544F] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#349e73]"
              >
                {locale === "id" ? "Cari" : "Search"}
              </button>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-2 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* MOBILE LOCATION FILTER EXPANSION (lg:hidden) */}
        {isMobileLocationOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[68px] border-b border-emerald-300/15 bg-[#040b08]/98 px-4 py-4 shadow-2xl backdrop-blur-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <MapPin className="h-3.5 w-3.5" />
                <span>{locale === "id" ? "Filter Wilayah" : "Filter Region"}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileLocationOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {/* Province */}
              <select
                value={mobileSelectedProvince}
                onChange={async (e) => {
                  const val = e.target.value;
                  setMobileSelectedProvince(val);
                  setMobileSelectedCity("");
                  setMobileSelectedDistrict("");
                  setMobileRegencies([]);
                  setMobileDistricts([]);
                  if (val) {
                    const regs = await fetchRegencies(val);
                    setMobileRegencies(regs);
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 [&>option]:bg-[#0b1d17] [&>option]:text-white"
              >
                <option value="" className="bg-[#0b1d17] text-white">
                  {locale === "id" ? "Semua Provinsi" : "All Provinces"}
                </option>
                {mobileProvinces.map((p) => (
                  <option key={p.code} value={p.code} className="bg-[#0b1d17] text-white">{p.name}</option>
                ))}
              </select>

              {/* City */}
              <select
                value={mobileSelectedCity}
                onChange={async (e) => {
                  const val = e.target.value;
                  setMobileSelectedCity(val);
                  setMobileSelectedDistrict("");
                  setMobileDistricts([]);
                  if (val) {
                    const dists = await fetchDistricts(val);
                    setMobileDistricts(dists);
                  }
                }}
                disabled={!mobileSelectedProvince}
                className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-40 [&>option]:bg-[#0b1d17] [&>option]:text-white"
              >
                <option value="" className="bg-[#0b1d17] text-white">
                  {locale === "id" ? "Semua Kota / Kabupaten" : "All Cities"}
                </option>
                {mobileRegencies.map((r) => (
                  <option key={r.code} value={r.code} className="bg-[#0b1d17] text-white">{r.name}</option>
                ))}
              </select>

              {/* District */}
              <select
                value={mobileSelectedDistrict}
                onChange={(e) => setMobileSelectedDistrict(e.target.value)}
                disabled={!mobileSelectedCity}
                className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-40 [&>option]:bg-[#0b1d17] [&>option]:text-white"
              >
                <option value="" className="bg-[#0b1d17] text-white">
                  {locale === "id" ? "Semua Kecamatan" : "All Districts"}
                </option>
                {mobileDistricts.map((d) => (
                  <option key={d.code} value={d.code} className="bg-[#0b1d17] text-white">{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMobileSelectedProvince("");
                  setMobileSelectedCity("");
                  setMobileSelectedDistrict("");
                  setIsMobileLocationOpen(false);
                  router.push(pathname);
                }}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileLocationOpen(false);
                  const params = new URLSearchParams();
                  if (mobileSelectedProvince) params.set("province", mobileSelectedProvince);
                  if (mobileSelectedCity) params.set("city", mobileSelectedCity);
                  if (mobileSelectedDistrict) params.set("district", mobileSelectedDistrict);
                  const dest = pathname.startsWith("/resources") || pathname.startsWith("/exchange") || pathname.startsWith("/community")
                    ? pathname
                    : "/explore";
                  const qs = params.toString();
                  router.push(qs ? `${dest}?${qs}` : dest);
                }}
                className="rounded-xl bg-[#2A835F] border border-[#12544F] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#349e73]"
              >
                {locale === "id" ? "Terapkan" : "Apply"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* CIRRA SIDE PANEL */}
      <CirraPanel isOpen={isCirraOpen} onClose={() => setIsCirraOpen(false)} />

      {/* MOBILE BOTTOM NAVIGATION — fixed, lg:hidden */}
      <nav className="fixed bottom-0 inset-x-0 z-[100] lg:hidden border-t border-emerald-300/[0.08] bg-[#040b08]/95 backdrop-blur-xl">
        {/* Gradient line at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent" />
        <div className="grid grid-cols-5 h-16 safe-area-inset-bottom">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-emerald-300"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-300" : "text-white/40"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          {/* Account / Profile Button */}
          <Link
            href={user ? "/profile" : "/auth/login"}
            className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
              pathname.startsWith("/profile") || pathname.startsWith("/dashboard")
                ? "text-emerald-300"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <UserIcon className={`h-5 w-5 ${pathname.startsWith("/profile") || pathname.startsWith("/dashboard") ? "text-emerald-300" : "text-white/40"}`} />
            <span>{user ? t.nav.profile ?? "Akun" : t.nav.signIn}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
