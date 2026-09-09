"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  X,
  Plus,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { useLanguage } from "@/lib/i18n/context";
import { getDictionary } from "@/lib/i18n/dictionary";

type Region = {
  code: string;
  name: string;
};

const UNITS = [
  "kg",
  "ton",
  "liter",
  "m2",
  "unit",
  "pcs",
  "bundel",
  "karung",
  "drum",
  "kubik",
];

const MAX_ADDITIONAL_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ExchangeNewPage() {
  const { locale } = useLanguage();
  const t = getDictionary(locale);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [type, setType] = useState<"offer" | "request">("offer");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("organic");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("good");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [preferredItem, setPreferredItem] = useState("");
  const [notes, setNotes] = useState("");

  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();

        if (!mounted) return;

        if (authError || !data.user) {
          router.replace("/auth/login?redirect=/exchange/new");
          return;
        }

        setUserId(data.user.id);
      } catch (err) {
        console.error("AUTH CHECK ERROR:", err);
        if (mounted) router.replace("/auth/login?redirect=/exchange/new");
      } finally {
        if (mounted) setAuthChecking(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [supabase, router]);

  useEffect(() => {
    async function loadProvinces() {
      try {
        const response = await fetch("/api/regions/provinces", {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Gagal mengambil data provinsi.");

        const result = await response.json();
        const provinceData = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        setProvinces(provinceData);
      } catch (err) {
        console.error("LOAD PROVINCES ERROR:", err);
        setProvinces([]);
      }
    }

    loadProvinces();
  }, []);

  async function handleProvinceChange(code: string) {
    setSelectedProvince(code);
    setSelectedCity("");
    setSelectedDistrict("");
    setCities([]);
    setDistricts([]);
    setError(null);

    if (!code) return;

    try {
      const response = await fetch(
        `/api/regions/regencies/${encodeURIComponent(code)}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Failed to load cities");

      const result = await response.json();

      // The regions API returns { data: [...] }. Older code expected
      // { regencies: [...] }, which caused cities to become an object and
      // crashed the page when React tried to run cities.map().
      const cityData = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.regencies)
            ? result.regencies
            : [];

      setCities(cityData);
    } catch (err) {
      console.error("LOAD CITIES ERROR:", err);
      setCities([]);
      setError(
        locale === "id"
          ? "Gagal memuat daftar kota."
          : "Failed to load cities."
      );
    }
  }

  async function handleCityChange(code: string) {
    setSelectedCity(code);
    setSelectedDistrict("");
    setDistricts([]);
    setError(null);

    if (!code) return;

    try {
      const response = await fetch(
        `/api/regions/districts/${encodeURIComponent(code)}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Failed to load districts");

      const result = await response.json();

      // Keep this defensive for both the current { data: [...] } response
      // and the previous { districts: [...] } shape.
      const districtData = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.districts)
            ? result.districts
            : [];

      setDistricts(districtData);
    } catch (err) {
      console.error("LOAD DISTRICTS ERROR:", err);
      setDistricts([]);
      setError(
        locale === "id"
          ? "Gagal memuat daftar kecamatan."
          : "Failed to load districts."
      );
    }
  }

  function validateImage(file: File): boolean {
    if (!file.type.startsWith("image/")) {
      setError(
        locale === "id"
          ? "File yang dipilih harus berupa gambar."
          : "Selected file must be an image."
      );
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        locale === "id"
          ? "Ukuran gambar maksimal 5 MB."
          : "Maximum image size is 5 MB."
      );
      return false;
    }

    return true;
  }

  function handlePrimaryImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !validateImage(file)) return;

    if (primaryImagePreview) URL.revokeObjectURL(primaryImagePreview);

    const previewUrl = URL.createObjectURL(file);
    setPrimaryImageFile(file);
    setPrimaryImagePreview(previewUrl);
    setError(null);
  }

  function removePrimaryImage() {
    if (primaryImagePreview) URL.revokeObjectURL(primaryImagePreview);
    setPrimaryImageFile(null);
    setPrimaryImagePreview(null);
  }

  function handleAdditionalImageChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = "";
    if (!selectedFiles.length) return;

    const remaining = MAX_ADDITIONAL_IMAGES - additionalImageFiles.length;

    if (remaining <= 0) {
      setError(
        locale === "id"
          ? "Maksimal 3 foto tambahan."
          : "Maximum 3 additional images."
      );
      return;
    }

    const validFiles = selectedFiles.filter(validateImage);
    const filesToAdd = validFiles.slice(0, remaining);
    if (!filesToAdd.length) return;

    const updatedFiles = [...additionalImageFiles, ...filesToAdd];
    additionalImagePreviews.forEach((url) => URL.revokeObjectURL(url));

    const updatedPreviews = updatedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setAdditionalImageFiles(updatedFiles);
    setAdditionalImagePreviews(updatedPreviews);
    setError(null);
  }

  function removeAdditionalImage(idx: number) {
    const updatedFiles = additionalImageFiles.filter((_, i) => i !== idx);

    if (additionalImagePreviews[idx]) {
      URL.revokeObjectURL(additionalImagePreviews[idx]);
    }

    const updatedPreviews = updatedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    additionalImagePreviews.forEach((url, i) => {
      if (i !== idx) URL.revokeObjectURL(url);
    });

    setAdditionalImageFiles(updatedFiles);
    setAdditionalImagePreviews(updatedPreviews);
  }

  useEffect(() => {
    return () => {
      if (primaryImagePreview) URL.revokeObjectURL(primaryImagePreview);
      additionalImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = /^[a-z0-9]+$/i.test(ext) ? ext : "jpg";
    const fileName = `exchange-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from("exchange-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("IMAGE UPLOAD ERROR:", uploadError);
      throw new Error(
        locale === "id"
          ? "Gagal mengunggah foto material."
          : "Failed to upload material image."
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("exchange-images").getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error(
        locale === "id"
          ? "URL foto tidak berhasil dibuat."
          : "Failed to generate image URL."
      );
    }

    return publicUrl;
  }

  function validateForm(): boolean {
    if (!title.trim()) {
      setError(
        locale === "id"
          ? "Judul material wajib diisi."
          : "Material title is required."
      );
      return false;
    }

    if (!description.trim()) {
      setError(
        locale === "id"
          ? "Deskripsi material wajib diisi."
          : "Material description is required."
      );
      return false;
    }

    if (!quantity.trim()) {
      setError(
        locale === "id" ? "Jumlah material wajib diisi." : "Quantity is required."
      );
      return false;
    }

    const numericQuantity = Number(quantity);
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setError(
        locale === "id"
          ? "Jumlah material harus lebih dari 0."
          : "Quantity must be greater than 0."
      );
      return false;
    }

    if (category === "other" && !customCategory.trim()) {
      setError(
        locale === "id"
          ? "Silakan isi jenis material."
          : "Please specify the material type."
      );
      return false;
    }

    return true;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      setError(
        locale === "id"
          ? "Sesi pengguna tidak ditemukan. Silakan login kembali."
          : "User session not found. Please log in again."
      );
      return;
    }

    if (!validateForm()) return;

    setError(null);
    setSubmitting(true);

    try {
      const provName =
        provinces.find((p) => p.code === selectedProvince)?.name || null;
      const cityName =
        cities.find((c) => c.code === selectedCity)?.name || null;
      const distName =
        districts.find((d) => d.code === selectedDistrict)?.name || null;

      let primaryUrl: string | null = null;
      if (primaryImageFile) primaryUrl = await uploadImage(primaryImageFile);

      const additionalUrls: string[] = [];
      for (const file of additionalImageFiles) {
        additionalUrls.push(await uploadImage(file));
      }

      const { error: insertError } = await supabase
        .from("exchanges")
        .insert({
          user_id: userId,
          type,
          title: title.trim(),
          category,
          custom_category:
            category === "other" ? customCategory.trim() : null,
          description: description.trim(),
          condition,
          quantity: Number(quantity),
          unit,
          preferred_item: preferredItem.trim() || null,
          notes: notes.trim() || null,
          primary_image: primaryUrl,
          additional_images: additionalUrls,
          province: provName,
          city: cityName,
          district: distName,
          status: "open",
        });

      if (insertError) throw insertError;

      setSuccess(true);
      window.setTimeout(() => router.push("/exchange"), 1800);
    } catch (err: unknown) {
      console.error("EXCHANGE CREATE ERROR:", err);

      if (typeof err === "object" && err !== null && "message" in err) {
        setError(String((err as { message?: unknown }).message));
      } else {
        setError(
          locale === "id"
            ? "Gagal membuat listing. Silakan coba lagi."
            : "Failed to create listing. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authChecking) {
    return (
      <main className="min-h-screen bg-[#092328] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#092328] flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">
            {locale === "id"
              ? "Listing pertukaran berhasil dipublikasikan!"
              : "Exchange listing published!"}
          </h2>
          <p className="mt-2 text-sm text-white/50">
            {locale === "id"
              ? "Mengalihkan ke hub pertukaran..."
              : "Redirecting to Exchange marketplace..."}
          </p>
        </div>
      </main>
    );
  }

  const categoryList = [
    { id: "organic", label: t.categories.organic },
    { id: "plastic", label: t.categories.plastic },
    { id: "paper", label: t.categories.paper },
    { id: "metal", label: t.categories.metal },
    { id: "electronic", label: t.categories.electronic },
    { id: "food", label: t.categories.food },
    { id: "textile", label: t.categories.textile },
    { id: "other", label: t.categories.other },
  ];

  const conditionList = [
    { id: "usable", label: t.conditions.usable },
    { id: "used_good", label: t.conditions.used_good },
    { id: "like_new", label: t.conditions.like_new },
    { id: "raw_waste", label: t.conditions.raw_waste },
  ];

  return (
    <main className="min-h-screen bg-[#092328] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <Link
            href="/exchange"
            className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white transition mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {locale === "id" ? "Kembali ke Pertukaran" : "Back to Exchange"}
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <Repeat className="h-3 w-3" />
            <span>
              {locale === "id"
                ? "BARTER & PENCOCOKAN SIRKULAR"
                : "CIRCULAR BARTER & MATCHING"}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold sm:text-3xl text-white">
            {t.exchange.createListingTitle}
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {t.exchange.createListingDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              {t.exchange.exchangeTypeLabel || "Listing Type"} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["offer", "request"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setType(mode)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    type === mode
                      ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {mode === "offer"
                    ? t.exchange.iHaveMaterial
                    : t.exchange.iNeedMaterial}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              {locale === "id" ? "Detail Material" : "Material Details"}
            </label>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                {t.exchange.listingTitleLabel} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  locale === "en"
                    ? "e.g. Organic coffee grounds, Used wooden pallets..."
                    : "cth. Ampas kopi organik, Palet kayu bekas..."
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-400/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  {t.exchange.categoryLabel} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  {categoryList.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {category === "other" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t.exchange.customMaterialLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder={
                      locale === "en"
                        ? "e.g. Sawdust, Used cooking oil..."
                        : "cth. Serbuk kayu, Minyak jelantah..."
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-400/50"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                {t.exchange.descriptionAndSpecsLabel} *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  locale === "en"
                    ? "Quality, purity, storage condition, pickup notes..."
                    : "Kualitas, kemurnian, kondisi penyimpanan, catatan penjemputan..."
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-400/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  {t.exchange.quantityLabel} *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-400/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  {t.exchange.proposalUnitLabel || "Unit"}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  {t.exchange.conditionLabel}
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  {conditionList.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                {type === "offer"
                  ? t.exchange.preferredItemInReturn
                  : locale === "id"
                    ? "Alternatif yang Diterima (opsional)"
                    : "Acceptable Alternatives (optional)"}
              </label>
              <input
                type="text"
                value={preferredItem}
                onChange={(e) => setPreferredItem(e.target.value)}
                placeholder={
                  type === "offer"
                    ? locale === "en"
                      ? "e.g. Cardboard scrap, HDPE plastic..."
                      : "cth. Kardus bekas, Plastik HDPE..."
                    : locale === "en"
                      ? "Any similar material acceptable"
                      : "Material sejenis yang dapat diterima"
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-400/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                {locale === "id" ? "Catatan Tambahan (opsional)" : "Additional Notes (optional)"}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  locale === "en"
                    ? "Pickup schedule, packaging requirements..."
                    : "Jadwal pengambilan, ketentuan pengemasan..."
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-400/50 resize-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              {locale === "id" ? "Foto Material" : "Material Images"}
            </label>

            <div>
              <span className="mb-2 block text-xs font-medium text-white/60">
                {t.exchange.primaryImageLabel}
              </span>
              {primaryImagePreview ? (
                <div className="relative inline-block rounded-2xl border border-emerald-400/30 overflow-hidden">
                  <img src={primaryImagePreview} alt="Primary material" className="h-36 w-48 object-cover" />
                  <button
                    type="button"
                    onClick={removePrimaryImage}
                    className="absolute top-2 right-2 rounded-full bg-red-600/90 p-1 text-white hover:bg-red-500"
                    aria-label="Remove primary image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 cursor-pointer hover:border-emerald-400/30 hover:bg-white/[0.04] transition">
                  <Camera className="h-6 w-6 text-emerald-400/70" />
                  <span className="text-xs font-semibold text-white/70">{t.exchange.uploadPrimaryPhoto}</span>
                  <span className="text-[10px] text-white/35">{t.exchange.uploadHint}</span>
                  <input type="file" accept="image/*" onChange={handlePrimaryImageChange} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">
                  {t.exchange.additionalImagesLabel} ({additionalImageFiles.length}/{MAX_ADDITIONAL_IMAGES})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {additionalImagePreviews.map((src, idx) => (
                  <div key={`${src}-${idx}`} className="relative rounded-xl border border-white/10 overflow-hidden">
                    <img src={src} alt={`Material detail ${idx + 1}`} className="h-24 w-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(idx)}
                      className="absolute top-1 right-1 rounded-full bg-red-600/90 p-0.5 text-white hover:bg-red-500"
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {additionalImageFiles.length < MAX_ADDITIONAL_IMAGES && (
                  <label className="flex flex-col items-center justify-center h-24 w-24 rounded-xl border border-dashed border-white/20 bg-white/[0.02] cursor-pointer hover:border-emerald-400/30 hover:bg-white/[0.04] transition">
                    <Plus className="h-5 w-5 text-white/40" />
                    <span className="text-[10px] text-white/30 mt-1">{t.exchange.addImage}</span>
                    <input type="file" accept="image/*" multiple onChange={handleAdditionalImageChange} className="hidden" />
                  </label>
                )}
              </div>
              <p className="mt-2 text-[10px] text-white/30">
                {locale === "id" ? "Format gambar maksimal 5 MB per file." : "Maximum 5 MB per image."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
              {t.common.location}
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.exchange.provinceLabel}</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  <option value="" className="bg-[#0b1d17] text-white">{t.exchange.selectProvince}</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code} className="bg-[#0b1d17] text-white">{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.exchange.cityLabel}</label>
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!selectedProvince}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 disabled:opacity-40 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  <option value="" className="bg-[#0b1d17] text-white">{t.exchange.selectCity}</option>
                  {cities.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0b1d17] text-white">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.exchange.districtLabel}</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedCity}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 disabled:opacity-40 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  <option value="" className="bg-[#0b1d17] text-white">{t.exchange.selectDistrict}</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code} className="bg-[#0b1d17] text-white">{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-2">
            <Link
              href="/exchange"
              className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/60 hover:text-white transition"
            >
              {t.exchange.cancelBtn}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-8 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(42,131,95,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#32a070] disabled:opacity-60 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.exchange.publishing}</span>
                </>
              ) : (
                <>
                  <Repeat className="h-4 w-4" />
                  <span>{t.exchange.confirmGoLive}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}