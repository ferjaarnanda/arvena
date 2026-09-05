"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Filter,
  ImagePlus,
  MapPin,
  Package,
  Plus,
  Repeat2,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  fetchDistricts,
  fetchProvinces,
  fetchRegencies,
  type District,
  type Province,
  type Regency,
} from "@/lib/regions";

type ExchangeType = "offer" | "request";

type ExchangeListing = {
  id: string;
  user_id: string;
  type: ExchangeType;
  title: string;
  category: string;
  custom_category?: string | null;
  description: string;
  condition: string;
  quantity: number;
  unit: string;
  preferred_item?: string | null;
  notes?: string | null;
  primary_image?: string | null;
  additional_images?: string[] | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  status: string;
  created_at: string;
};

type Proposal = {
  id: string;
  exchange_id: string;
  proposer_id: string;
  target_user_id: string;
  offered_description: string;
  offered_quantity?: number | null;
  offered_unit?: string | null;
  message?: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  created_at: string;
};

type Match = {
  offer: ExchangeListing;
  request: ExchangeListing;
  score: number;
  reasons: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  organic: "Organic",
  plastic: "Plastic",
  paper: "Paper",
  metal: "Metal",
  electronic: "Electronic",
  textile: "Textile",
  other: "Other",
};

const CONDITION_LABELS: Record<string, string> = {
  usable: "Usable",
  used_good: "Used — Good",
  like_new: "Like New",
  raw_waste: "Raw Waste",
};

