"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  Calendar,
  MapPin,
  Search,
  Users,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  type Province,
  type Regency,
  type District,
} from "@/lib/regions";

type EventItem = {
  id: string;
  community_id: string;
  title: string;
  short_description: string;
  event_date: string;
  location_name: string;
  province: string | null;
  city: string | null;
  district: string | null;
  cover_image_url: string | null;
  status: string;
  communities: {
    id: string;
    name: string;
    slug: string;
    category: string;
  };
};

export default function CommunityEventsDirectoryPage() {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Location filters
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);

      const { data, error } = await supabase
        .from("community_events")
        .select("id, community_id, title, short_description, event_date, location_name, province, city, district, cover_image_url, status, communities(id, name, slug, category)")
        .eq("status", "published")
        .order("event_date", { ascending: true });

      if (!error && data) {
        setEvents(data as unknown as EventItem[]);
      }

      const provs = await fetchProvinces();
      setProvinces(provs);

      setLoading(false);
    }

    loadEvents();
  }, [supabase]);

  const handleProvinceChange = async (code: string) => {
    setSelectedProvince(code);
    setSelectedCity("");
    setSelectedDistrict("");
    setRegencies([]);
    setDistricts([]);
    if (code) {
      const regs = await fetchRegencies(code);
      setRegencies(regs);
    }
  };

  const handleCityChange = async (code: string) => {
    setSelectedCity(code);
    setSelectedDistrict("");
    setDistricts([]);
    if (code) {
      const dists = await fetchDistricts(code);
      setDistricts(dists);
    }
  };

  const filteredEvents = useMemo(() => {
    const provName = provinces.find((p) => p.code === selectedProvince)?.name?.toLowerCase();
    const cityName = regencies.find((r) => r.code === selectedCity)?.name?.toLowerCase();
    const distName = districts.find((d) => d.code === selectedDistrict)?.name?.toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    return events.filter((e) => {
      // Location matching
      if (provName && !(e.province || "").toLowerCase().includes(provName)) return false;
      if (cityName && !(e.city || "").toLowerCase().includes(cityName)) return false;
      if (distName && !(e.district || "").toLowerCase().includes(distName)) return false;

      // Text query matching (title, community name, location, description)
      if (query) {
        const matchTitle = e.title.toLowerCase().includes(query);
        const matchComm = (e.communities?.name || "").toLowerCase().includes(query);
        const matchLoc = (e.location_name || "").toLowerCase().includes(query);
        const matchDesc = e.short_description.toLowerCase().includes(query);
        return matchTitle || matchComm || matchLoc || matchDesc;
      }

      return true;
    });
  }, [events, searchQuery, selectedProvince, selectedCity, selectedDistrict, provinces, regencies, districts]);

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <Calendar className="h-3 w-3" />
              <span>CIRCULAR EVENTS & WORKSHOPS</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white">
              {t.events.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              {t.events.subtitle}
            </p>
          </div>

          <Link
            href="/community"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-white/80 hover:border-emerald-400/30 hover:text-white transition"
          >
            <Users className="h-4 w-4 text-emerald-400" />
            <span>Community Directory</span>
          </Link>
        </div>

        {/* =====================================================
            SEARCH & LOCATION FILTERS
        ===================================================== */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event name or community..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pl-11 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400"
            />
          </div>

          <div>
            <select
              value={selectedProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3.5 text-xs text-white outline-none focus:border-emerald-400"
            >
              <option value="">{t.common.allProvinces}</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={!selectedProvince}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3.5 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-40"
            >
              <option value="">{t.common.allCities}</option>
              {regencies.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedCity}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3.5 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-40"
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =====================================================
            EVENTS GRID
        ===================================================== */}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.02]" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
              <Calendar className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-3 text-sm font-semibold">{t.common.noResults}</p>
              <p className="mt-1 text-xs text-white/40">No matching events found for the selected filters.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => {
                const dateObj = new Date(event.event_date);
                const dateFormatted = dateObj.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeFormatted = dateObj.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const locationStr = [event.location_name, event.city].filter(Boolean).join(", ");
                const shortDesc =
                  event.short_description.length > 220
                    ? `${event.short_description.slice(0, 217)}...`
                    : event.short_description;

                return (
                  <div
                    key={event.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
                  >
                    <div>
                      {/* Cover Photo */}
                      {event.cover_image_url ? (
                        <div className="h-44 w-full overflow-hidden bg-black/40 relative">
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="h-28 w-full bg-gradient-to-br from-emerald-400/10 to-white/[0.02] flex items-center justify-center border-b border-white/5">
                          <Calendar className="h-8 w-8 text-emerald-400/40" />
                        </div>
                      )}

                      <div className="p-6">
                        {/* Host Community & Date */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                            {event.communities?.name || "Community"}
                          </span>

                          <span className="text-[11px] text-white/50 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{dateFormatted}</span>
                          </span>
                        </div>

                        {/* Title */}
                        <Link
                          href={`/community/events/${event.id}`}
                          className="mt-3 block text-base font-bold text-white group-hover:text-emerald-200 transition line-clamp-2"
                        >
                          {event.title}
                        </Link>

                        {/* Location */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{locationStr}</span>
                        </div>

                        {/* Short Description */}
                        <p className="mt-3 text-xs leading-5 text-white/50 line-clamp-3">
                          {shortDesc}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <div className="border-t border-white/[0.07] pt-4">
                        <Link
                          href={`/community/events/${event.id}`}
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#2A835F] border border-[#12544F] py-2.5 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
                        >
                          <span>{t.events.readArticle}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
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
