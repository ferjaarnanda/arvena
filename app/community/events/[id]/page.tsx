"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Share2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

type EventDetail = {
  id: string;
  community_id: string;
  title: string;
  short_description: string;
  article_content: string;
  cover_image_url: string | null;
  event_date: string;
  location_name: string;
  province: string | null;
  city: string | null;
  district: string | null;
  status: string;
  created_at: string;
  communities: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
  };
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const eventId = typeof params.id === "string" ? params.id : "";

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("community_events")
        .select("*, communities(id, name, slug, category, description)")
        .eq("id", eventId)
        .single();

      if (error || !data) {
        console.error("EVENT DETAIL ERROR:", error);
      } else {
        setEvent(data as unknown as EventDetail);
      }

      setLoading(false);
    }

    loadEvent();
  }, [eventId, supabase]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || "ARVENA Community Event",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#092328] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-[#092328] px-6 py-12 text-white">
        <div className="mx-auto max-w-lg text-center">
          <Calendar className="mx-auto h-8 w-8 text-white/30" />
          <h1 className="mt-4 text-2xl font-bold">Event Not Found</h1>
          <p className="mt-2 text-xs text-white/40">This event does not exist or has been removed.</p>
          <Link
            href="/community/events"
            className="mt-6 inline-flex rounded-xl bg-[#2A835F] border border-[#12544F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#349e73] transition"
          >
            ← Back to Events Directory
          </Link>
        </div>
      </main>
    );
  }

  const dateObj = new Date(event.event_date);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const locationFull = [event.location_name, event.district, event.city, event.province]
    .filter(Boolean)
    .join(", ");

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationFull)}`;

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/community/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Events Directory</span>
        </Link>

        {/* =====================================================
            EVENT HERO & ARTICLE CONTAINER
        ===================================================== */}
        <article className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
          {/* Cover Photo */}
          {event.cover_image_url && (
            <div className="h-80 w-full overflow-hidden rounded-2xl bg-black/40 mb-8 border border-white/10 relative">
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Host Community & Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-6">
            <Link
              href={`/community/${event.communities?.slug || event.community_id}`}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Hosted by {event.communities?.name}</span>
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? "Link Copied!" : "Share"}</span>
            </button>
          </div>

          {/* Title */}
          <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            {event.title}
          </h1>

          {/* Logistics Box */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 rounded-2xl border border-white/10 bg-[#081812] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] text-white/40 uppercase tracking-wider block">Date & Time</span>
                <span className="text-xs font-semibold text-white block mt-0.5">{formattedDate}</span>
                <span className="text-[11px] text-emerald-300">{formattedTime} WIB</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] text-white/40 uppercase tracking-wider block">Location / Venue</span>
                <span className="text-xs font-semibold text-white block mt-0.5">{locationFull}</span>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-1"
                >
                  <span>Open Google Maps</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Short Description Lead */}
          <p className="mt-8 text-base font-medium leading-7 text-emerald-200/90 border-l-2 border-emerald-400 pl-4">
            {event.short_description}
          </p>

          {/* Rich Article Body */}
          <div
            className="mt-8 prose prose-invert max-w-none text-sm leading-8 text-white/80 border-t border-white/10 pt-8"
            dangerouslySetInnerHTML={{ __html: event.article_content }}
          />

          {/* Host Community Footer Card */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 block font-semibold">Organized by</span>
              <h4 className="text-base font-bold text-white mt-1">{event.communities?.name}</h4>
              <p className="text-xs text-white/40 mt-1 max-w-lg">{event.communities?.description}</p>
            </div>

            <Link
              href={`/community/${event.communities?.slug || event.community_id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2A835F] border border-[#12544F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
            >
              <span>Visit Community Hub</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
