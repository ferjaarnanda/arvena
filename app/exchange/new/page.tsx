"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Plus,
  Repeat,
  X,
} from "lucide-react";

import { useLanguage } from "@/lib/i18n/context";
import { getDictionary } from "@/lib/i18n/dictionary";

type Region = {
  code: string;
  name: string;
};

type ProfileLocation = {
  province: string;
  province_code: string;
  city: string;
  city_code: string;
  district: string;
  district_code: string;
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
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_IMAGE_SIZE = 20 * 1024 * 1024;

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

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
  const [condition, setCondition] = useState("usable");
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

  const [profileLoading, setProfileLoading] = useState(true);
  const [useProfileLocation, setUseProfileLocation] = useState(true);
  const [profileLocation, setProfileLocation] = useState<ProfileLocation>({
    province: "",
    province_code: "",
    city: "",
    city_code: "",
    district: "",
    district_code: "",
  });

  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string | null>(
    null
  );
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<
    string[]
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const primaryPreviewRef = useRef<string | null>(null);
  const additionalPreviewRef = useRef<string[]>([]);

  const totalImageSize =
    (primaryImageFile?.size || 0) +
    additionalImageFiles.reduce((total, file) => total + file.size, 0);

  const totalImages =
    (primaryImageFile ? 1 : 0) + additionalImageFiles.length;

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

  function formatFileSize(bytes: number): string {
    if (bytes <= 0) return "0 KB";

    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function normalizeRegionResult(result: unknown, key: string): Region[] {
    if (Array.isArray(result)) return result as Region[];

    if (
      typeof result === "object" &&
      result !== null &&
      Array.isArray((result as Record<string, unknown>).data)
    ) {
      return (result as { data: Region[] }).data;
    }

    if (
      typeof result === "object" &&
      result !== null &&
      Array.isArray((result as Record<string, unknown>)[key])
    ) {
      return (result as Record<string, unknown>)[key] as Region[];
    }

    return [];
  }

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

        if (mounted) {
          router.replace("/auth/login?redirect=/exchange/new");
        }
      } finally {
        if (mounted) {
          setAuthChecking(false);
        }
      }
    }

    void checkAuth();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  useEffect(() => {
    async function loadProvinces() {
      try {
        const response = await fetch("/api/regions/provinces", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load provinces");
        }

        const result = await response.json();
        setProvinces(normalizeRegionResult(result, "provinces"));
      } catch (err) {
        console.error("LOAD PROVINCES ERROR:", err);
        setProvinces([]);
      }
    }

    void loadProvinces();
  }, []);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    async function loadProfileLocation() {
      setProfileLoading(true);

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(
            "province, province_code, city, city_code, district, district_code"
          )
          .eq("id", userId)
          .single();

        if (!mounted) return;

        if (profileError || !profile) {
          setUseProfileLocation(false);
          return;
        }

        const location: ProfileLocation = {
          province: profile.province || "",
          province_code: profile.province_code || "",
          city: profile.city || "",
          city_code: profile.city_code || "",
          district: profile.district || "",
          district_code: profile.district_code || "",
        };

        setProfileLocation(location);

        const complete = Boolean(
          location.province_code &&
            location.city_code &&
            location.district_code
        );

        if (!complete) {
          setUseProfileLocation(false);
          return;
        }

        setSelectedProvince(location.province_code);
        setSelectedCity(location.city_code);
        setSelectedDistrict(location.district_code);
        setUseProfileLocation(true);

        try {
          const cityResponse = await fetch(
            `/api/regions/regencies/${encodeURIComponent(
              location.province_code
            )}`,
            { cache: "no-store" }
          );

          if (cityResponse.ok) {
            const cityResult = await cityResponse.json();
            const cityData = normalizeRegionResult(cityResult, "regencies");

            if (mounted) {
              setCities(cityData);
            }
          }

          const districtResponse = await fetch(
            `/api/regions/districts/${encodeURIComponent(location.city_code)}`,
            { cache: "no-store" }
          );

          if (districtResponse.ok) {
            const districtResult = await districtResponse.json();
            const districtData = normalizeRegionResult(
              districtResult,
              "districts"
            );

            if (mounted) {
              setDistricts(districtData);
            }
          }
        } catch (regionError) {
          console.error("LOAD PROFILE REGIONS ERROR:", regionError);
        }
      } catch (err) {
        console.error("LOAD PROFILE LOCATION ERROR:", err);

        if (mounted) {
          setUseProfileLocation(false);
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfileLocation();

    return () => {
      mounted = false;
    };
  }, [supabase, userId]);

  async function handleProvinceChange(code: string) {
    setUseProfileLocation(false);
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

      if (!response.ok) {
        throw new Error("Failed to load cities");
      }

      const result = await response.json();
      setCities(normalizeRegionResult(result, "regencies"));
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
    setUseProfileLocation(false);
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

      if (!response.ok) {
        throw new Error("Failed to load districts");
      }

      const result = await response.json();
      setDistricts(normalizeRegionResult(result, "districts"));
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

  async function restoreProfileRegions(location: ProfileLocation) {
    if (!location.province_code || !location.city_code) return;

    try {
      const cityResponse = await fetch(
        `/api/regions/regencies/${encodeURIComponent(
          location.province_code
        )}`,
        { cache: "no-store" }
      );

      if (cityResponse.ok) {
        const cityResult = await cityResponse.json();
        setCities(normalizeRegionResult(cityResult, "regencies"));
      }

      const districtResponse = await fetch(
        `/api/regions/districts/${encodeURIComponent(location.city_code)}`,
        { cache: "no-store" }
      );

      if (districtResponse.ok) {
        const districtResult = await districtResponse.json();
        setDistricts(normalizeRegionResult(districtResult, "districts"));
      }
    } catch (err) {
      console.error("RESTORE PROFILE REGIONS ERROR:", err);
    }
  }

  function handleProfileLocationToggle(checked: boolean) {
    setUseProfileLocation(checked);
    setError(null);

    if (!checked) {
      setSelectedProvince("");
      setSelectedCity("");
      setSelectedDistrict("");
      return;
    }

    if (
      !profileLocation.province_code ||
      !profileLocation.city_code ||
      !profileLocation.district_code
    ) {
      setUseProfileLocation(false);

      setError(
        locale === "id"
          ? "Lokasi profil belum lengkap. Silakan lengkapi lokasi di profil terlebih dahulu."
          : "Your profile location is incomplete. Please complete it in your profile first."
      );
      return;
    }

    setSelectedProvince(profileLocation.province_code);
    setSelectedCity(profileLocation.city_code);
    setSelectedDistrict(profileLocation.district_code);

    void restoreProfileRegions(profileLocation);
  }

  function validateImage(file: File): boolean {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError(
        locale === "id"
          ? "Gunakan gambar PNG, JPG, atau WebP."
          : "Use a PNG, JPG, or WebP image."
      );
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        locale === "id"
          ? "Ukuran setiap gambar maksimal 5 MB."
          : "Each image must be 5 MB or smaller."
      );
      return false;
    }

    return true;
  }

  function handlePrimaryImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !validateImage(file)) return;

    if (primaryPreviewRef.current) {
      URL.revokeObjectURL(primaryPreviewRef.current);
    }

    const preview = URL.createObjectURL(file);
    primaryPreviewRef.current = preview;

    setPrimaryImageFile(file);
    setPrimaryImagePreview(preview);
    setError(null);
  }

  function removePrimaryImage() {
    if (primaryPreviewRef.current) {
      URL.revokeObjectURL(primaryPreviewRef.current);
      primaryPreviewRef.current = null;
    }

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
          ? "Maksimal 3 foto detail."
          : "Maximum 3 detail photos."
      );
      return;
    }

    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (validFiles.length >= remaining) break;

      if (validateImage(file)) {
        validFiles.push(file);
      }
    }

    if (!validFiles.length) return;

    const newTotalSize =
      totalImageSize +
      validFiles.reduce((total, file) => total + file.size, 0);

    if (newTotalSize > MAX_TOTAL_IMAGE_SIZE) {
      setError(
        locale === "id"
          ? "Total ukuran seluruh foto maksimal 20 MB."
          : "The total size of all photos must not exceed 20 MB."
      );
      return;
    }

    additionalPreviewRef.current.forEach((url) => URL.revokeObjectURL(url));

    const updatedFiles = [...additionalImageFiles, ...validFiles];
    const updatedPreviews = updatedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    additionalPreviewRef.current = updatedPreviews;

    setAdditionalImageFiles(updatedFiles);
    setAdditionalImagePreviews(updatedPreviews);
    setError(null);
  }

  function removeAdditionalImage(index: number) {
    const updatedFiles = additionalImageFiles.filter(
      (_, fileIndex) => fileIndex !== index
    );

    const updatedPreviews = updatedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    additionalPreviewRef.current.forEach((url) => URL.revokeObjectURL(url));

    additionalPreviewRef.current = updatedPreviews;

    setAdditionalImageFiles(updatedFiles);
    setAdditionalImagePreviews(updatedPreviews);
  }

  useEffect(() => {
    return () => {
      if (primaryPreviewRef.current) {
        URL.revokeObjectURL(primaryPreviewRef.current);
      }

      additionalPreviewRef.current.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, []);

  async function uploadImage(file: File): Promise<string> {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const safeExtension = /^(png|jpe?g|webp)$/i.test(extension)
      ? extension
      : "jpg";

    const fileName = `exchange-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${safeExtension}`;

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
        locale === "id"
          ? "Jumlah material wajib diisi."
          : "Quantity is required."
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

    if (!selectedProvince || !selectedCity || !selectedDistrict) {
      setError(
        locale === "id"
          ? "Provinsi, kota/kabupaten, dan kecamatan wajib dipilih."
          : "Province, city/regency, and district are required."
      );
      return false;
    }

    if (totalImageSize > MAX_TOTAL_IMAGE_SIZE) {
      setError(
        locale === "id"
          ? "Total ukuran seluruh foto maksimal 20 MB."
          : "The total size of all photos must not exceed 20 MB."
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
      const provinceName =
        provinces.find((item) => item.code === selectedProvince)?.name ||
        profileLocation.province ||
        null;

      const cityName =
        cities.find((item) => item.code === selectedCity)?.name ||
        profileLocation.city ||
        null;

      const districtName =
        districts.find((item) => item.code === selectedDistrict)?.name ||
        profileLocation.district ||
        null;

      let primaryUrl: string | null = null;

      if (primaryImageFile) {
        primaryUrl = await uploadImage(primaryImageFile);
      }

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
          province: provinceName,
          city: cityName,
          district: districtName,
          status: "open",
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      window.setTimeout(() => router.push("/exchange"), 1800);
    } catch (err: unknown) {
      console.error("EXCHANGE CREATE ERROR:", err);

      if (typeof err === "object" && err !== null && "message" in err) {
        setError(String((err as { message?: unknown }).message));
      } else {
        setError(
          locale === "id"
            ? "Gagal membuat pertukaran. Silakan coba lagi."
            : "Failed to create exchange. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#092328]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#092328] px-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />

          <h2 className="text-xl font-bold text-white">
            {locale === "id"
              ? "Pertukaran berhasil dipublikasikan!"
              : "Exchange published successfully!"}
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

  return (
    <main className="min-h-screen bg-[#092328] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <Repeat className="h-3 w-3" />

            <span>
              {locale === "id"
                ? "BARTER & PENCOCOKAN SIRKULAR"
                : "CIRCULAR BARTER & MATCHING"}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {locale === "id"
              ? "Buat Pertukaran Sirkular"
              : "Create Circular Exchange"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            {locale === "id"
              ? "Tawarkan material surplus atau minta sumber daya sekunder yang Anda butuhkan."
              : "Offer surplus materials or request secondary resources you need."}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* JENIS PERTUKARAN */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
              {locale === "id" ? "Jenis Pertukaran" : "Exchange Type"} *
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setType("offer")}
                className={`rounded-xl border px-4 py-4 text-sm font-semibold transition-all ${
                  type === "offer"
                    ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                    : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {t.exchange.iHaveMaterial}
              </button>

              <button
                type="button"
                onClick={() => setType("request")}
                className={`rounded-xl border px-4 py-4 text-sm font-semibold transition-all ${
                  type === "request"
                    ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                    : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {t.exchange.iNeedMaterial}
              </button>
            </div>
          </section>

          {/* DETAIL MATERIAL */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
              {locale === "id" ? "Detail Material" : "Material Details"}
            </h2>

            <div className="space-y-4">
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
                    locale === "id"
                      ? "cth. Ampas kopi organik, Palet kayu bekas..."
                      : "e.g. Organic coffee grounds, Used wooden pallets..."
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t.exchange.categoryLabel} *
                  </label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                  >
                    {categoryList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
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
                        locale === "id"
                          ? "cth. Serbuk kayu, Minyak jelantah..."
                          : "e.g. Sawdust, Used cooking oil..."
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
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
                    locale === "id"
                      ? "Kualitas, kemurnian, kondisi penyimpanan, catatan penjemputan..."
                      : "Quality, purity, storage condition, pickup notes..."
                  }
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
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
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
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
                    {UNITS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
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
                    {conditionList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
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
                      ? locale === "id"
                        ? "cth. Kardus bekas, Plastik HDPE..."
                        : "e.g. Cardboard scrap, HDPE plastic..."
                      : locale === "id"
                        ? "Material sejenis yang dapat diterima"
                        : "Any similar material acceptable"
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  {locale === "id"
                    ? "Catatan Tambahan (opsional)"
                    : "Additional Notes (optional)"}
                </label>

                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    locale === "id"
                      ? "Jadwal pengambilan, ketentuan pengemasan..."
                      : "Pickup schedule, packaging requirements..."
                  }
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
                />
              </div>
            </div>
          </section>

          {/* LOKASI — SENGAJA DI ATAS FOTO */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
              {locale === "id" ? "Lokasi" : "Location"}
            </h2>

            <div className="mb-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={useProfileLocation}
                  onChange={(e) =>
                    handleProfileLocationToggle(e.target.checked)
                  }
                  disabled={profileLoading}
                  className="mt-1 h-4 w-4 accent-emerald-300"
                />

                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {locale === "id"
                      ? "Gunakan lokasi sesuai profil saya"
                      : "Use my profile location"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    {locale === "id"
                      ? "Provinsi, kota/kabupaten, dan kecamatan akan mengikuti lokasi pada profil Anda."
                      : "Province, city/regency, and district will follow the location saved in your profile."}
                  </p>
                </div>
              </label>
            </div>

            <div className="mx-auto max-w-2xl">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t.exchange.provinceLabel}
                  </label>

                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    required
                    disabled={profileLoading}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                  >
                    <option value="">
                      {t.exchange.selectProvince}
                    </option>

                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t.exchange.cityLabel}
                  </label>

                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    required
                    disabled={profileLoading || !selectedProvince}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                  >
                    <option value="">
                      {!selectedProvince
                        ? locale === "id"
                          ? "Pilih provinsi terlebih dahulu"
                          : "Select a province first"
                        : t.exchange.selectCity}
                    </option>

                    {cities.map((city) => (
                      <option key={city.code} value={city.code}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    {t.exchange.districtLabel}
                  </label>

                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setError(null);
                    }}
                    required
                    disabled={profileLoading || !selectedCity}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                  >
                    <option value="">
                      {!selectedCity
                        ? locale === "id"
                          ? "Pilih kota terlebih dahulu"
                          : "Select a city first"
                        : t.exchange.selectDistrict}
                    </option>

                    {districts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* FOTO MATERIAL */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
                {locale === "id" ? "Foto Material" : "Material Images"}
              </h2>

              <p className="mt-1 text-xs text-white/35">
                {locale === "id"
                  ? "Maksimal 5 MB per gambar · 3 gambar"
                  : "Maximum 5 MB per image · 3 images"}
              </p>
            </div>

            <div>
              <span className="mb-2 block text-xs font-medium text-white/60">
                {locale === "id" ? "Foto Utama" : "Primary Photo"}
              </span>

              {primaryImagePreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-[#0b1d17]">
                  <img
                    src={primaryImagePreview}
                    alt={
                      locale === "id"
                        ? "Foto utama material"
                        : "Primary material"
                    }
                    className="h-56 w-full object-cover sm:h-64"
                  />

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-12">
                    <span className="rounded-lg bg-emerald-300 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#07130f]">
                      {locale === "id" ? "FOTO UTAMA" : "PRIMARY"}
                    </span>

                    <button
                      type="button"
                      onClick={removePrimaryImage}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      {locale === "id" ? "Hapus" : "Remove"}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-10 text-center transition hover:border-emerald-400/30 hover:bg-white/[0.04]">
                  <Camera className="h-6 w-6 text-emerald-400/70" />

                  <span className="mt-3 text-sm font-semibold text-white/75">
                    {locale === "id"
                      ? "Upload Foto Utama"
                      : "Upload Primary Photo"}
                  </span>

                  <span className="mt-1 text-xs text-white/35">
                    PNG, JPG atau WebP · Maks. 5 MB
                  </span>

                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    onChange={handlePrimaryImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-white/60">
                  {locale === "id" ? "Foto Detail" : "Detail Photos"}{" "}
                  ({additionalImageFiles.length}/{MAX_ADDITIONAL_IMAGES})
                </span>

                <span className="text-[10px] text-white/25">
                  {locale === "id" ? "Maks. 3 foto" : "Max. 3 photos"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {additionalImagePreviews.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-[#0b1d17]"
                  >
                    <img
                      src={src}
                      alt={`Material detail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-black/65 px-1.5 py-1 text-[9px] text-white/80">
                      {locale === "id" ? "Detail" : "Detail"} {index + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(index)}
                      disabled={submitting}
                      aria-label={`Remove image ${index + 1}`}
                      className="absolute right-1 top-1 rounded-full bg-red-500/90 p-1 text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {additionalImageFiles.length < MAX_ADDITIONAL_IMAGES && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-center transition hover:border-emerald-400/40 hover:bg-emerald-400/[0.035]">
                    <Plus className="h-5 w-5 text-white/45" />

                    <span className="mt-1 text-[10px] text-white/35">
                      {locale === "id" ? "Tambah Foto" : "Add Photo"}
                    </span>

                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      multiple
                      onChange={handleAdditionalImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="mt-2 text-[10px] text-white/30">
                {locale === "id"
                  ? "PNG, JPG atau WebP · Maks. 5 MB per gambar."
                  : "PNG, JPG or WebP · Maximum 5 MB per image."}
              </p>
            </div>

            {/* RINGKASAN FOTO */}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-white/60">
                    {locale === "id" ? "Ringkasan Foto" : "Photo Summary"}
                  </p>

                  <p className="mt-1 text-[11px] text-white/30">
                    {locale === "id"
                      ? "Foto utama + foto detail"
                      : "Primary photo + detail photos"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-semibold text-white">
                    {totalImages}/4 {locale === "id" ? "gambar" : "images"}
                  </p>

                  <p
                    className={`mt-0.5 text-[10px] ${
                      totalImageSize > MAX_TOTAL_IMAGE_SIZE
                        ? "text-red-400"
                        : "text-white/30"
                    }`}
                  >
                    {formatFileSize(totalImageSize)} / 20 MB
                  </p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalImageSize > MAX_TOTAL_IMAGE_SIZE
                      ? "bg-red-400"
                      : "bg-emerald-300"
                  }`}
                  style={{
                    width: `${Math.min(
                      (totalImageSize / MAX_TOTAL_IMAGE_SIZE) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <Link
              href="/exchange"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              {t.exchange.cancelBtn}
            </Link>

            <button
              type="submit"
              disabled={submitting || profileLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#12544F] bg-[#2A835F] py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(42,131,95,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#32a070] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.exchange.publishing}</span>
                </>
              ) : (
                <>
                  <Repeat className="h-4 w-4" />
                  <span>
                    {locale === "id"
                      ? "Publikasikan Pertukaran"
                      : "Publish Exchange"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
