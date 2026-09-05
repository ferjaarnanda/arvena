"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  Users,
  Shield,
  MapPin,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  type Province,
  type Regency,
  type District,
} from "@/lib/regions";

export default function CreateCommunityPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("circular");
  const [joinPolicy, setJoinPolicy] = useState<"open" | "approval_required">("open");

  // Anti-spam rule: Initial 2 co-founding member identifiers (emails/usernames)
  const [member1, setMember1] = useState("");
  const [member2, setMember2] = useState("");

  // Cascading Location
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  useEffect(() => {
    async function checkAuthAndLoadRegions() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserId(user.id);
      setLoadingUser(false);

      const provs = await fetchProvinces();
      setProvinces(provs);
    }

    checkAuthAndLoadRegions();
  }, [supabase, router]);

  const handleProvinceChange = async (provCode: string) => {
    setSelectedProvince(provCode);
    setSelectedCity("");
    setSelectedDistrict("");
    setRegencies([]);
    setDistricts([]);
    if (provCode) {
      const regs = await fetchRegencies(provCode);
      setRegencies(regs);
    }
  };

  const handleCityChange = async (cityCode: string) => {
    setSelectedCity(cityCode);
    setSelectedDistrict("");
    setDistricts([]);
    if (cityCode) {
      const dists = await fetchDistricts(cityCode);
      setDistricts(dists);
    }
  };

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Anti-spam validation: minimum 2 co-founding member entries
    if (!member1.trim() || !member2.trim()) {
      setError("Anti-spam policy: You must specify at least 2 co-founding members or collaborators to start a new community (minimum 3 members total).");
      return;
    }

    if (description.length > 250) {
      setError("Short description should be approximately 150-200 characters.");
      return;
    }

    if (!selectedProvince || !selectedCity) {
      setError("Please select the province and city for your community.");
      return;
    }

    setSubmitting(true);

    try {
      const provName = provinces.find((p) => p.code === selectedProvince)?.name || null;
      const cityName = regencies.find((r) => r.code === selectedCity)?.name || null;
      const distName = districts.find((d) => d.code === selectedDistrict)?.name || null;

      const slug = `${slugify(name)}-${Math.random().toString(36).substring(2, 6)}`;

      // 1. Insert Community with pending_activation status until 2 initial members accept
      const { data: newCommunity, error: commError } = await supabase
        .from("communities")
        .insert({
          creator_id: userId,
          name: name.trim(),
          slug,
          description: description.trim(),
          category,
          province: provName,
          province_code: selectedProvince,
          city: cityName,
          city_code: selectedCity,
          district: distName,
          district_code: selectedDistrict || null,
          join_policy: joinPolicy,
          status: "pending_activation",
          initial_members_required: 2,
          initial_members_accepted: 0,
        })
        .select()
        .single();

      if (commError) {
        throw commError;
      }

      // 2. Insert Admin Member (creator)
      const { error: memberError } = await supabase.from("community_members").insert({
        community_id: newCommunity.id,
        user_id: userId,
        role: "admin",
      });

      if (memberError) {
        console.warn("Failed to insert admin member:", memberError);
      }

      // 3. Insert Initial Member Invitations (Anti-Spam Verification)
      const invitationsToInsert = [
        {
          community_id: newCommunity.id,
          invited_by: userId,
          invitee_identifier: member1.trim(),
          role: "member",
          status: "pending",
        },
        {
          community_id: newCommunity.id,
          invited_by: userId,
          invitee_identifier: member2.trim(),
          role: "member",
          status: "pending",
        },
      ];

      const { error: inviteError } = await supabase
        .from("community_invitations")
        .insert(invitationsToInsert);

      if (inviteError) {
        console.warn("Failed to insert invitations:", inviteError);
      }

      router.push(`/community/${newCommunity.slug}`);
      router.refresh();
    } catch (err: unknown) {
      console.error("CREATE COMMUNITY ERROR:", err);
      const message = err instanceof Error ? err.message : "Failed to create community. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#092328] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Community Directory</span>
        </Link>

        {/* Header Banner */}
        <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.08] to-transparent p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <Sparkles className="h-3 w-3" />
            <span>COMMUNITY INITIATIVE</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Create a New Circular Community
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Connect local citizens, composters, repair technicians, and circular businesses to collaborate on waste diversion.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Basic Information */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Community Information</span>
            </h2>

            {/* Name */}
            <div>
              <label className="mb-2 block text-xs font-medium text-white/70">
                Community Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tembalang Circular Hub, Semarang Composting Collective..."
                className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-medium text-white/70">
                Focus Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3.5 text-sm text-white outline-none focus:border-emerald-400"
              >
                <option value="circular">Circular Economy & Material Recycling</option>
                <option value="organic">Organic Composting & Urban Farming</option>
                <option value="ewaste">E-Waste & Electronics Repair</option>
                <option value="textile">Textile & Clothing Upcycling</option>
                <option value="general">Neighborhood Sustainability</option>
              </select>
            </div>

            {/* Description (~150 chars) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/70">
                  Short Description (~150 characters) *
                </label>
                <span className={`text-[11px] ${description.length > 200 ? "text-amber-400" : "text-white/40"}`}>
                  {description.length} / 200
                </span>
              </div>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of your community's purpose and circular activities (displayed on discovery cards)..."
                className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] p-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400 resize-none"
              />
            </div>

            {/* Join Policy */}
            <div>
              <label className="mb-2 block text-xs font-medium text-white/70">
                Membership Join Policy *
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                    joinPolicy === "open"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-white"
                      : "border-white/10 bg-white/[0.01] text-white/60 hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="radio"
                    name="joinPolicy"
                    checked={joinPolicy === "open"}
                    onChange={() => setJoinPolicy("open")}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold block text-white">Open Community</span>
                    <span className="text-xs text-white/40 leading-5">
                      Citizens can join immediately and contribute resources without waiting for approval.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                    joinPolicy === "approval_required"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-white"
                      : "border-white/10 bg-white/[0.01] text-white/60 hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="radio"
                    name="joinPolicy"
                    checked={joinPolicy === "approval_required"}
                    onChange={() => setJoinPolicy("approval_required")}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-semibold block text-white">Approval Required</span>
                    <span className="text-xs text-white/40 leading-5">
                      New members must submit a join request that is reviewed by Admin or Moderators.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Cascading Location */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>Location & Coverage</span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Province */}
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Province *
                </label>
                <select
                  required
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

              {/* City */}
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  City / Regency *
                </label>
                <select
                  required
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
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

              {/* District */}
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  District (Kecamatan)
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedCity}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3.5 py-3 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-40"
                >
                  <option value="">All Districts in City</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Anti-Spam Verification */}
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.03] p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Anti-Spam Verification: Minimum 3 Initial Members</span>
              </h2>
              <p className="mt-1 text-xs leading-5 text-white/50">
                To prevent spam and ghost communities, every new group requires 1 Admin (you) and at least 2 initial members (minimum 3 members total).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Initial Member 1 (Email or Username) *
                </label>
                <input
                  type="text"
                  required
                  value={member1}
                  onChange={(e) => setMember1(e.target.value)}
                  placeholder="e.g. barista_tembalang or member@arvena.org"
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-white/70">
                  Initial Member 2 (Email or Username) *
                </label>
                <input
                  type="text"
                  required
                  value={member2}
                  onChange={(e) => setMember2(e.target.value)}
                  placeholder="e.g. daurulang_undip or member2@arvena.org"
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1d17] px-4 py-3 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#2A835F] border border-[#12544F] py-4 text-sm font-bold text-white shadow-sm transition duration-200 hover:bg-[#349e73] disabled:opacity-50"
          >
            {submitting ? "Creating Community..." : "Launch Community Hub"}
          </button>
        </form>
      </div>
    </main>
  );
}
