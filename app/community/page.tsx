"use client";

import { useState } from "react";
import Link from "next/link";

type CommunityItem = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  icon: string;
  city: string;
  membersCount: number;
  description: string;
  activitiesCount: number;
  featured?: boolean;
};

const FEATURED_COMMUNITIES: CommunityItem[] = [
  {
    id: "semarang-circular-lab",
    name: "Semarang Circular Hub",
    category: "circular",
    categoryLabel: "Circular Economy",
    icon: "♻️",
    city: "Kota Semarang",
    membersCount: 142,
    description: "Inisiatif kolaborasi pengolahan limbah plastik dan daur ulang material sekunder di kawasan Semarang dan sekitarnya.",
    activitiesCount: 8,
    featured: true,
  },
  {
    id: "tembalang-compost-collective",
    name: "Tembalang Compost Collective",
    category: "organic",
    categoryLabel: "Organic & Farming",
    icon: "🌿",
    city: "Kota Semarang",
    membersCount: 89,
    description: "Gerakan pengumpulan ampas kopi dan sisa organik untuk pembuatan pupuk kompos komunitas dan urban garden.",
    activitiesCount: 12,
    featured: true,
  },
  {
    id: "jateng-ewaste-network",
    name: "Jateng E-Waste Recovery",
    category: "ewaste",
    categoryLabel: "E-Waste & Electronics",
    icon: "🔌",
    city: "Jawa Tengah",
    membersCount: 64,
    description: "Komunitas pengumpulan dan perbaikan komponen elektronik bekas untuk mencegah limbah B3 ke lingkungan.",
    activitiesCount: 5,
  },
  {
    id: "solo-upcycle-craft",
    name: "Surakarta Textile Upcycling",
    category: "textile",
    categoryLabel: "Textile & Craft",
    icon: "👕",
    city: "Kota Surakarta",
    membersCount: 78,
    description: "Pemberdayaan perajin lokal untuk mengubah kain sisa konveksi menjadi tas dan produk pakai ulang bernilai tambah.",
    activitiesCount: 9,
  },
];

const COMMUNITY_CATEGORIES = [
  { id: "all", label: "All Communities" },
  { id: "circular", label: "Circular Resources" },
  { id: "organic", label: "Organic & Composting" },
  { id: "ewaste", label: "E-Waste & Repair" },
  { id: "textile", label: "Textile Upcycling" },
];

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCommunities = FEATURED_COMMUNITIES.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesName = item.name.toLowerCase().includes(query);
    const matchesCity = item.city.toLowerCase().includes(query);
    const matchesDesc = item.description.toLowerCase().includes(query);

    return matchesCategory && (matchesName || matchesCity || matchesDesc);
  });

  return (
    <main className="min-h-screen bg-[#06120e] px-4 py-10 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300/80">
              ARVENA COMMUNITY
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Connected Communities
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Discover grassroots initiatives, local recycling hubs, and sustainability groups driving circular action across cities.
            </p>
          </div>

          <div>
            <Link
              href="/community/create"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-6 text-sm font-semibold text-[#06120e] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-200"
            >
              + Create Community
            </Link>
          </div>
        </div>

        {/* =====================================================
            FILTER & SEARCH
        ===================================================== */}
        <div className="mt-8 space-y-4">
          <div className="relative max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities by name or city (e.g. Semarang, Kompos)..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pl-11 text-sm text-white outline-none placeholder:text-white/25 transition focus:border-emerald-300/30 focus:bg-white/[0.05]"
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
              🔍
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {COMMUNITY_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition duration-200 ${
                    active
                      ? "border border-emerald-300/30 bg-emerald-300/[0.12] font-medium text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                      : "border border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* =====================================================
            COMMUNITY DIRECTORY
        ===================================================== */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {filteredCommunities.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/25 hover:bg-white/[0.04]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xl">
                      {item.icon}
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-emerald-300/80 uppercase tracking-wider">
                        {item.categoryLabel}
                      </span>
                      <p className="text-xs text-white/30">📍 {item.city}</p>
                    </div>
                  </div>

                  {item.featured && (
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-emerald-200">
                      Active Hub
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white/90 group-hover:text-emerald-200 transition">
                  {item.name}
                </h3>

                <p className="mt-2.5 text-xs leading-6 text-white/40">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span>👥 {item.membersCount} members</span>
                    <span>⚡ {item.activitiesCount} activities</span>
                  </div>

                  <Link
                    href={`/community/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition"
                  >
                    View Community <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}