"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import {
  Users,
  Search,
  MapPin,
  Calendar,
  Package,
  Activity,
  Plus,
  ShieldCheck,
  Shield,
  Layers,
  Leaf,
  Recycle,
  Cpu,
  Shirt,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";

type CommunityWithStats = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  province: string | null;
  city: string | null;
  district: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  join_policy: "open" | "approval_required";
  status?: string | null;
  created_at: string;
  member_count: number;
  moderator_count: number;
  event_count: number;
  resource_count: number;
  is_member?: boolean;
  user_role?: string | null;
};

export default function CommunityDirectoryPage() {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [communities, setCommunities] = useState<CommunityWithStats[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const CATEGORIES = useMemo(
    () => [
      { id: "all", label: t.common.all, icon: Layers },
      { id: "circular", label: "Circular Economy", icon: Recycle },
      { id: "organic", label: "Organic & Composting", icon: Leaf },
      { id: "ewaste", label: "E-Waste & Electronics", icon: Cpu },
      { id: "textile", label: "Textile & Upcycling", icon: Shirt },
      { id: "general", label: "Neighborhood Sustainability", icon: Package },
    ],
    [t]
  );

  useEffect(() => {
    async function loadCommunities() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      // Fetch communities
      const { data: comms, error } = await supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("COMMUNITIES LOAD ERROR:", error);
        setLoading(false);
        return;
      }

      // Fetch stats for each community
      const populated = await Promise.all(
        (comms || []).map(async (c) => {
          // Member count & roles
          const { data: members } = await supabase
            .from("community_members")
            .select("role, user_id")
            .eq("community_id", c.id);

          const memberList = members || [];
          const memberCount = memberList.length;
          const moderatorCount = memberList.filter((m) => m.role === "moderator" || m.role === "admin").length;
          const userMembership = memberList.find((m) => m.user_id === user?.id);

          // Event count
          const { count: eventCount } = await supabase
            .from("community_events")
            .select("*", { count: "exact", head: true })
            .eq("community_id", c.id);

          // Resource count
          const { count: resourceCount } = await supabase
            .from("community_resources")
            .select("*", { count: "exact", head: true })
            .eq("community_id", c.id);

          return {
            ...c,
            member_count: memberCount,
            moderator_count: moderatorCount,
            event_count: eventCount || 0,
            resource_count: resourceCount || 0,
            is_member: !!userMembership,
            user_role: userMembership?.role || null,
          };
        })
      );

      setCommunities(populated);
      setLoading(false);
    }

    loadCommunities();
  }, [supabase]);

  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      const matchesCategory =
        selectedCategory === "all" || c.category?.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesName = c.name.toLowerCase().includes(query);
      const matchesCity = (c.city || "").toLowerCase().includes(query);
      const matchesDesc = c.description.toLowerCase().includes(query);

      return matchesCategory && (matchesName || matchesCity || matchesDesc);
    });
  }, [communities, selectedCategory, searchQuery]);

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <Users className="h-3 w-3" />
              <span>ARVENA COMMUNITY ECOSYSTEM</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white">
              {t.community.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              {t.community.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/community/events"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-white/80 hover:border-emerald-400/30 hover:bg-white/[0.06] hover:text-white transition"
            >
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>{t.events.title}</span>
            </Link>

            <Link
              href="/community/create"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgba(42,131,95,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#32a070]"
            >
              <Plus className="h-4 w-4" />
              <span>{t.community.createCommunity}</span>
            </Link>
          </div>
        </div>

        {/* =====================================================
            SEARCH & CATEGORIES FILTER
        ===================================================== */}
        <div className="mt-8 space-y-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.community.searchPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pl-11 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-emerald-400/40 focus:bg-white/[0.05]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

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
                      : "border border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
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
            COMMUNITIES LIST
        ===================================================== */}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.02]" />
              ))}
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-emerald-400">
                <Users className="h-7 w-7 opacity-60" />
              </div>
              <p className="mt-4 text-lg font-semibold">{t.common.noResults}</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
                {searchQuery || selectedCategory !== "all"
                  ? t.common.tryAdjusting
                  : "No community hubs registered yet. Be the first to start a local circular group."}
              </p>
              <Link
                href="/community/create"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-6 py-3 text-xs font-bold text-white hover:bg-[#349e73] shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>{t.community.createCommunity}</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredCommunities.map((c) => {
                const locationLabel = [c.district, c.city || c.province].filter(Boolean).join(", ") || "Indonesia";
                const shortDesc =
                  c.description.length > 150 ? `${c.description.slice(0, 147)}...` : c.description;

                return (
                  <div
                    key={c.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-emerald-300">
                            <Recycle className="h-3 w-3" />
                            <span>{c.category}</span>
                          </span>

                          {c.status === "pending_activation" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              Pending
                            </span>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-white/50">
                          {c.join_policy === "open" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>{t.community.openPolicy}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 text-amber-400" />
                              <span>{t.community.approvalPolicy}</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Community Name */}
                      <Link
                        href={`/community/${c.slug || c.id}`}
                        className="mt-4 block text-xl font-bold text-white transition hover:text-emerald-200 line-clamp-1"
                      >
                        {c.name}
                      </Link>

                      {/* Location */}
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/40">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400/80 shrink-0" />
                        <span className="truncate">{locationLabel}</span>
                      </div>

                      {/* Short Description */}
                      <p className="mt-3 text-xs leading-6 text-white/50 line-clamp-3">
                        {shortDesc}
                      </p>
                    </div>

                    {/* Stats & Actions */}
                    <div className="mt-6 border-t border-white/[0.07] pt-4">
                      {/* Grid Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center pb-4 border-b border-white/[0.05]">
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                          <span className="block text-sm font-bold text-white">{c.member_count}</span>
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">{t.community.members}</span>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                          <span className="block text-sm font-bold text-white">{c.event_count}</span>
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">{t.community.events}</span>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
                          <span className="block text-sm font-bold text-white">{c.resource_count}</span>
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">{t.community.resources}</span>
                        </div>
                      </div>

                      {/* Link to Community Detail */}
                      <div className="mt-4">
                        <Link
                          href={`/community/${c.slug || c.id}`}
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/[0.03] border border-white/10 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10 hover:border-emerald-400/30 hover:text-emerald-200 transition"
                        >
                          <span>{t.common.viewDetails}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
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