export default function CircularExchangePage() {
  const { t, locale } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const isId = locale === "id";

  /*
   * ============================================================
   * DATA
   * ============================================================
   */

  const [exchanges, setExchanges] = useState<ExchangeListing[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /*
   * ============================================================
   * FILTERS
   * ============================================================
   */

  const [activeTab, setActiveTab] = useState<
    "available" | "wanted" | "matches"
  >("available");

  const [searchQuery, setSearchQuery] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  /*
   * ============================================================
   * PROPOSAL
   * ============================================================
   */

  const [selectedExchange, setSelectedExchange] =
    useState<ExchangeListing | null>(null);

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showProposalConfirmation, setShowProposalConfirmation] =
    useState(false);

  const [proposalOfferedDesc, setProposalOfferedDesc] = useState("");
  const [proposalQuantity, setProposalQuantity] = useState("");
  const [proposalUnit, setProposalUnit] = useState("kg");
  const [proposalMessage, setProposalMessage] = useState("");

  const [proposalSubmitting, setProposalSubmitting] = useState(false);

  /*
   * ============================================================
   * LOAD DATA
   * ============================================================
   */

  const loadExchanges = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      }

      try {
        const [
          {
            data: { user },
          },
          exchangeResult,
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("exchanges")
            .select("*")
            .eq("status", "open")
            .order("created_at", { ascending: false }),
        ]);

        setCurrentUser(user ? { id: user.id } : null);

        if (!exchangeResult.error && exchangeResult.data) {
          setExchanges(exchangeResult.data as ExchangeListing[]);
        } else if (exchangeResult.error) {
          console.error(
            "EXCHANGE LOAD ERROR:",
            exchangeResult.error.message
          );
        }
      } catch (error) {
        console.error("EXCHANGE LOAD FAILED:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  const loadProvinces = useCallback(async () => {
    try {
      const data = await fetchProvinces();
      setProvinces(data);
    } catch (error) {
      console.error("PROVINCE LOAD ERROR:", error);
    }
  }, []);

  useEffect(() => {
    void loadExchanges();
    void loadProvinces();
  }, [loadExchanges, loadProvinces]);

  /*
   * ============================================================
   * LOCATION FILTERS
   * ============================================================
   */

  const handleProvinceChange = async (code: string) => {
    setSelectedProvince(code);
    setSelectedCity("");
    setSelectedDistrict("");
    setRegencies([]);
    setDistricts([]);

    if (!code) return;

    try {
      const data = await fetchRegencies(code);
      setRegencies(data);
    } catch (error) {
      console.error("REGENCY LOAD ERROR:", error);
    }
  };

  const handleCityChange = async (code: string) => {
    setSelectedCity(code);
    setSelectedDistrict("");
    setDistricts([]);

    if (!code) return;

    try {
      const data = await fetchDistricts(code);
      setDistricts(data);
    } catch (error) {
      console.error("DISTRICT LOAD ERROR:", error);
    }
  };

  const clearLocationFilters = () => {
    setSelectedProvince("");
    setSelectedCity("");
    setSelectedDistrict("");
    setRegencies([]);
    setDistricts([]);
  };

  /*
   * ============================================================
   * FILTERED LISTINGS
   * ============================================================
   */

  const filteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const provinceName = provinces
      .find((item) => item.code === selectedProvince)
      ?.name?.toLowerCase();

    const cityName = regencies
      .find((item) => item.code === selectedCity)
      ?.name?.toLowerCase();

    const districtName = districts
      .find((item) => item.code === selectedDistrict)
      ?.name?.toLowerCase();

    return exchanges.filter((item) => {
      if (activeTab === "available" && item.type !== "offer") {
        return false;
      }

      if (activeTab === "wanted" && item.type !== "request") {
        return false;
      }

      if (
        provinceName &&
        !(item.province || "").toLowerCase().includes(provinceName)
      ) {
        return false;
      }

      if (
        cityName &&
        !(item.city || "").toLowerCase().includes(cityName)
      ) {
        return false;
      }

      if (
        districtName &&
        !(item.district || "").toLowerCase().includes(districtName)
      ) {
        return false;
      }

      if (query) {
        const searchableText = [
          item.title,
          item.description,
          item.category,
          item.custom_category || "",
          item.preferred_item || "",
          item.city || "",
          item.province || "",
          item.district || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [
    exchanges,
    activeTab,
    searchQuery,
    provinces,
    regencies,
    districts,
    selectedProvince,
    selectedCity,
    selectedDistrict,
  ]);

  /*
   * ============================================================
   * SMART MATCH
   * ============================================================
   *
   * Match supply and demand based on:
   * - same category
   * - same city
   * - same district
   * - same province
   *
   * User's own listings are ignored.
   */

  const smartMatches = useMemo<Match[]>(() => {
    const offers = exchanges.filter(
      (item) =>
        item.type === "offer" &&
        item.status === "open" &&
        item.user_id !== currentUser?.id
    );

    const requests = exchanges.filter(
      (item) =>
        item.type === "request" &&
        item.status === "open" &&
        item.user_id !== currentUser?.id
    );

    const results: Match[] = [];

    for (const offer of offers) {
      for (const request of requests) {
        let score = 0;
        const reasons: string[] = [];

        if (offer.category === request.category) {
          score += 50;
          reasons.push(isId ? "Kategori sama" : "Same category");
        }

        if (
          offer.province &&
          request.province &&
          offer.province.toLowerCase() === request.province.toLowerCase()
        ) {
          score += 10;
          reasons.push(isId ? "Provinsi sama" : "Same province");
        }

        if (
          offer.city &&
          request.city &&
          offer.city.toLowerCase() === request.city.toLowerCase()
        ) {
          score += 25;
          reasons.push(isId ? "Kota sama" : "Same city");
        }

        if (
          offer.district &&
          request.district &&
          offer.district.toLowerCase() === request.district.toLowerCase()
        ) {
          score += 15;
          reasons.push(isId ? "Kecamatan sama" : "Same district");
        }

        if (score >= 50) {
          results.push({
            offer,
            request,
            score: Math.min(score, 100),
            reasons,
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }, [exchanges, currentUser?.id, isId]);

  /*
   * ============================================================
   * IMAGE UPLOAD
   * ============================================================
   */

  const uploadExchangeImage = async (
    file: File
  ): Promise<string | null> => {
    try {
      if (!file.type.startsWith("image/")) {
        return null;
      }

      if (file.size > 8 * 1024 * 1024) {
        throw new Error(
          isId
            ? "Ukuran gambar maksimal 8 MB."
            : "Image size must be 8 MB or less."
        );
      }

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filename = `exchange-${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage
        .from("exchange-images")
        .upload(filename, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("IMAGE UPLOAD ERROR:", error);
        return null;
      }

      const { data } = supabase.storage
        .from("exchange-images")
        .getPublicUrl(filename);

      return data.publicUrl;
    } catch (error) {
      console.error("IMAGE UPLOAD FAILED:", error);
      return null;
    }
  };

  /*
   * ============================================================
   * PROPOSAL MODAL
   * ============================================================
   */

  const openProposal = (listing: ExchangeListing) => {
    if (!currentUser) {
      window.location.href = `/auth/login?redirect=/exchange`;
      return;
    }

    if (listing.user_id === currentUser.id) {
      return;
    }

    setSelectedExchange(listing);
    setProposalOfferedDesc("");
    setProposalQuantity("");
    setProposalUnit("kg");
    setProposalMessage("");
    setShowProposalModal(true);
  };

  const closeProposal = () => {
    if (proposalSubmitting) return;

    setShowProposalModal(false);
    setShowProposalConfirmation(false);
    setSelectedExchange(null);
    setProposalOfferedDesc("");
    setProposalQuantity("");
    setProposalUnit("kg");
    setProposalMessage("");
  };

  const handleReviewProposal = () => {
    if (!proposalOfferedDesc.trim()) {
      alert(
        isId
          ? "Jelaskan material atau kontribusi yang kamu tawarkan."
          : "Please specify what material or contribution you are offering."
      );
      return;
    }

    setShowProposalConfirmation(true);
  };

  const handleFinalSubmitProposal = async () => {
    if (!currentUser || !selectedExchange) return;

    setProposalSubmitting(true);

    try {
      const offeredQuantity = proposalQuantity.trim()
        ? Number(proposalQuantity)
        : null;

      if (
        offeredQuantity !== null &&
        (!Number.isFinite(offeredQuantity) || offeredQuantity <= 0)
      ) {
        throw new Error(
          isId
            ? "Jumlah penawaran tidak valid."
            : "The offered quantity is invalid."
        );
      }

      const { data: proposal, error: proposalError } = await supabase
        .from("exchange_proposals")
        .insert({
          exchange_id: selectedExchange.id,
          proposer_id: currentUser.id,
          target_user_id: selectedExchange.user_id,
          offered_description: proposalOfferedDesc.trim(),
          offered_quantity: offeredQuantity,
          offered_unit: proposalUnit.trim() || "unit",
          message: proposalMessage.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (proposalError) {
        throw proposalError;
      }

      /*
       * Notification failure should NOT make the proposal
       * look like it failed if the proposal itself succeeded.
       */
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: selectedExchange.user_id,
          title: isId
            ? "Proposal pertukaran baru"
            : "New exchange proposal",
          message: isId
            ? `Ada proposal pertukaran baru untuk "${selectedExchange.title}".`
            : `A user submitted an exchange proposal for "${selectedExchange.title}".`,
          link: "/dashboard",
          type: "exchange_proposal",
        });

      if (notificationError) {
        console.warn(
          "NOTIFICATION INSERT WARNING:",
          notificationError.message
        );
      }

      console.log("PROPOSAL CREATED:", proposal?.id);

      alert(
        isId
          ? "Proposal berhasil diajukan! Pemilik listing akan diberi tahu."
          : "Proposal submitted successfully! The listing owner will be notified."
      );

      closeProposal();
    } catch (error: unknown) {
      console.error("PROPOSAL ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : isId
            ? "Gagal mengajukan proposal."
            : "Failed to submit proposal.";

      alert(message);
    } finally {
      setProposalSubmitting(false);
    }
  };

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  const getCategoryLabel = (listing: ExchangeListing) => {
    if (listing.category === "other" && listing.custom_category) {
      return listing.custom_category;
    }

    return (
      CATEGORY_LABELS[listing.category] ||
      listing.category.replaceAll("_", " ")
    );
  };

  const getConditionLabel = (condition: string) => {
    return (
      CONDITION_LABELS[condition] ||
      condition.replaceAll("_", " ")
    );
  };

  const formatLocation = (listing: ExchangeListing) => {
    const parts = [
      listing.district,
      listing.city,
      listing.province,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "Indonesia";
  };

  const hasActiveLocationFilter =
    Boolean(selectedProvince) ||
    Boolean(selectedCity) ||
    Boolean(selectedDistrict);

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#06191d] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <section className="border-b border-white/[0.07] pb-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                <Repeat2 className="h-3.5 w-3.5" />
                {isId
                  ? "Circular Exchange"
                  : "Circular Exchange"}
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {t.exchange.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">
                {t.exchange.subtitle}
              </p>
            </div>

            <Link
              href={
                currentUser
                  ? "/exchange/new"
                  : "/auth/login?redirect=/exchange/new"
              }
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#12544F] bg-[#2A835F] px-6 text-sm font-bold text-white shadow-[0_8px_24px_rgba(42,131,95,0.22)] transition hover:-translate-y-0.5 hover:bg-[#349e73]"
            >
              <Plus className="h-4 w-4" />
              {t.exchange.offerResource}
            </Link>
          </div>
        </section>

        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}

        <section className="mt-8 rounded-3xl border border-emerald-400/10 bg-gradient-to-br from-emerald-400/[0.07] via-white/[0.025] to-transparent p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-300" />

            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              {t.exchange.howItWorksTitle}
            </h2>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              {
                number: "01",
                title: t.exchange.step1,
                desc: t.exchange.step1Desc,
              },
              {
                number: "02",
                title: t.exchange.step2,
                desc: t.exchange.step2Desc,
              },
              {
                number: "03",
                title: t.exchange.step3,
                desc: t.exchange.step3Desc,
              },
            ].map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-white/[0.06] bg-black/10 p-4"
              >
                <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400">
                  {step.number}
                </span>

                <h3 className="mt-2 text-sm font-bold text-white">
                  {step.title}
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-white/40">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================
            SEARCH + TABS
        ====================================================== */}

        <section className="mt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeTab === "available"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {t.exchange.surplusTab ||
                  (isId
                    ? "Material Tersedia"
                    : "Surplus Available")}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("wanted")}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeTab === "wanted"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {t.exchange.wantedTab ||
                  (isId
                    ? "Material Dibutuhkan"
                    : "Materials Wanted")}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("matches")}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeTab === "matches"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "text-white/40 hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />

                  {t.exchange.smartMatchesTab ||
                    (isId ? "Smart Match" : "Smart Matches")}

                  <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9px]">
                    {smartMatches.length}
                  </span>
                </span>
              </button>
            </div>

            <div className="flex w-full gap-2 lg:max-w-md">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder={
                    t.exchange.filterPlaceholder ||
                    (isId
                      ? "Cari material, kategori, kota..."
                      : "Search materials, category, city...")
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/40 focus:bg-white/[0.05]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${
                  showFilters || hasActiveLocationFilter
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {isId ? "Filter" : "Filter"}
                </span>

                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ====================================================
              FILTER PANEL
          ==================================================== */}

          {showFilters && (
            <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <FilterSelect
                  label={isId ? "Provinsi" : "Province"}
                  value={selectedProvince}
                  onChange={handleProvinceChange}
                  placeholder={
                    isId ? "Semua provinsi" : "All provinces"
                  }
                  options={provinces.map((item) => ({
                    value: item.code,
                    label: item.name,
                  }))}
                />

                <FilterSelect
                  label={isId ? "Kota / Kabupaten" : "City / Regency"}
                  value={selectedCity}
                  onChange={handleCityChange}
                  disabled={!selectedProvince}
                  placeholder={
                    isId ? "Semua kota" : "All cities"
                  }
                  options={regencies.map((item) => ({
                    value: item.code,
                    label: item.name,
                  }))}
                />

                <FilterSelect
                  label={isId ? "Kecamatan" : "District"}
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  disabled={!selectedCity}
                  placeholder={
                    isId ? "Semua kecamatan" : "All districts"
                  }
                  options={districts.map((item) => ({
                    value: item.code,
                    label: item.name,
                  }))}
                />
              </div>

              {hasActiveLocationFilter && (
                <button
                  type="button"
                  onClick={clearLocationFilters}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/40 transition hover:text-white"
                >
                  <X className="h-3 w-3" />

                  {isId
                    ? "Hapus filter lokasi"
                    : "Clear location filters"}
                </button>
              )}
            </div>
          )}
        </section>

        {/* ======================================================
            RESULTS META
        ====================================================== */}

        {activeTab !== "matches" && !loading && (
          <div className="mt-7 flex items-center justify-between">
            <p className="text-xs text-white/35">
              {filteredListings.length}{" "}
              {isId ? "listing ditemukan" : "listings found"}
            </p>

            <button
              type="button"
              onClick={() => void loadExchanges(true)}
              disabled={refreshing}
              className="text-xs font-semibold text-emerald-300/70 transition hover:text-emerald-300 disabled:opacity-40"
            >
              {refreshing
                ? isId
                  ? "Memuat..."
                  : "Refreshing..."
                : isId
                  ? "Refresh"
                  : "Refresh"}
            </button>
          </div>
        )}

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <section className="mt-4">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-[330px] animate-pulse rounded-3xl border border-white/[0.07] bg-white/[0.025]"
                />
              ))}
            </div>
          ) : activeTab === "matches" ? (
            <SmartMatches
              matches={smartMatches}
              isId={isId}
              onPropose={openProposal}
            />
          ) : filteredListings.length === 0 ? (
            <EmptyState
              isId={isId}
              searchQuery={searchQuery}
              hasFilters={hasActiveLocationFilter}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
                <ExchangeCard
                  key={listing.id}
                  listing={listing}
                  isOwner={listing.user_id === currentUser?.id}
                  isId={isId}
                  categoryLabel={getCategoryLabel(listing)}
                  conditionLabel={getConditionLabel(listing.condition)}
                  location={formatLocation(listing)}
                  onPropose={() => openProposal(listing)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ========================================================
          PROPOSAL MODAL
      ======================================================== */}

      {showProposalModal && selectedExchange && (
        <ProposalModal
          listing={selectedExchange}
          isId={isId}
          confirmationOpen={showProposalConfirmation}
          offeredDescription={proposalOfferedDesc}
          quantity={proposalQuantity}
          unit={proposalUnit}
          message={proposalMessage}
          submitting={proposalSubmitting}
          onDescriptionChange={setProposalOfferedDesc}
          onQuantityChange={setProposalQuantity}
          onUnitChange={setProposalUnit}
          onMessageChange={setProposalMessage}
          onReview={handleReviewProposal}
          onBack={() => setShowProposalConfirmation(false)}
          onSubmit={handleFinalSubmitProposal}
          onClose={closeProposal}
        />
      )}
    </main>
  );
}

/*
 * ==============================================================
 * FILTER SELECT
 * ==============================================================
 */

function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/35">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-xl border border-white/10 bg-[#0a2020] px-3 text-xs text-white outline-none transition focus:border-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-30 [&>option]:bg-[#0a2020] [&>option]:text-white"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/*
 * ==============================================================
 * EXCHANGE CARD
 * ==============================================================
 */

function ExchangeCard({
  listing,
  isOwner,
  isId,
  categoryLabel,
  conditionLabel,
  location,
  onPropose,
}: {
  listing: ExchangeListing;
  isOwner: boolean;
  isId: boolean;
  categoryLabel: string;
  conditionLabel: string;
  location: string;
  onPropose: () => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.012] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
      {/* Image */}

      <div className="relative h-48 overflow-hidden bg-[#0a2020]">
        {listing.primary_image ? (
          <img
            src={listing.primary_image}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400/[0.08] to-transparent">
            <Package className="h-10 w-10 text-white/10" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-full border border-emerald-300/20 bg-[#06191d]/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300 backdrop-blur">
            {listing.type === "offer"
              ? isId
                ? "MENAWARKAN"
                : "OFFER"
              : isId
                ? "MEMBUTUHKAN"
                : "WANTED"}
          </span>

          <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-semibold text-white/60 backdrop-blur">
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Body */}

      <div className="flex flex-1 flex-col p-5">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/35">
            <MapPin className="h-3 w-3 text-emerald-400" />
            <span className="truncate">{location}</span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-base font-bold leading-6 text-white">
            {listing.title}
          </h3>

          <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/45">
            {listing.description}
          </p>
        </div>

        {/* Details */}

        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-white/30">
              {isId ? "Jumlah" : "Quantity"}
            </span>

            <span className="text-sm font-bold text-emerald-300">
              {listing.quantity} {listing.unit}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-2">
            <span className="text-[10px] text-white/30">
              {isId ? "Kondisi" : "Condition"}
            </span>

            <span className="truncate text-[11px] font-semibold text-white/70">
              {conditionLabel}
            </span>
          </div>

          {listing.preferred_item && (
            <div className="mt-2 border-t border-white/[0.05] pt-2">
              <span className="block text-[10px] text-white/30">
                {isId ? "Preferensi pertukaran" : "Trade preference"}
              </span>

              <span className="mt-0.5 block truncate text-[11px] font-semibold text-amber-300/80">
                {listing.preferred_item}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}

        <div className="mt-auto pt-5">
          {isOwner ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] py-3 text-[10px] font-bold uppercase tracking-wider text-white/30">
              <CheckCircle2 className="h-3.5 w-3.5" />

              {isId ? "Listing kamu" : "Your listing"}
            </div>
          ) : (
            <button
              type="button"
              onClick={onPropose}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#12544F] bg-[#2A835F] py-3 text-xs font-bold text-white transition hover:bg-[#349e73]"
            >
              {isId
                ? "Ajukan Pertukaran"
                : "Propose Exchange"}

              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/*
 * ==============================================================
 * SMART MATCHES
 * ==============================================================
 */

function SmartMatches({
  matches,
  isId,
  onPropose,
}: {
  matches: Match[];
  isId: boolean;
  onPropose: (listing: ExchangeListing) => void;
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
        <Sparkles className="mx-auto h-9 w-9 text-emerald-400/30" />

        <h3 className="mt-4 text-base font-bold text-white">
          {isId
            ? "Belum ada Smart Match"
            : "No Smart Matches Yet"}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/35">
          {isId
            ? "ARVENA akan mencocokkan material yang tersedia dengan kebutuhan komunitas berdasarkan kategori dan lokasi."
            : "ARVENA matches available materials with community demand using category and location signals."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-300" />

          <p className="text-xs font-semibold text-emerald-200">
            {isId
              ? `${matches.length} peluang pertukaran ditemukan`
              : `${matches.length} exchange opportunities found`}
          </p>
        </div>
      </div>

      {matches.map((match, index) => (
        <div
          key={`${match.offer.id}-${match.request.id}-${index}`}
          className="rounded-3xl border border-emerald-400/15 bg-gradient-to-r from-emerald-400/[0.045] to-white/[0.012] p-5 sm:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
            {/* Offer */}

            <MatchListing
              listing={match.offer}
              label={isId ? "MATERIAL TERSEDIA" : "SUPPLY"}
              isId={isId}
            />

            <div className="hidden items-center justify-center lg:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
                <ArrowRight className="h-4 w-4 text-emerald-300" />
              </div>
            </div>

            {/* Demand */}

            <MatchListing
              listing={match.request}
              label={isId ? "KEBUTUHAN" : "DEMAND"}
              isId={isId}
            />

            {/* Action */}

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">
                {match.score}%{" "}
                {isId ? "MATCH" : "MATCH"}
              </div>

              <div className="flex flex-wrap gap-1">
                {match.reasons.slice(0, 3).map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full border border-white/[0.06] px-2 py-1 text-[9px] text-white/35"
                  >
                    {reason}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onPropose(match.offer)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#12544F] bg-[#2A835F] px-4 py-2.5 text-[10px] font-bold text-white transition hover:bg-[#349e73]"
              >
                {isId ? "Ajukan Trade" : "Propose Trade"}

                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchListing({
  listing,
  label,
}: {
  listing: ExchangeListing;
  label: string;
  isId: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#07191c] p-4">
      <span className="text-[9px] font-black tracking-[0.16em] text-emerald-400">
        {label}
      </span>

      <h3 className="mt-1.5 line-clamp-2 text-sm font-bold text-white">
        {listing.title}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/35">
        <span>
          {listing.quantity} {listing.unit}
        </span>

        {listing.city && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {listing.city}
          </span>
        )}
      </div>
    </div>
  );
}

/*
 * ==============================================================
 * EMPTY STATE
 * ==============================================================
 */

function EmptyState({
  isId,
  searchQuery,
  hasFilters,
}: {
  isId: boolean;
  searchQuery: string;
  hasFilters: boolean;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
      <Package className="mx-auto h-9 w-9 text-white/15" />

      <h3 className="mt-4 text-sm font-bold text-white">
        {isId ? "Belum ada listing" : "No listings found"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/35">
        {searchQuery || hasFilters
          ? isId
            ? "Coba ubah kata pencarian atau filter lokasi."
            : "Try adjusting your search query or location filters."
          : isId
            ? "Belum ada material yang tersedia di exchange ini."
            : "There are no materials available in this exchange yet."}
      </p>
    </div>
  );
}

/*
 * ==============================================================
 * PROPOSAL MODAL
 * ==============================================================
 */

function ProposalModal({
  listing,
  isId,
  confirmationOpen,
  offeredDescription,
  quantity,
  unit,
  message,
  submitting,
  onDescriptionChange,
  onQuantityChange,
  onUnitChange,
  onMessageChange,
  onReview,
  onBack,
  onSubmit,
  onClose,
}: {
  listing: ExchangeListing;
  isId: boolean;
  confirmationOpen: boolean;
  offeredDescription: string;
  quantity: string;
  unit: string;
  message: string;
  submitting: boolean;
  onDescriptionChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onReview: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#07191c] shadow-2xl">
        {!confirmationOpen ? (
          <>
            {/* Header */}

            <div className="border-b border-white/[0.07] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                    <Repeat2 className="h-3.5 w-3.5" />

                    {isId
                      ? "Ajukan Pertukaran"
                      : "Propose Exchange"}
                  </div>

                  <h2 className="mt-2 text-lg font-bold text-white">
                    {listing.title}
                  </h2>

                  <p className="mt-1 text-xs text-white/35">
                    {isId
                      ? "Jelaskan apa yang kamu tawarkan sebagai pertukaran."
                      : "Describe what you are offering in exchange."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-white/30 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Form */}

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/65">
                  {isId
                    ? "Material yang kamu tawarkan"
                    : "Material you offer"}{" "}
                  *
                </label>

                <input
                  type="text"
                  value={offeredDescription}
                  onChange={(event) =>
                    onDescriptionChange(event.target.value)
                  }
                  placeholder={
                    isId
                      ? "Contoh: 20 kg botol PET bersih"
                      : "e.g. 20 kg clean PET bottles"
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0a2020] p-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-emerald-400/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/65">
                    {isId ? "Jumlah" : "Quantity"}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(event) =>
                      onQuantityChange(event.target.value)
                    }
                    placeholder="20"
                    className="w-full rounded-xl border border-white/10 bg-[#0a2020] p-3 text-xs text-white outline-none focus:border-emerald-400/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/65">
                    {isId ? "Satuan" : "Unit"}
                  </label>

                  <input
                    type="text"
                    value={unit}
                    onChange={(event) =>
                      onUnitChange(event.target.value)
                    }
                    placeholder="kg"
                    className="w-full rounded-xl border border-white/10 bg-[#0a2020] p-3 text-xs text-white outline-none focus:border-emerald-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/65">
                  {isId
                    ? "Pesan tambahan"
                    : "Additional message"}
                </label>

                <textarea
                  rows={4}
                  value={message}
                  onChange={(event) =>
                    onMessageChange(event.target.value)
                  }
                  placeholder={
                    isId
                      ? "Tambahkan informasi mengenai pengambilan, lokasi, atau kesepakatan..."
                      : "Add information about pickup, location, or trade terms..."
                  }
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0a2020] p-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 focus:border-emerald-400/40"
                />
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] p-3.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/70" />

                <p className="text-[10px] leading-5 text-white/40">
                  {isId
                    ? "Pastikan informasi penawaran sesuai kondisi sebenarnya. Kesepakatan pertukaran dilakukan langsung antar pengguna."
                    : "Make sure your offer accurately represents the material. The final exchange agreement is made directly between users."}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/45 transition hover:text-white"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>

                <button
                  type="button"
                  onClick={onReview}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#12544F] bg-[#2A835F] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#349e73]"
                >
                  {isId ? "Review Proposal" : "Review Proposal"}

                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation */}

            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-white">
                    {isId
                      ? "Konfirmasi Proposal"
                      : "Confirm Proposal"}
                  </h2>

                  <p className="mt-0.5 text-[10px] text-white/35">
                    {isId
                      ? "Periksa kembali sebelum dikirim."
                      : "Review before sending."}
                  </p>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07]">
                <div className="border-b border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30">
                    {isId
                      ? "Listing tujuan"
                      : "Target listing"}
                  </span>

                  <p className="mt-1 text-sm font-bold text-white">
                    {listing.title}
                  </p>
                </div>

                <div className="p-4">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30">
                    {isId
                      ? "Penawaran kamu"
                      : "Your offer"}
                  </span>

                  <p className="mt-1 text-sm font-bold text-emerald-300">
                    {offeredDescription}
                  </p>

                  {quantity && (
                    <p className="mt-1 text-xs text-white/40">
                      {quantity} {unit}
                    </p>
                  )}

                  {message && (
                    <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-5 text-white/45">
                      {message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />

                <p className="text-[10px] leading-5 text-white/40">
                  {isId
                    ? "Proposal akan dikirim kepada pemilik listing dan masuk ke proses review."
                    : "The proposal will be sent to the listing owner for review."}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={submitting}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/45 transition hover:text-white disabled:opacity-40"
                >
                  {isId ? "Kembali" : "Back"}
                </button>

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting}
                  className="rounded-xl border border-[#12544F] bg-[#2A835F] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#349e73] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting
                    ? isId
                      ? "Mengirim..."
                      : "Sending..."
                    : isId
                      ? "Kirim Proposal"
                      : "Send Proposal"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}