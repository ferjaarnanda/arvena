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
  created_at: string;
};

const CATEGORIES = [
  { id: "all", label: "All Materials", icon: "✨" },
  { id: "organic", label: "Organic", icon: "🌿" },
  { id: "plastic", label: "Plastic", icon: "♻️" },
  { id: "paper", label: "Paper", icon: "📄" },
  { id: "metal", label: "Metal", icon: "🔩" },
  { id: "electronic", label: "Electronic", icon: "🔌" },
  { id: "food", label: "Food Surplus", icon: "🥬" },
  { id: "textile", label: "Textile", icon: "👕" },
  { id: "other", label: "Other", icon: "📦" },
];

export default function ExplorePage() {
  const supabase = useMemo(() => createClient(), []);

  const [resources, setResources] = useState<Resource[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from("resources")
        .select(
          "id, owner_id, title, category, quantity, unit, city, description, status, price, negotiation_percent, images, created_at"
        )
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("EXPLORE RESOURCE LOAD ERROR:", error);
      } else {
        setResources((data as Resource[]) || []);
      }

      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesCategory =
        selectedCategory === "all" ||
        resource.category?.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesTitle = resource.title?.toLowerCase().includes(query);
      const matchesCity = resource.city?.toLowerCase().includes(query);
      const matchesDesc = resource.description?.toLowerCase().includes(query);
      const matchesCat = resource.category?.toLowerCase().includes(query);

      return matchesCategory && (matchesTitle || matchesCity || matchesDesc || matchesCat);
    });
  }, [resources, selectedCategory, searchQuery]);

  return (
    <main className="min-h-screen bg-[#06120e] px-4 py-10 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300/80">
              ARVENA EXPLORE
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Resource Marketplace
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Discover circular materials, surplus resources, and secondary raw materials available for reuse across your city.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/resources/new"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-6 text-sm font-semibold text-[#06120e] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-200"
            >
              + Add Resource
            </Link>
          </div>
        </div>

        {/* =====================================================
            SEARCH & CATEGORIES FILTER
        ===================================================== */}
        <div className="mt-8 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by title, material, or city (e.g. Semarang, Kopi, Plastik)..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pl-11 text-sm text-white outline-none placeholder:text-white/25 transition focus:border-emerald-300/30 focus:bg-white/[0.05]"
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition duration-200 ${
                    active
                      ? "border border-emerald-300/30 bg-emerald-300/[0.12] font-medium text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                      : "border border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =====================================================
            RESOURCES GRID
        ===================================================== */}
        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.02]"
                />
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.015] p-12 text-center">
              <div className="text-4xl opacity-30">📦</div>
              <p className="mt-4 text-lg font-medium">No resources found</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search query or switching to another category."
                  : "Be the first contributor to share a surplus resource in ARVENA."}
              </p>
              {searchQuery || selectedCategory !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
                >
                  Reset Filters
                </button>
              ) : (
                <Link
                  href="/resources/new"
                  className="mt-6 inline-flex rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#06120e] transition hover:bg-emerald-200"
                >
                  + Add First Resource
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => {
                const isOwner = resource.owner_id === userId;
                const imageCount = resource.images?.length || 0;

                const price = Number(resource.price) || 0;
                const nego = Number(resource.negotiation_percent) || 0;
                const minimumPrice = price > 0 && nego > 0 ? Math.round(price * (1 - nego / 100)) : price;

                return (
                  <div
                    key={resource.id}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-white/[0.04] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                  >
                    {/* PHOTO PREVIEW */}
                    <Link href={`/resources/${resource.id}`} className="relative block">
                      {imageCount > 0 ? (
                        <div className="relative h-48 w-full overflow-hidden bg-black/20">
                          <img
                            src={resource.images![0]}
                            alt={resource.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-0.5 text-[10px] text-white backdrop-blur-md">
                            📷 {imageCount}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-48 items-center justify-center border-b border-white/10 bg-white/[0.015]">
                          <div className="text-center">
                            <div className="text-3xl opacity-20">📦</div>
                            <p className="mt-2 text-[10px] text-white/30">No photo uploaded</p>
                          </div>
                        </div>
                      )}
                    </Link>

                    {/* CARD BODY */}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-medium capitalize text-emerald-300">
                          {resource.category || "General"}
                        </span>

                        <span className="text-[11px] text-white/30">
                          📍 {resource.city || "Unspecified"}
                        </span>
                      </div>

                      {/* Title */}
                      <Link
                        href={`/resources/${resource.id}`}
                        className="mt-4 block text-lg font-semibold text-white/90 transition hover:text-emerald-200"
                      >
                        {resource.title}
                      </Link>

                      {/* Description */}
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/40">
                        {resource.description || "No description provided."}
                      </p>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Meta Info */}
                      <div className="mt-5 border-t border-white/[0.07] pt-4">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-white/30">Available: </span>
                            <span className="font-semibold text-white/80">
                              {resource.quantity} {resource.unit}
                            </span>
                          </div>

                          {price > 0 && (
                            <div className="text-right">
                              <p className="font-semibold text-emerald-300">
                                Rp{price.toLocaleString("id-ID")}
                                <span className="text-[10px] font-normal text-white/40">
                                  {" "}
                                  / {resource.unit}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>

                        {nego > 0 && price > 0 && (
                          <p className="mt-1.5 text-[10px] text-white/30">
                            Nego up to {nego}% (Min: Rp{minimumPrice.toLocaleString("id-ID")})
                          </p>
                        )}
                      </div>

                      {/* ACTION BUTTON */}
                      <div className="mt-5">
                        {isOwner ? (
                          <Link
                            href={`/resources/${resource.id}`}
                            className="block w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-center text-xs font-medium text-white/50 transition hover:border-white/20 hover:text-white"
                          >
                            Manage Your Resource
                          </Link>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/resources/${resource.id}`}
                              className="rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-center text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                            >
                              View Details
                            </Link>

                            <Link
                              href={`/resources/${resource.id}/request`}
                              className="rounded-xl bg-emerald-300 py-2.5 text-center text-xs font-semibold text-[#06120e] transition hover:bg-emerald-200"
                            >
                              Request →
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