"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Camera,
  Check,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";

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

const MAX_DETAIL_IMAGES = 3;
const MAX_TOTAL_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const TEXT = {
  id: {
    eyebrow: "ARVENA RESOURCE",
    title: "Tambah Resource",
    description: "Tambahkan resource yang ingin kamu bagikan ke ekosistem ARVENA.",
    basic: "Informasi Resource",
    resourceName: "Nama Resource",
    resourceNamePlaceholder: "Contoh: Ampas Kopi",
    category: "Kategori",
    selectCategory: "Pilih kategori",
    organic: "Organik",
    plastic: "Plastik",
    paper: "Kertas",
    metal: "Logam",
    electronic: "Elektronik",
    food: "Makanan",
    textile: "Tekstil",
    other: "Lainnya / Material Khusus",
    customType: "Jenis Material / Resource Kustom *",
    customPlaceholder: "Contoh: Sisa Kain Perca, Palet Kayu Pinus...",
    customHelp: "Nama material khusus ini akan disimpan dan dapat dicari di marketplace.",
    quantity: "Jumlah",
    quantityPlaceholder: "Contoh: 10",
    quantityHelp: "Jumlah resource yang tersedia.",
    unit: "Satuan",
    kg: "kilogram (kg)",
    gram: "gram",
    liter: "liter",
    pcs: "pcs",
    unitValue: "unit",
    price: "Harga per",
    pricePlaceholder: "10.000",
    priceHelp: "Masukkan harga untuk setiap satuan resource.",
    priceSummary: "Ringkasan Harga",
    totalPrice: "Total harga seluruh resource",
    normalPrice: "Total harga normal",
    negotiation: "Batas Negosiasi",
    noNegotiation: "Tidak ada negosiasi",
    negotiate: "Boleh nego sampai",
    negotiationHelp: "Pembeli tidak dapat menawar di bawah batas minimum yang kamu tentukan.",
    minimumPrice: "Harga minimum per",
    minimumTotal: "Total minimum jika ditawar maksimal",
    location: "Location",
    useProfile: "Gunakan lokasi sesuai profil saya",
    useProfileHelp: "Gunakan provinsi, kabupaten/kota, dan kecamatan yang tersimpan di profil kamu.",
    province: "Provinsi",
    city: "Kabupaten / Kota",
    district: "Kecamatan",
    loadingProvince: "Memuat provinsi...",
    selectProvince: "Pilih Provinsi",
    selectProvinceFirst: "Pilih provinsi terlebih dahulu",
    loadingCity: "Memuat kabupaten/kota...",
    selectCity: "Pilih Kota",
    selectCityFirst: "Pilih kabupaten/kota terlebih dahulu",
    loadingDistrict: "Memuat kecamatan...",
    selectDistrict: "Pilih Kecamatan",
    images: "Foto Material",
    primaryImage: "Foto Utama",
    uploadPrimary: "Upload Foto Utama",
    uploadHint: "PNG, JPG atau WebP · Maks. 5 MB",
    remove: "Hapus",
    additionalImages: "Foto Detail",
    addImage: "Tambah Foto",
    maxAdditional: "Maksimal 3 foto detail",
    maxPerImage: "Maksimal 5 MB per gambar",
    imageSummary: "Ringkasan Foto",
    imageSummaryHelp: "Foto utama + foto detail",
    imagesCount: "gambar",
    cancel: "Batal",
    save: "Tambah Resource",
    saving: "Menyimpan resource...",
    mainBadge: "FOTO UTAMA",
    detail: "Detail",
    invalidImage: (name: string) => `File "${name}" bukan gambar.`,
    totalImageLimit: (size: string) => `Total ukuran semua gambar tidak boleh lebih dari 20 MB. Saat ini: ${size}.`,
    maxDetails: "Maksimal 3 gambar detail.",
    profileMissing: "Lengkapi profil dan wilayah kamu terlebih dahulu sebelum menambahkan resource.",
    profileRead: "Profil pengguna tidak dapat dibaca.",
    profileNotFound: "Data profil tidak ditemukan.",
    provinceError: "Data provinsi gagal dimuat.",
    cityError: "Data kabupaten/kota gagal dimuat.",
    districtError: "Data kecamatan gagal dimuat.",
    authError: "Sesi login tidak terbaca. Silakan login kembali.",
    quantityError: "Jumlah resource harus lebih dari 0.",
    priceError: (unit: string) => `Harga per ${unit} harus lebih dari 0.`,
    negotiationError: "Batas negosiasi tidak valid.",
    locationRequired: "Provinsi, kabupaten/kota, dan kecamatan wajib dipilih.",
    profileRequired: "Lengkapi profil dan wilayah kamu terlebih dahulu.",
    imageUploadError: (message: string) => `Gagal mengupload gambar: ${message}`,
    cancelConfirm: "Batalkan pembuatan resource ini?",
  },
  en: {
    eyebrow: "ARVENA RESOURCE",
    title: "Add Resource",
    description: "Add a resource you want to share with the ARVENA ecosystem.",
    basic: "Resource Information",
    resourceName: "Resource Name",
    resourceNamePlaceholder: "e.g. Coffee Grounds",
    category: "Category",
    selectCategory: "Select category",
    organic: "Organic",
    plastic: "Plastic",
    paper: "Paper",
    metal: "Metal",
    electronic: "Electronic",
    food: "Food",
    textile: "Textile",
    other: "Other / Custom Material",
    customType: "Custom Material / Resource Type *",
    customPlaceholder: "e.g. Fabric Scraps, Pine Wood Pallets...",
    customHelp: "This custom material name will be saved and searchable in the marketplace.",
    quantity: "Quantity",
    quantityPlaceholder: "e.g. 10",
    quantityHelp: "Amount of resource available.",
    unit: "Unit",
    kg: "kilogram (kg)",
    gram: "gram",
    liter: "liter",
    pcs: "pcs",
    unitValue: "unit",
    price: "Price per",
    pricePlaceholder: "10,000",
    priceHelp: "Enter the price for each resource unit.",
    priceSummary: "Price Summary",
    totalPrice: "Total resource price",
    normalPrice: "Normal total price",
    negotiation: "Negotiation Limit",
    noNegotiation: "No negotiation",
    negotiate: "Negotiable up to",
    negotiationHelp: "Buyers cannot offer below the minimum limit you set.",
    minimumPrice: "Minimum price per",
    minimumTotal: "Minimum total at maximum",
    location: "Location",
    useProfile: "Use my profile location",
    useProfileHelp: "Use the province, city/regency, and district saved in your profile.",
    province: "Province",
    city: "City / Regency",
    district: "District",
    loadingProvince: "Loading provinces...",
    selectProvince: "Select Province",
    selectProvinceFirst: "Select a province first",
    loadingCity: "Loading cities...",
    selectCity: "Select City",
    selectCityFirst: "Select a city / regency first",
    loadingDistrict: "Loading districts...",
    selectDistrict: "Select District",
    images: "Material Images",
    primaryImage: "Primary Image",
    uploadPrimary: "Upload Primary Photo",
    uploadHint: "PNG, JPG or WebP · Max. 5 MB",
    remove: "Remove",
    additionalImages: "Detail Images",
    addImage: "Add Image",
    maxAdditional: "Maximum 3 detail images",
    maxPerImage: "Maximum 5 MB per image",
    imageSummary: "Image Summary",
    imageSummaryHelp: "Primary + detail images",
    imagesCount: "images",
    cancel: "Cancel",
    save: "Add Resource",
    saving: "Saving resource...",
    mainBadge: "PRIMARY IMAGE",
    detail: "Detail",
    invalidImage: (name: string) => `File "${name}" is not an image.`,
    totalImageLimit: (size: string) => `Total image size cannot exceed 20 MB. Current size: ${size}.`,
    maxDetails: "Maximum 3 detail images.",
    profileMissing: "Complete your profile and location before adding a resource.",
    profileRead: "Unable to read your profile.",
    profileNotFound: "Profile data was not found.",
    provinceError: "Unable to load provinces.",
    cityError: "Unable to load cities.",
    districtError: "Unable to load districts.",
    authError: "Your login session could not be read. Please log in again.",
    quantityError: "Resource quantity must be greater than 0.",
    priceError: (unit: string) => `Price per ${unit} must be greater than 0.`,
    negotiationError: "Invalid negotiation limit.",
    locationRequired: "Province, city/regency, and district are required.",
    profileRequired: "Complete your profile and location first.",
    imageUploadError: (message: string) => `Failed to upload image: ${message}`,
    cancelConfirm: "Cancel creating this resource?",
  },
} as const;

