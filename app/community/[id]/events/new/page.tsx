"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  Calendar,
  Sparkles,
  ArrowLeft,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  Edit3,
  AlertCircle,
  MapPin,
  Clock,
} from "lucide-react";
import {
  fetchProvinces,
  fetchRegencies,
  type Province,
  type Regency,
} from "@/lib/regions";

export default function CreateCommunityEventPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const communityIdentifier = typeof params.id === "string" ? params.id : "";

  const [community, setCommunity] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Editor mode: "edit" vs "preview"
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  // Form state
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [locationName, setLocationName] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [articleContent, setArticleContent] = useState(
    "<h2>Tentang Kegiatan</h2>\n<p>Jelaskan tujuan dan latar belakang kegiatan daur ulang atau workshop ini di sini...</p>\n\n<h3>Agenda & Rangkaian Acara</h3>\n<ul>\n  <li>09:00 - 10:00: Registrasi dan pengenalan materi</li>\n  <li>10:00 - 12:00: Praktik pemilahan dan pengolahan langsung</li>\n</ul>\n\n<h3>Persyaratan Peserta</h3>\n<p>Peserta disarankan membawa wadah atau material daur ulang mandiri dari rumah.</p>"
  );

  // Styling controls
  const [fontFamily, setFontFamily] = useState("sans");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  // Location selector
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    async function verifyAndLoad() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }
      setCurrentUser(user);

      // Load community
      let query = supabase.from("communities").select("id, name, slug");
      if (communityIdentifier.includes("-") && communityIdentifier.length > 20) {
        query = query.or(`id.eq.${communityIdentifier},slug.eq.${communityIdentifier}`);
      } else {
        query = query.eq("slug", communityIdentifier);
      }

      const { data: comm } = await query.single();
      if (!comm) {
        setError("Community not found.");
        setLoading(false);
        return;
      }

      setCommunity(comm);

      // Check admin/moderator permission
      const { data: member } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", comm.id)
        .eq("user_id", user.id)
        .single();

      if (!member || (member.role !== "admin" && member.role !== "moderator")) {
        setError("Only Community Admins and Moderators can publish events.");
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }

      const provs = await fetchProvinces();
      setProvinces(provs);

      setLoading(false);
    }

    verifyAndLoad();
  }, [communityIdentifier, supabase, router]);

  const handleProvinceChange = async (code: string) => {
    setSelectedProvince(code);
    setSelectedCity("");
    setRegencies([]);
    if (code) {
      const regs = await fetchRegencies(code);
      setRegencies(regs);
    }
  };

  // Rich formatting insertion helpers
  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = document.getElementById("articleTextarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = articleContent.substring(start, end) || "Text";
    const replacement = `${openTag}${selected}${closeTag}`;

    const newContent =
      articleContent.substring(0, start) + replacement + articleContent.substring(end);
    setArticleContent(newContent);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL to insert into article:");
    if (url) {
      const caption = prompt("Enter optional image caption:") || "";
      const imgBlock = `\n<figure class="my-6">\n  <img src="${url}" alt="${caption}" class="w-full rounded-2xl border border-white/10" />\n  ${
        caption ? `<figcaption class="text-xs text-center text-white/40 mt-2">${caption}</figcaption>` : ""
      }\n</figure>\n`;
      setArticleContent((prev) => prev + imgBlock);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL link (e.g. https://...):");
    if (url) {
      const text = prompt("Enter link text:") || url;
      setArticleContent((prev) => `${prev} <a href="${url}" target="_blank" rel="noreferrer" class="text-emerald-400 underline">${text}</a> `);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!community || !currentUser || !isAuthorized) return;

    if (!title.trim() || !shortDesc.trim() || !eventDate || !locationName.trim()) {
      setError("Please fill out all required event details.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const provName = provinces.find((p) => p.code === selectedProvince)?.name || null;
      const cityName = regencies.find((r) => r.code === selectedCity)?.name || null;

      const { data: newEvent, error: insertError } = await supabase
        .from("community_events")
        .insert({
          community_id: community.id,
          creator_id: currentUser.id,
          title: title.trim(),
          short_description: shortDesc.trim(),
          article_content: articleContent,
          cover_image_url: coverImageUrl.trim() || null,
          event_date: new Date(eventDate).toISOString(),
          location_name: locationName.trim(),
          province: provName,
          province_code: selectedProvince || null,
          city: cityName,
          city_code: selectedCity || null,
          status: "published",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/community/events/${newEvent.id}`);
    } catch (err: unknown) {
      console.error("EVENT CREATION ERROR:", err);
      const message = err instanceof Error ? err.message : "Failed to publish event.";
      setError(message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#092328] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#092328] px-6 py-12 text-white">
        <div className="mx-auto max-w-lg rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <h2 className="mt-3 text-lg font-bold text-white">Unauthorized</h2>
          <p className="mt-2 text-xs text-white/50">{error || "You must be an Admin or Moderator to publish events."}</p>
          <Link
            href={`/community/${communityIdentifier}`}
            className="mt-6 inline-flex rounded-xl bg-[#2A835F] border border-[#12544F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#349e73] transition"
          >
            ← Back to Community
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/community/${community?.slug || communityIdentifier}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {community?.name}</span>
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <Calendar className="h-3.5 w-3.5" />
              <span>{community?.name} Event</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              Create & Publish Event Article
            </h1>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                mode === "edit" ? "bg-emerald-400 text-[#092328]" : "text-white/60 hover:text-white"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{t.events.editMode}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                mode === "preview" ? "bg-emerald-400 text-[#092328]" : "text-white/60 hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{t.events.previewMode}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {mode === "edit" ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* 1. Meta Details */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Workshop Daur Ulang Plastik HDPE & Kompos Bersama Warga"
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3.5 text-sm text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-white/70">
                    Short Summary (Max ~220 characters for card preview) *
                  </label>
                  <span className={`text-[11px] ${shortDesc.length > 220 ? "text-amber-400" : "text-white/40"}`}>
                    {shortDesc.length} / 220
                  </span>
                </div>
                <textarea
                  required
                  rows={2}
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Brief 1-2 sentence overview of the workshop or circular activity..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] p-3.5 text-xs text-white outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">
                    Event Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-3 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">
                    Venue / Location Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Balai Warga Tembalang / Zoom Meeting"
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-3 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Location Selectors */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">Province</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3.5 py-3 text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">City / Regency</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={!selectedProvince}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3.5 py-3 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-40"
                  >
                    <option value="">Select City</option>
                    {regencies.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Cover Image URL (Featured Header Banner)
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or uploaded image URL"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-3 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* 2. Rich Article Editor Toolbar */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertTag("<strong>", "</strong>")}
                    title="Bold"
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/70 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Bold className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTag("<em>", "</em>")}
                    title="Italic"
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/70 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Italic className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTag("<h2>", "</h2>")}
                    title="Heading 2"
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/70 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTag("<h3>", "</h3>")}
                    title="Heading 3"
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/70 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Heading3 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => insertTag("<ul>\n  <li>", "</li>\n</ul>")}
                    title="Bullet List"
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/70 hover:bg-white/[0.08] hover:text-white"
                  >
                    <List className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={insertLink}
                    title="Insert Link"
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/70 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={insertImage}
                    title="Insert Inline Article Image"
                    className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-2 text-emerald-300 hover:bg-emerald-400/20"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Font and Alignment */}
                <div className="flex items-center gap-2">
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0b1d17] px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="sans">Geist Sans (Clean Tech)</option>
                    <option value="serif">Serif (Editorial)</option>
                    <option value="mono">Geist Mono (Technical)</option>
                  </select>

                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                    <button
                      type="button"
                      onClick={() => setTextAlign("left")}
                      className={`p-1 rounded ${textAlign === "left" ? "bg-white/20 text-white" : "text-white/40"}`}
                    >
                      <AlignLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign("center")}
                      className={`p-1 rounded ${textAlign === "center" ? "bg-white/20 text-white" : "text-white/40"}`}
                    >
                      <AlignCenter className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Article Body (HTML / Rich Structure) *
                </label>
                <textarea
                  id="articleTextarea"
                  required
                  rows={14}
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#081812] p-4 text-xs font-mono text-white/90 outline-none focus:border-emerald-400 leading-6"
                />
              </div>
            </div>

            {/* Publish Button */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-xs font-semibold text-white hover:bg-white/[0.06]"
              >
                Preview Article
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#2A835F] border border-[#12544F] px-8 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#349e73] disabled:opacity-50"
              >
                {submitting ? "Publishing..." : "Publish Event Article →"}
              </button>
            </div>
          </form>
        ) : (
          /* =====================================================
              PREVIEW MODE
          ===================================================== */
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-10">
              {coverImageUrl && (
                <div className="h-72 w-full overflow-hidden rounded-2xl bg-black/40 mb-8 border border-white/10">
                  <img src={coverImageUrl} alt={title} className="h-full w-full object-cover" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-400 mb-3">
                <span className="font-bold uppercase tracking-wider">{community?.name}</span>
                <span>•</span>
                <span className="text-white/50">{eventDate ? new Date(eventDate).toLocaleString() : "Date TBD"}</span>
                <span>•</span>
                <span className="text-white/50">{locationName || "Location TBD"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title || "Untitled Event Article"}</h1>
              <p className="text-sm leading-6 text-white/60 mb-8 border-b border-white/10 pb-6">{shortDesc}</p>

              {/* Rendered HTML */}
              <div
                className={`prose prose-invert max-w-none text-white/80 ${
                  fontFamily === "serif" ? "font-serif" : fontFamily === "mono" ? "font-mono" : "font-sans"
                } ${textAlign === "center" ? "text-center" : "text-left"}`}
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-xs font-semibold text-white"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-[#2A835F] border border-[#12544F] px-8 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#349e73]"
              >
                {submitting ? "Publishing..." : "Confirm & Publish →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
