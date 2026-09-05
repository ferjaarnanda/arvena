"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import {
  Search,
  MapPin,
  Filter,
  Plus,
  SlidersHorizontal,
  Layers,
  Leaf,
  Recycle,
  FileText,
  Wrench,
  Cpu,
  Apple,
  Shirt,
  Package,
  Sparkles,
  ArrowUpRight,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { rankAndFilterResources, type SearchableResource } from "@/lib/search";
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  type Province,
  type Regency,
  type District,
} from "@/lib/regions";

export default function ExplorePage() {
  const { t, locale } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [rawResources, setRawResources] = useState<SearchableResource[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);

  // Cascading Location state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const CATEGORIES = useMemo(
    () => [
      { id: "all", label: t.categories.all, icon: Layers },
      { id: "organic", label: t.categories.organic, icon: Leaf },
      { id: "plastic", label: t.categories.plastic, icon: Recycle },
      { id: "paper", label: t.categories.paper, icon: FileText },
      { id: "metal", label: t.categories.metal, icon: Wrench },
      { id: "electronic", label: t.categories.electronic, icon: Cpu },
      { id: "food", label: t.categories.food, icon: Apple },
      { id: "textile", label: t.categories.textile, icon: Shirt },
      { id: "other", label: t.categories.other, icon: Package },
    ],
    [t]
  );

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRawResources(data as SearchableResource[]);
      }

      const provs = await fetchProvinces();
      setProvinces(provs);

      setLoading(false);
    }

    loadInitial();
  }, [supabase]);

  // Province change -> fetch regencies
  const handleProvinceChange = async (provCode: string) => {
    setSelectedProvince(provCode);
    setSelectedCity("");
    setSelectedDistrict("");
    setRegencies([]);
    setDistricts([]);
    if (provCode && provCode !== "all") {
      const regs = await fetchRegencies(provCode);
      setRegencies(regs);
    }
  };

  // City change -> fetch districts
  const handleCityChange = async (cityCode: string) => {
    setSelectedCity(cityCode);
    setSelectedDistrict("");
    setDistricts([]);
    if (cityCode && cityCode !== "all") {
      const dists = await fetchDistricts(cityCode);
      setDistricts(dists);
    }
  };

  const activeLocationLabel = useMemo(() => {
    const parts = [];
    if (selectedDistrict) {
      const d = districts.find((item) => item.code === selectedDistrict);
      if (d) parts.push(d.name);
    }
    if (selectedCity) {
      const c = regencies.find((item) => item.code === selectedCity);
      if (c) parts.push(c.name);
    }
    if (selectedProvince && !selectedCity) {
      const p = provinces.find((item) => item.code === selectedProvince);
      if (p) parts.push(p.name);
    }
    return parts.join(", ") || t.common.all;
  }, [selectedProvince, selectedCity, selectedDistrict, provinces, regencies, districts, t]);

  const filteredResources = useMemo(() => {
    // Extract name for search matching
    const provName = provinces.find((p) => p.code === selectedProvince)?.name;
    const cityName = regencies.find((r) => r.code === selectedCity)?.name;
    const distName = districts.find((d) => d.code === selectedDistrict)?.name;

    return rankAndFilterResources(rawResources, {
      query: searchQuery,
      category: selectedCategory,
      province: provName,
      city: cityName,
      district: distName,
    });
  }, [rawResources, searchQuery, selectedCategory, selectedProvince, selectedCity, selectedDistrict, provinces, regencies, districts]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedProvince !== "" ||
    selectedCity !== "" ||
    selectedDistrict !== "";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedProvince("");
    setSelectedCity("");
    setSelectedDistrict("");
    setRegencies([]);
    setDistricts([]);
  };

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <Package className="h-3.5 w-3.5" />
              <span>{t.explore.badge || "ARVENA MARKETPLACE"}</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white">
              {t.explore.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              {t.explore.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/resources/new"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-6 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#349e73]"
            >
              <Plus className="h-4 w-4" />
              <span>{t.explore.addResource}</span>
            </Link>
          </div>
        </div>

        {/* =====================================================
            ADVANCED SEARCH & FILTER CONTROLS
        ===================================================== */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Intelligent Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.explore.searchPlaceholder}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pl-11 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-emerald-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(52,211,153,0.1)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white transition"
                >
                  {locale === "id" ? "Hapus" : "Clear"}
                </button>
              )}
            </div>

            {/* Location Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowLocationDrawer(!showLocationDrawer)}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-xs font-semibold transition ${
                selectedProvince || selectedCity
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                  : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>{activeLocationLabel !== t.common.all ? activeLocationLabel : t.common.location}</span>
              <SlidersHorizontal className="h-3 w-3 opacity-60 ml-1" />
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3.5 text-xs font-medium text-red-300 hover:bg-red-400/10 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{locale === "id" ? "Reset" : "Reset"}</span>
              </button>
            )}
          </div>

          {/* Cascading Location Filter Drawer */}
          {showLocationDrawer && (
            <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">
                    {locale === "id" ? `Filter ${t.common.location}` : `${t.common.location} Filter`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationDrawer(false)}
                  className="text-xs text-white/40 hover:text-white"
                >
                  {locale === "id" ? "✕ Tutup" : "✕ Close"}
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {/* Province */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/60">
                    {t.common.province}
                  </label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                  >
                    <option value="" className="bg-[#0b1d17] text-white">{t.common.allProvinces}</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code} className="bg-[#0b1d17] text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/60">
                    {t.common.city}
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={!selectedProvince}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-40 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                  >
                    <option value="" className="bg-[#0b1d17] text-white">{t.common.allCities}</option>
                    {regencies.map((r) => (
                      <option key={r.code} value={r.code} className="bg-[#0b1d17] text-white">
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/60">
                    {t.common.district}
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedCity}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-40 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                  >
                    <option value="" className="bg-[#0b1d17] text-white">{t.common.allDistricts}</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code} className="bg-[#0b1d17] text-white">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    active
                      ? "border border-emerald-400/40 bg-emerald-400/15 font-semibold text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                      : "border border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-emerald-300" : "opacity-60"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =====================================================
            RESOURCES GRID
        ===================================================== */}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/[0.02]"
                />
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.015] p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-emerald-400">
                <Package className="h-7 w-7 opacity-60" />
              </div>
              <p className="mt-4 text-lg font-semibold">{t.common.noResults}</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
                {hasActiveFilters
                  ? t.common.tryAdjusting
                  : t.explore.emptySubtitle || "Be the first contributor to list a circular surplus material in ARVENA."}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.06] hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t.explore.resetFilters || "Reset All Filters"}</span>
                </button>
              ) : (
                <Link
                  href="/resources/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#349e73]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t.explore.addResource}</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => {
                const isOwner = resource.owner_id === userId;
                const images = resource.images || [];
                const price = Number(resource.price) || 0;
                const nego = Number(resource.negotiation_percent) || 0;
                const minPrice = price > 0 && nego > 0 ? Math.round(price * (1 - nego / 100)) : price;

                // Category display (including custom "Other" type)
                const categoryLabel =
                  resource.category === "other" && resource.custom_category
                    ? resource.custom_category
                    : t.categories[resource.category as keyof typeof t.categories] || resource.category;

                // Location display: District, City, Province
                const locationDisplay = [resource.district, resource.city || resource.province]
                  .filter(Boolean)
                  .join(", ") || "Indonesia";

                return (
                  <div
                    key={resource.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
                  >
                    {/* PHOTO PREVIEW */}
                    <Link href={`/resources/${resource.id}`} className="relative block h-52 w-full overflow-hidden bg-black/40">
                      {images.length > 0 ? (
                        <>
                          <img
                            src={images[0]}
                            alt={resource.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#092328] via-transparent to-transparent opacity-80" />
                          <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-0.5 text-[10px] text-white/80 backdrop-blur-md">
                            {images.length} {t.explore.photosCount || "photos"}
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center bg-white/[0.01]">
                          <Package className="h-8 w-8 text-white/20" />
                        </div>
                      )}

                      {/* Floating Category Badge */}
                      <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-[#092328]/80 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
                          <Leaf className="h-3 w-3" />
                          <span className="capitalize">{categoryLabel}</span>
                        </span>
                      </div>
                    </Link>

                    {/* CARD BODY */}
                    <div className="flex flex-1 flex-col p-6">
                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400/80" />
                        <span className="truncate">{locationDisplay}</span>
                      </div>

                      {/* Title */}
                      <Link
                        href={`/resources/${resource.id}`}
                        className="mt-3 block text-lg font-bold text-white transition hover:text-emerald-200 line-clamp-1"
                      >
                        {resource.title}
                      </Link>

                      {/* Description */}
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/50">
                        {resource.description || (locale === "id" ? "Tidak ada deskripsi." : "No description provided.")}
                      </p>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Price & Quantity Stats */}
                      <div className="mt-6 border-t border-white/[0.07] pt-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="text-[11px] text-white/40 block">
                              {locale === "id" ? "Jumlah Tersedia" : "Available Quantity"}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {resource.quantity} {resource.unit}
                            </span>
                          </div>

                          <div className="text-right">
                            {price > 0 ? (
                              <>
                                <p className="text-sm font-bold text-emerald-300">
                                  Rp{price.toLocaleString("id-ID")}
                                  <span className="text-[10px] font-normal text-white/40"> / {resource.unit}</span>
                                </p>
                                {nego > 0 && (
                                  <p className="text-[10px] text-white/40">
                                    Nego: Rp{minPrice.toLocaleString("id-ID")}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                                {t.common.free}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-5">
                        {isOwner ? (
                          <Link
                            href={`/resources/${resource.id}`}
                            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-center text-xs font-semibold text-white/70 hover:border-emerald-400/30 hover:text-white transition"
                          >
                            <span>{t.explore.manageYourResource}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/resources/${resource.id}`}
                              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-center text-xs font-semibold text-white/70 hover:bg-white/[0.05] hover:text-white transition"
                            >
                              {t.common.viewDetails}
                            </Link>

                            <Link
                              href={`/resources/${resource.id}/request`}
                              className="flex items-center justify-center gap-1 rounded-xl bg-emerald-400 border border-emerald-300/40 py-2.5 text-center text-xs font-bold text-[#092328] hover:bg-emerald-300 transition shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                            >
                              <span>{t.explore.requestResource}</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}