export default function NewResourcePage() {
  const { locale } = useLanguage();
  const t = TEXT[locale === "en" ? "en" : "id"];
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    category: "",
    custom_category: "",
    quantity: "",
    unit: "kg",
    province: "",
    province_code: "",
    city: "",
    city_code: "",
    district: "",
    district_code: "",
    description: "",
    price: "",
    negotiation_percent: "0",
  });

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

  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [regionError, setRegionError] = useState("");

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [detailImages, setDetailImages] = useState<File[]>([]);
  const [detailPreviews, setDetailPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatRupiah(value: string | number) {
    if (value === "" || value === null || value === undefined) return "";
    const number = typeof value === "number"
      ? value
      : Number(value.replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(number)) return "";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  }

  function parseRupiah(value: string) {
    return Number(value.replace(/\./g, "").replace(",", "."));
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function getTotalImageSize(main: File | null, details: File[]) {
    return (main?.size || 0) + details.reduce((total, file) => total + file.size, 0);
  }

  function validateImageSize(main: File | null, details: File[]) {
    const total = getTotalImageSize(main, details);
    if (total > MAX_TOTAL_IMAGE_SIZE) {
      setError(t.totalImageLimit(formatFileSize(total)));
      return false;
    }
    return true;
  }

  async function loadCities(provinceCode: string) {
    if (!provinceCode) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    try {
      const response = await fetch(`/api/regions/regencies/${encodeURIComponent(provinceCode)}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("city request failed");
      const result = await response.json();
      if (!Array.isArray(result?.data)) throw new Error("invalid city response");
      setCities(
        [...result.data].sort((a, b) =>
          a.name.localeCompare(b.name, "id", { sensitivity: "base" })
        )
      );
    } catch (err) {
      console.error("LOAD CITIES ERROR:", err);
      setCities([]);
      setRegionError(t.cityError);
    } finally {
      setLoadingCities(false);
    }
  }

  async function loadDistricts(cityCode: string) {
    if (!cityCode) {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/regions/districts/${encodeURIComponent(cityCode)}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("district request failed");
      const result = await response.json();
      if (!Array.isArray(result?.data)) throw new Error("invalid district response");
      setDistricts(
        [...result.data].sort((a, b) =>
          a.name.localeCompare(b.name, "id", { sensitivity: "base" })
        )
      );
    } catch (err) {
      console.error("LOAD DISTRICTS ERROR:", err);
      setDistricts([]);
      setRegionError(t.districtError);
    } finally {
      setLoadingDistricts(false);
    }
  }

  async function loadProfile() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("province, province_code, city, city_code, district, district_code")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("LOAD PROFILE ERROR:", profileError);
        setError(t.profileRead);
        return;
      }

      if (!profile) {
        setError(t.profileNotFound);
        return;
      }

      if (
        !profile.province ||
        !profile.province_code ||
        !profile.city ||
        !profile.city_code ||
        !profile.district ||
        !profile.district_code
      ) {
        setError(t.profileMissing);
        window.setTimeout(() => router.push("/profile"), 1500);
        return;
      }

      const location: ProfileLocation = {
        province: profile.province,
        province_code: profile.province_code,
        city: profile.city,
        city_code: profile.city_code,
        district: profile.district,
        district_code: profile.district_code,
      };

      setProfileLocation(location);
      setForm((previous) => ({
        ...previous,
        province: location.province,
        province_code: location.province_code,
        city: location.city,
        city_code: location.city_code,
        district: location.district,
        district_code: location.district_code,
      }));
      setUseProfileLocation(true);

      await Promise.all([
        loadCities(location.province_code),
        loadDistricts(location.city_code),
      ]);
    } catch (err) {
      console.error("PROFILE LOAD ERROR:", err);
      setError(t.profileRead);
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadProvinces() {
    try {
      const response = await fetch("/api/regions/provinces", { cache: "no-store" });
      if (!response.ok) throw new Error("province request failed");
      const result = await response.json();
      if (!Array.isArray(result?.data)) throw new Error("invalid province response");
      setProvinces(
        [...result.data].sort((a, b) =>
          a.name.localeCompare(b.name, "id", { sensitivity: "base" })
        )
      );
    } catch (err) {
      console.error("LOAD PROVINCES ERROR:", err);
      setProvinces([]);
      setRegionError(t.provinceError);
    } finally {
      setLoadingProvinces(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
      void loadProvinces();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setUseProfileLocation(false);
    const code = e.target.value;
    const province = provinces.find((item) => item.code === code);

    setForm((previous) => ({
      ...previous,
      province: province?.name || "",
      province_code: province?.code || "",
      city: "",
      city_code: "",
      district: "",
      district_code: "",
    }));

    setCities([]);
    setDistricts([]);
    setError("");

    if (province?.code) void loadCities(province.code);
  }

  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setUseProfileLocation(false);
    const code = e.target.value;
    const city = cities.find((item) => item.code === code);

    setForm((previous) => ({
      ...previous,
      city: city?.name || "",
      city_code: city?.code || "",
      district: "",
      district_code: "",
    }));

    setDistricts([]);
    setError("");

    if (city?.code) void loadDistricts(city.code);
  }

  function handleDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setUseProfileLocation(false);
    const code = e.target.value;
    const district = districts.find((item) => item.code === code);

    setForm((previous) => ({
      ...previous,
      district: district?.name || "",
      district_code: district?.code || "",
    }));
    setError("");
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\./g, "").replace(/[^\d,]/g, "");
    const parts = value.split(",");
    if (parts.length > 2) value = `${parts[0]},${parts.slice(1).join("")}`;
    if (parts[1]) value = `${parts[0]},${parts[1].slice(0, 2)}`;
    setForm((previous) => ({ ...previous, price: value }));
    setError("");
  }

  function handleMainImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t.invalidImage(file.name));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(t.totalImageLimit(formatFileSize(file.size)));
      return;
    }

    if (!validateImageSize(file, detailImages)) return;

    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainImage(file);
    setMainPreview(URL.createObjectURL(file));
    setError("");
  }

  function removeMainImage() {
    if (mainPreview) URL.revokeObjectURL(mainPreview);
    setMainImage(null);
    setMainPreview(null);
    setError("");
  }

  function handleDetailImagesChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const remaining = MAX_DETAIL_IMAGES - detailImages.length;
    if (remaining <= 0) {
      setError(t.maxDetails);
      return;
    }

    const valid: File[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        setError(t.invalidImage(file.name));
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError(t.totalImageLimit(formatFileSize(file.size)));
        return;
      }
      valid.push(file);
    }

    const updated = [...detailImages, ...valid];
    if (!validateImageSize(mainImage, updated)) return;

    detailPreviews.forEach((url) => URL.revokeObjectURL(url));
    setDetailImages(updated);
    setDetailPreviews(updated.map((file) => URL.createObjectURL(file)));
    setError("");
  }

  function removeDetailImage(index: number) {
    const updatedFiles = detailImages.filter((_, i) => i !== index);
    detailPreviews.forEach((url) => URL.revokeObjectURL(url));
    setDetailImages(updatedFiles);
    setDetailPreviews(updatedFiles.map((file) => URL.createObjectURL(file)));
    setError("");
  }

  function handleProfileLocationToggle(checked: boolean) {
    setUseProfileLocation(checked);
    setError("");

    if (checked) {
      setForm((previous) => ({
        ...previous,
        province: profileLocation.province,
        province_code: profileLocation.province_code,
        city: profileLocation.city,
        city_code: profileLocation.city_code,
        district: profileLocation.district,
        district_code: profileLocation.district_code,
      }));

      if (profileLocation.province_code) {
        void loadCities(profileLocation.province_code);
      }
      if (profileLocation.city_code) {
        void loadDistricts(profileLocation.city_code);
      }
    } else {
      setForm((previous) => ({
        ...previous,
        province: "",
        province_code: "",
        city: "",
        city_code: "",
        district: "",
        district_code: "",
      }));
      setCities([]);
      setDistricts([]);
    }
  }

  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview);
      detailPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mainPreview, detailPreviews]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!profileLocation.province_code || !profileLocation.city_code || !profileLocation.district_code) {
      setError(t.profileRequired);
      setLoading(false);
      return;
    }

    if (!form.province_code || !form.city_code || !form.district_code) {
      setError(t.locationRequired);
      setLoading(false);
      return;
    }

    const quantity = Number(form.quantity);
    const pricePerUnit = parseRupiah(form.price);
    const negotiationPercent = Number(form.negotiation_percent);

    if (quantity <= 0) {
      setError(t.quantityError);
      setLoading(false);
      return;
    }
    if (pricePerUnit <= 0) {
      setError(t.priceError(form.unit));
      setLoading(false);
      return;
    }
    if (negotiationPercent < 0 || negotiationPercent > 100) {
      setError(t.negotiationError);
      setLoading(false);
      return;
    }
    if (!form.title.trim()) {
      setError(locale === "en" ? "Resource name is required." : "Nama resource wajib diisi.");
      setLoading(false);
      return;
    }
    if (!form.category) {
      setError(locale === "en" ? "Category is required." : "Kategori wajib dipilih.");
      setLoading(false);
      return;
    }
    if (form.category === "other" && !form.custom_category.trim()) {
      setError(locale === "en" ? "Please specify the custom material type." : "Silakan isi jenis material kustom.");
      setLoading(false);
      return;
    }

    if (!validateImageSize(mainImage, detailImages)) {
      setLoading(false);
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(t.authError);
      setLoading(false);
      return;
    }

    const { data: resourceData, error: insertError } = await supabase
      .from("resources")
      .insert({
        owner_id: user.id,
        title: form.title.trim(),
        category: form.category,
        custom_category: form.category === "other" ? form.custom_category.trim() || null : null,
        quantity,
        unit: form.unit,
        province: form.province,
        province_code: form.province_code,
        city: form.city,
        city_code: form.city_code,
        district: form.district,
        district_code: form.district_code,
        description: form.description.trim(),
        price: pricePerUnit,
        negotiation_percent: negotiationPercent,
        status: "available",
      })
      .select("id")
      .single();

    if (insertError || !resourceData) {
      console.error("RESOURCE INSERT ERROR:", insertError);
      setError(insertError?.message || (locale === "en" ? "Failed to create resource." : "Gagal membuat resource."));
      setLoading(false);
      return;
    }

    const allImages = [
      ...(mainImage ? [{ file: mainImage }] : []),
      ...detailImages.map((file) => ({ file })),
    ];
    const uploadedImageUrls: string[] = [];

    try {
      for (const { file } of allImages) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${resourceData.id}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("resource-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("resource-images")
          .getPublicUrl(fileName);
        uploadedImageUrls.push(publicUrlData.publicUrl);
      }

      if (allImages.length > 0) {
        const { error: imageUpdateError } = await supabase
          .from("resources")
          .update({ images: uploadedImageUrls })
          .eq("id", resourceData.id);
        if (imageUpdateError) throw imageUpdateError;
      }
    } catch (uploadError) {
      console.error("UPLOAD ERROR:", uploadError);
      await supabase.from("resources").delete().eq("id", resourceData.id);
      setError(t.imageUploadError(uploadError instanceof Error ? uploadError.message : String(uploadError)));
      setLoading(false);
      return;
    }

    router.push("/resources");
    router.refresh();
  }

  const quantity = Number(form.quantity) || 0;
  const pricePerUnit = parseRupiah(form.price) || 0;
  const negotiationPercent = Number(form.negotiation_percent) || 0;
  const totalPrice = quantity * pricePerUnit;
  const minimumPricePerUnit = pricePerUnit * (1 - negotiationPercent / 100);
  const minimumTotalPrice = totalPrice * (1 - negotiationPercent / 100);
  const totalImages = (mainImage ? 1 : 0) + detailImages.length;
  const totalImageSize = getTotalImageSize(mainImage, detailImages);

  const categoryOptions = [
    ["organic", t.organic],
    ["plastic", t.plastic],
    ["paper", t.paper],
    ["metal", t.metal],
    ["electronic", t.electronic],
    ["food", t.food],
    ["textile", t.textile],
    ["other", t.other],
  ] as const;

  return (
    <main className="min-h-screen bg-[#092328] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {t.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            {t.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
              {t.basic}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.resourceName}</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder={t.resourceNamePlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.category}</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  <option value="">{t.selectCategory}</option>
                  {categoryOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                {form.category === "other" && (
                  <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
                    <label className="mb-1.5 block text-xs font-semibold text-emerald-300">{t.customType}</label>
                    <input
                      name="custom_category"
                      value={form.custom_category}
                      onChange={handleChange}
                      required
                      placeholder={t.customPlaceholder}
                      className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
                    />
                    <p className="mt-2 text-[11px] leading-5 text-white/35">{t.customHelp}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">{t.quantity}</label>
                  <input
                    name="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                    placeholder={t.quantityPlaceholder}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
                  />
                  <p className="mt-1.5 text-[11px] text-white/30">{t.quantityHelp}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">{t.unit}</label>
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                  >
                    <option value="kg">{t.kg}</option>
                    <option value="gram">{t.gram}</option>
                    <option value="liter">{t.liter}</option>
                    <option value="pcs">{t.pcs}</option>
                    <option value="unit">{t.unitValue}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.price} {form.unit}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/35">Rp</span>
                  <input
                    name="price"
                    type="text"
                    inputMode="decimal"
                    value={formatRupiah(form.price)}
                    onChange={handlePriceChange}
                    required
                    placeholder={t.pricePlaceholder}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] py-2.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/50"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-white/30">{t.priceHelp}</p>
              </div>

              {quantity > 0 && pricePerUnit > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">{t.priceSummary}</p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-white/30">{t.totalPrice}</p>
                      <p className="mt-1 text-xl font-semibold">Rp{formatRupiah(totalPrice)}</p>
                    </div>
                    <p className="text-right text-xs text-white/35">{formatRupiah(quantity)} {form.unit} × Rp{formatRupiah(pricePerUnit)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.negotiation}</label>
                <select
                  name="negotiation_percent"
                  value={form.negotiation_percent}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  <option value="0">{t.noNegotiation}</option>
                  {[5, 10, 15, 20, 25, 30].map((percent) => (
                    <option key={percent} value={percent}>{t.negotiate} {percent}%</option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] leading-5 text-white/30">{t.negotiationHelp}</p>
              </div>

              {pricePerUnit > 0 && (
                <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40">{t.priceSummary}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] text-white/30">{t.price} {form.unit}</p>
                      <p className="mt-1 font-semibold">Rp{formatRupiah(pricePerUnit)}</p>
                    </div>
                    {negotiationPercent > 0 && (
                      <div>
                        <p className="text-[11px] text-white/30">{t.minimumPrice} {form.unit}</p>
                        <p className="mt-1 font-semibold text-emerald-300">Rp{formatRupiah(minimumPricePerUnit)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="text-[11px] text-white/30">{t.normalPrice}</p>
                    <p className="mt-1 font-semibold">Rp{formatRupiah(totalPrice)}</p>
                  </div>
                  {negotiationPercent > 0 && (
                    <div className="mt-3">
                      <p className="text-[11px] text-white/30">{t.minimumTotal} {negotiationPercent}%</p>
                      <p className="mt-1 font-semibold text-emerald-300">Rp{formatRupiah(minimumTotalPrice)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
              {t.location}
            </h2>

            <div className="mb-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={useProfileLocation}
                  onChange={(e) => handleProfileLocationToggle(e.target.checked)}
                  disabled={profileLoading}
                  className="mt-1 h-4 w-4 accent-emerald-300"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{t.useProfile}</p>
                  <p className="mt-1 text-xs leading-5 text-white/35">{t.useProfileHelp}</p>
                </div>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.province}</label>
                <select
                  value={form.province_code}
                  onChange={handleProvinceChange}
                  required
                  disabled={profileLoading || loadingProvinces}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  <option value="">{loadingProvinces ? t.loadingProvince : t.selectProvince}</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>{province.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.city}</label>
                <select
                  value={form.city_code}
                  onChange={handleCityChange}
                  required
                  disabled={profileLoading || !form.province_code || loadingCities}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  <option value="">
                    {!form.province_code ? t.selectProvinceFirst : loadingCities ? t.loadingCity : t.selectCity}
                  </option>
                  {cities.map((city) => (
                    <option key={city.code} value={city.code}>{city.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">{t.district}</label>
                <select
                  value={form.district_code}
                  onChange={handleDistrictChange}
                  required
                  disabled={profileLoading || !form.city_code || loadingDistricts}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0b1d17] [&>option]:text-white"
                >
                  <option value="">
                    {!form.city_code ? t.selectCityFirst : loadingDistricts ? t.loadingDistrict : t.selectDistrict}
                  </option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>{district.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {regionError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/10 bg-amber-300/[0.035] px-3 py-2.5 text-xs text-amber-200/70">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{regionError}</span>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">{t.images}</h2>
              <p className="mt-1 text-xs text-white/35">{t.maxPerImage} · {MAX_DETAIL_IMAGES} {t.imagesCount}</p>
            </div>

            <div>
              <span className="mb-2 block text-xs font-medium text-white/60">{t.primaryImage}</span>
              {mainPreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-[#0b1d17]">
                  <img src={mainPreview} alt={t.primaryImage} className="h-56 w-full object-cover sm:h-64" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-12">
                    <span className="rounded-lg bg-emerald-300 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#07130f]">{t.mainBadge}</span>
                    <button
                      type="button"
                      onClick={removeMainImage}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.remove}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-10 text-center transition hover:border-emerald-400/30 hover:bg-white/[0.04]">
                  <Camera className="h-6 w-6 text-emerald-400/70" />
                  <span className="mt-3 text-sm font-semibold text-white/75">{t.uploadPrimary}</span>
                  <span className="mt-1 text-xs text-white/35">{t.uploadHint}</span>
                  <input type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-white/60">{t.additionalImages} ({detailImages.length}/{MAX_DETAIL_IMAGES})</span>
                <span className="text-[10px] text-white/25">{t.maxAdditional}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                {detailPreviews.map((src, index) => (
                  <div key={`${src}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-[#0b1d17]">
                    <img src={src} alt={`${t.detail} ${index + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/65 px-1.5 py-1 text-[9px] text-white/80">{t.detail} {index + 1}</div>
                    <button
                      type="button"
                      onClick={() => removeDetailImage(index)}
                      disabled={loading}
                      aria-label={`${t.remove} ${t.detail} ${index + 1}`}
                      className="absolute right-1 top-1 rounded-full bg-red-500/90 p-1 text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {detailImages.length < MAX_DETAIL_IMAGES && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-center transition hover:border-emerald-400/40 hover:bg-emerald-400/[0.035]">
                    <Plus className="h-5 w-5 text-white/45" />
                    <span className="mt-1 text-[10px] text-white/35">{t.addImage}</span>
                    <input type="file" accept="image/*" multiple onChange={handleDetailImagesChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-white/60">{t.imageSummary}</p>
                  <p className="mt-1 text-[11px] text-white/30">{t.imageSummaryHelp}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold">{totalImages}/4 {t.imagesCount}</p>
                  <p className={`mt-0.5 text-[10px] ${totalImageSize > MAX_TOTAL_IMAGE_SIZE ? "text-red-400" : "text-white/30"}`}>
                    {formatFileSize(totalImageSize)} / 20 MB
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300 transition-all"
                  style={{ width: `${Math.min((totalImageSize / MAX_TOTAL_IMAGE_SIZE) * 100, 100)}%` }}
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (window.confirm(t.cancelConfirm)) router.push("/resources");
              }}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || profileLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#12544F] bg-[#2A835F] py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(42,131,95,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#32a070] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{t.saving}</>
              ) : (
                <><Check className="h-4 w-4" />{t.save}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
