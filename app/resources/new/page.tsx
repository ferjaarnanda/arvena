"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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


export default function NewResourcePage() {
  const supabase = createClient();
  const router = useRouter();

  // ==========================================
  // FORM
  // ==========================================

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

  // ==========================================
  // PROFILE LOCATION
  // ==========================================

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [useProfileLocation, setUseProfileLocation] =
    useState(true);

  const [profileLocation, setProfileLocation] =
    useState<ProfileLocation>({
      province: "",
      province_code: "",
      city: "",
      city_code: "",
      district: "",
      district_code: "",
    });

  // ==========================================
  // REGION DATA
  // ==========================================

  const [provinces, setProvinces] =
    useState<Region[]>([]);

  const [cities, setCities] =
    useState<Region[]>([]);

  const [districts, setDistricts] =
    useState<Region[]>([]);

  const [loadingProvinces, setLoadingProvinces] =
    useState(true);

  const [loadingCities, setLoadingCities] =
    useState(false);

  const [loadingDistricts, setLoadingDistricts] =
    useState(false);

  const [regionError, setRegionError] =
    useState("");

  // ==========================================
  // GAMBAR
  //
  // 1 gambar utama
  // maksimal 3 gambar detail
  // total maksimal 4 gambar
  // total ukuran maksimal 20 MB
  // ==========================================

  const [mainImage, setMainImage] =
    useState<File | null>(null);

  const [detailImages, setDetailImages] =
    useState<File[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const MAX_DETAIL_IMAGES = 3;
  const MAX_TOTAL_IMAGE_SIZE =
    20 * 1024 * 1024;

  // ==========================================
  // FORMAT RUPIAH
  // ==========================================

  function formatRupiah(
    value: string | number
  ) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    let number: number;

    if (typeof value === "number") {
      number = value;
    } else {
      number = Number(
        value
          .replace(/\./g, "")
          .replace(",", ".")
      );
    }

    if (isNaN(number)) {
      return "";
    }

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  }

  // ==========================================
  // PARSE RUPIAH
  // ==========================================

  function parseRupiah(value: string) {
    return Number(
      value
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  async function loadProfile() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/auth/login");
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          province,
          province_code,
          city,
          city_code,
          district,
          district_code
        `)
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "❌ LOAD PROFILE ERROR:",
          profileError
        );

        setError(
          "Profil pengguna tidak dapat dibaca."
        );

        return;
      }

      if (!profile) {
        setError(
          "Data profil tidak ditemukan."
        );

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
        setError(
          "Lengkapi profil dan wilayah kamu terlebih dahulu sebelum menambahkan resource."
        );

        setTimeout(() => {
          router.push("/profile");
        }, 1500);

        return;
      }

      const location: ProfileLocation = {
        province: profile.province,
        province_code:
          profile.province_code,

        city: profile.city,
        city_code:
          profile.city_code,

        district: profile.district,
        district_code:
          profile.district_code,
      };

      setProfileLocation(location);

      setForm((previous) => ({
        ...previous,

        province: location.province,
        province_code:
          location.province_code,

        city: location.city,
        city_code:
          location.city_code,

        district: location.district,
        district_code:
          location.district_code,
      }));

      setUseProfileLocation(true);

      /*
       * Lokasi profile sudah diketahui.
       *
       * Dropdown wilayah tidak perlu
       * dimuat ketika mode profile aktif
       * karena dropdown tersebut sekarang
       * disembunyikan dari UI.
       */
    } catch (error) {
      console.error(
        "❌ PROFILE LOAD ERROR:",
        error
      );

      setError(
        "Terjadi kesalahan saat membaca profil."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  // ==========================================
  // LOAD PROVINCES
  // ==========================================

  async function loadProvinces() {
    try {
      const response = await fetch(
        "/api/regions/provinces",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Gagal mengambil data provinsi."
        );
      }

      const result =
        await response.json();

      if (
        !Array.isArray(result?.data)
      ) {
        throw new Error(
          "Format data provinsi tidak valid."
        );
      }

      const sortedProvinces =
        [...result.data].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "id",
              {
                sensitivity: "base",
              }
            )
        );

      setProvinces(
        sortedProvinces
      );
    } catch (error) {
      console.error(
        "LOAD PROVINCES ERROR:",
        error
      );

      setProvinces([]);

      setRegionError(
        "Data provinsi gagal dimuat."
      );
    } finally {
      setLoadingProvinces(false);
    }
  }

  // ==========================================
  // LOAD CITIES
  // ==========================================

  async function loadCities(
    provinceCode: string
  ) {
    if (!provinceCode) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    setRegionError("");

    try {
      const response = await fetch(
        `/api/regions/regencies/${encodeURIComponent(
          provinceCode
        )}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Gagal mengambil data kabupaten/kota."
        );
      }

      const result =
        await response.json();

      if (
        !Array.isArray(result?.data)
      ) {
        throw new Error(
          "Format data kabupaten/kota tidak valid."
        );
      }

      const sortedCities =
        [...result.data].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "id",
              {
                sensitivity: "base",
              }
            )
        );

      setCities(sortedCities);
    } catch (error) {
      console.error(
        "LOAD CITIES ERROR:",
        error
      );

      setCities([]);

      setRegionError(
        "Data kabupaten/kota gagal dimuat."
      );
    } finally {
      setLoadingCities(false);
    }
  }

  // ==========================================
  // LOAD DISTRICTS
  // ==========================================

  async function loadDistricts(
    cityCode: string
  ) {
    if (!cityCode) {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(true);
    setRegionError("");

    try {
      const response = await fetch(
        `/api/regions/districts/${encodeURIComponent(
          cityCode
        )}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Gagal mengambil data kecamatan."
        );
      }

      const result =
        await response.json();

      if (
        !Array.isArray(result?.data)
      ) {
        throw new Error(
          "Format data kecamatan tidak valid."
        );
      }

      const sortedDistricts =
        [...result.data].sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
              "id",
              {
                sensitivity: "base",
              }
            )
        );

      setDistricts(
        sortedDistricts
      );
    } catch (error) {
      console.error(
        "LOAD DISTRICTS ERROR:",
        error
      );

      setDistricts([]);

      setRegionError(
        "Data kecamatan gagal dimuat."
      );
    } finally {
      setLoadingDistricts(false);
    }
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProfile();
      void loadProvinces();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // SELECT PROVINCE
  // ==========================================

  async function handleProvinceChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    setUseProfileLocation(false);

    const provinceCode =
      e.target.value;

    const province =
      provinces.find(
        (item) =>
          item.code === provinceCode
      );

    setForm((previous) => ({
      ...previous,

      province:
        province?.name ?? "",

      province_code:
        province?.code ?? "",

      city: "",
      city_code: "",

      district: "",
      district_code: "",
    }));

    setCities([]);
    setDistricts([]);

    if (province?.code) {
      await loadCities(
        province.code
      );
    }

    setError("");
  }

  // ==========================================
  // SELECT CITY
  // ==========================================

  async function handleCityChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    setUseProfileLocation(false);

    const cityCode =
      e.target.value;

    const city =
      cities.find(
        (item) =>
          item.code === cityCode
      );

    setForm((previous) => ({
      ...previous,

      city:
        city?.name ?? "",

      city_code:
        city?.code ?? "",

      district: "",
      district_code: "",
    }));

    setDistricts([]);

    if (city?.code) {
      await loadDistricts(
        city.code
      );
    }

    setError("");
  }

  // ==========================================
  // SELECT DISTRICT
  // ==========================================

  function handleDistrictChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    setUseProfileLocation(false);

    const districtCode =
      e.target.value;

    const district =
      districts.find(
        (item) =>
          item.code === districtCode
      );

    setForm((previous) => ({
      ...previous,

      district:
        district?.name ?? "",

      district_code:
        district?.code ?? "",
    }));

    setError("");
  }

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  // ==========================================
  // HANDLE PRICE
  // ==========================================

  function handlePriceChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    let value = e.target.value;

    value = value.replace(/\./g, "");

    value = value.replace(
      /[^\d,]/g,
      ""
    );

    const parts =
      value.split(",");

    if (parts.length > 2) {
      value =
        parts[0] +
        "," +
        parts
          .slice(1)
          .join("");
    }

    if (parts[1]) {
      value =
        parts[0] +
        "," +
        parts[1].slice(0, 2);
    }

    setForm((previous) => ({
      ...previous,
      price: value,
    }));

    setError("");
  }

  // ==========================================
  // IMAGE SIZE
  // ==========================================

  function getTotalImageSize(
    main: File | null,
    details: File[]
  ) {
    const mainSize =
      main ? main.size : 0;

    const detailSize =
      details.reduce(
        (total, file) =>
          total + file.size,
        0
      );

    return (
      mainSize +
      detailSize
    );
  }

  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  function formatFileSize(
    bytes: number
  ) {
    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(0)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  }

  // ==========================================
  // VALIDATE IMAGE SIZE
  // ==========================================

  function validateImageSize(
    main: File | null,
    details: File[]
  ) {
    const totalSize =
      getTotalImageSize(
        main,
        details
      );

    if (
      totalSize >
      MAX_TOTAL_IMAGE_SIZE
    ) {
      setError(
        `Total ukuran semua gambar tidak boleh lebih dari 20 MB. Saat ini: ${formatFileSize(
          totalSize
        )}.`
      );

      return false;
    }

    return true;
  }

  // ==========================================
  // MAIN IMAGE
  // ==========================================

  function handleMainImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        `File "${file.name}" bukan gambar.`
      );

      e.target.value = "";

      return;
    }

    if (
      !validateImageSize(
        file,
        detailImages
      )
    ) {
      e.target.value = "";

      return;
    }

    setMainImage(file);
    setError("");

    e.target.value = "";
  }

  // ==========================================
  // DETAIL IMAGES
  // ==========================================

  function handleDetailImagesChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        e.target.files || []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    if (
      detailImages.length +
        files.length >
      MAX_DETAIL_IMAGES
    ) {
      setError(
        `Maksimal ${MAX_DETAIL_IMAGES} gambar detail.`
      );

      e.target.value = "";

      return;
    }

    for (const file of files) {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setError(
          `File "${file.name}" bukan gambar.`
        );

        e.target.value = "";

        return;
      }
    }

    const newDetails = [
      ...detailImages,
      ...files,
    ];

    if (
      !validateImageSize(
        mainImage,
        newDetails
      )
    ) {
      e.target.value = "";

      return;
    }

    setDetailImages(
      newDetails
    );

    setError("");

    e.target.value = "";
  }

  // ==========================================
  // REMOVE MAIN IMAGE
  // ==========================================

  function removeMainImage() {
    setMainImage(null);
    setError("");
  }

  // ==========================================
  // REMOVE DETAIL IMAGE
  // ==========================================

  function removeDetailImage(
    index: number
  ) {
    setDetailImages(
      detailImages.filter(
        (_, i) =>
          i !== index
      )
    );

    setError("");
  }

  // ==========================================
  // TOGGLE PROFILE LOCATION
  // ==========================================

  function handleProfileLocationToggle(
    checked: boolean
  ) {
    setUseProfileLocation(
      checked
    );

    setError("");

    if (checked) {
      // ==========================================
      // KEMBALI KE WILAYAH PROFILE
      // ==========================================

      setForm((previous) => ({
        ...previous,

        province:
          profileLocation.province,

        province_code:
          profileLocation.province_code,

        city:
          profileLocation.city,

        city_code:
          profileLocation.city_code,

        district:
          profileLocation.district,

        district_code:
          profileLocation.district_code,
      }));

      /*
       * Tidak perlu loadCities/loadDistricts
       * di mode profile karena dropdown
       * wilayah akan disembunyikan.
       */
    } else {
      // ==========================================
      // MANUAL LOCATION
      // ==========================================

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

  // ==========================================
  // SUBMIT
  // ==========================================

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    // ==========================================
    // PROFILE WAJIB SUDAH SELESAI
    // ==========================================

    if (
      !profileLocation.province_code ||
      !profileLocation.city_code ||
      !profileLocation.district_code
    ) {
      setError(
        "Lengkapi profil dan wilayah kamu terlebih dahulu."
      );

      setLoading(false);

      return;
    }

    // ==========================================
    // VALIDASI LOCATION
    // ==========================================

    if (
      !form.province_code ||
      !form.city_code ||
      !form.district_code
    ) {
      setError(
        "Provinsi, kabupaten/kota, dan kecamatan wajib dipilih."
      );

      setLoading(false);

      return;
    }

    // ==========================================
    // VALIDASI QUANTITY
    // ==========================================

    const quantity =
      Number(form.quantity);

    const pricePerUnit =
      parseRupiah(form.price);

    const negotiationPercent =
      Number(
        form.negotiation_percent
      );

    if (
      quantity <= 0
    ) {
      setError(
        "Jumlah resource harus lebih dari 0."
      );

      setLoading(false);

      return;
    }

    if (
      pricePerUnit <= 0
    ) {
      setError(
        `Harga per ${form.unit} harus lebih dari 0.`
      );

      setLoading(false);

      return;
    }

    // ==========================================
    // VALIDASI NEGOTIATION
    // ==========================================

    if (
      negotiationPercent < 0 ||
      negotiationPercent > 100
    ) {
      setError(
        "Batas negosiasi tidak valid."
      );

      setLoading(false);

      return;
    }

    // ==========================================
    // VALIDASI IMAGE
    // ==========================================

    if (
      !validateImageSize(
        mainImage,
        detailImages
      )
    ) {
      setLoading(false);

      return;
    }

    // ==========================================
    // CEK USER
    // ==========================================

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError) {
      console.error(
        "AUTH ERROR:",
        userError
      );

      setError(
        `Terjadi kesalahan autentikasi: ${userError.message}`
      );

      setLoading(false);

      return;
    }

    if (!user) {
      setError(
        "Sesi login tidak terbaca. Silakan login kembali."
      );

      setLoading(false);

      return;
    }

    // ==========================================
    // SIMPAN RESOURCE
    // ==========================================

    const {
      data: resourceData,
      error: insertError,
    } = await supabase
      .from("resources")
      .insert({
        owner_id: user.id,

        title: form.title,
        category: form.category,
        custom_category: form.category === "other" ? (form.custom_category || "").trim() : null,
        quantity: quantity,
        unit: form.unit,

        province:
          form.province,

        province_code:
          form.province_code,

        city:
          form.city,

        city_code:
          form.city_code,

        district:
          form.district,

        district_code:
          form.district_code,

        description:
          form.description,

        price:
          pricePerUnit,

        negotiation_percent:
          negotiationPercent,

        status:
          "available",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(
        "RESOURCE INSERT ERROR:",
        insertError
      );

      setError(
        insertError.message
      );

      setLoading(false);

      return;
    }

    // ==========================================
    // UPLOAD IMAGES
    // ==========================================

    const allImages: {
      file: File;
      type:
        | "main"
        | "detail";
    }[] = [];

    if (mainImage) {
      allImages.push({
        file: mainImage,
        type: "main",
      });
    }

    detailImages.forEach(
      (file) => {
        allImages.push({
          file,
          type: "detail",
        });
      }
    );

    const uploadedImageUrls: string[] =
      [];

    if (
      allImages.length > 0 &&
      resourceData
    ) {
      for (
        const imageData of allImages
      ) {
        const image =
          imageData.file;

        const fileExt =
          image.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const fileName =
          `${resourceData.id}-${crypto.randomUUID()}.${fileExt}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "resource-images"
            )
            .upload(
              fileName,
              image
            );

        if (
          uploadError
        ) {
          console.error(
            "UPLOAD ERROR:",
            uploadError
          );

          // ==========================================
          // HAPUS RESOURCE JIKA UPLOAD GAGAL
          // ==========================================

          await supabase
            .from(
              "resources"
            )
            .delete()
            .eq(
              "id",
              resourceData.id
            );

          setError(
            `Gagal mengupload gambar: ${uploadError.message}`
          );

          setLoading(false);

          return;
        }

        const {
          data:
            publicUrlData,
        } =
          supabase.storage
            .from(
              "resource-images"
            )
            .getPublicUrl(
              fileName
            );

        uploadedImageUrls.push(
          publicUrlData.publicUrl
        );
      }

      // ==========================================
      // SIMPAN URL GAMBAR
      // ==========================================

      const {
        error:
          imageUpdateError,
      } =
        await supabase
          .from(
            "resources"
          )
          .update({
            images:
              uploadedImageUrls,
          })
          .eq(
            "id",
            resourceData.id
          );

      if (
        imageUpdateError
      ) {
        console.error(
          "IMAGE UPDATE ERROR:",
          imageUpdateError
        );

        setError(
          imageUpdateError.message
        );

        setLoading(false);

        return;
      }
    }

    // ==========================================
    // SELESAI
    // ==========================================

    router.push(
      "/resources"
    );

    router.refresh();
  }

  // ==========================================
  // PRICE PREVIEW
  // ==========================================

  const quantity =
    Number(form.quantity) ||
    0;

  const pricePerUnit =
    parseRupiah(form.price) ||
    0;

  const negotiationPercent =
    Number(
      form.negotiation_percent
    ) || 0;

  const totalPrice =
    quantity *
    pricePerUnit;

  const minimumPricePerUnit =
    pricePerUnit *
    (1 -
      negotiationPercent /
        100);

  const minimumTotalPrice =
    totalPrice *
    (1 -
      negotiationPercent /
        100);

  // ==========================================
  // IMAGE SUMMARY
  // ==========================================

  const totalImages =
    (mainImage ? 1 : 0) +
    detailImages.length;

  const totalImageSize =
    getTotalImageSize(
      mainImage,
      detailImages
    );

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">

      <div className="mx-auto max-w-3xl">

        {/* ==========================================
            HEADER
        ========================================== */}

        <p className="text-sm text-emerald-300">
          ARVENA RESOURCE
        </p>

        <h1 className="mt-3 text-4xl font-semibold">
          Tambah Resource
        </h1>

        <p className="mt-3 text-white/40">
          Tambahkan resource yang ingin kamu
          bagikan ke ekosistem ARVENA.
        </p>

        {/* ==========================================
            FORM
        ========================================== */}

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8"
        >

          {/* ==========================================
              TITLE
          ========================================== */}

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Nama Resource
            </label>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Contoh: Ampas Kopi"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-300"
            />
          </div>

          {/* ==========================================
              CATEGORY
          ========================================== */}

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Kategori
            </label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none focus:border-emerald-300"
            >
              <option value="">
                Pilih kategori
              </option>

              <option value="organic">
                Organik
              </option>

              <option value="plastic">
                Plastik
              </option>

              <option value="paper">
                Kertas
              </option>

              <option value="metal">
                Logam
              </option>

              <option value="electronic">
                Elektronik
              </option>

              <option value="food">
                Makanan
              </option>

              <option value="textile">
                Tekstil
              </option>

              <option value="other">
                Lainnya / Material Khusus
              </option>
            </select>

            {form.category === "other" && (
              <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.04] p-4 transition-all animate-fadeIn">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Jenis Material / Resource Kustom *
                </label>
                <input
                  type="text"
                  name="custom_category"
                  value={form.custom_category || ""}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Sisa Kain Perca, Palet Kayu Pinus, Abu Sekam Padi..."
                  className="w-full rounded-xl border border-emerald-400/40 bg-[#0b1c16] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-300 focus:bg-[#0e251e]"
                />
                <p className="mt-1.5 text-xs text-white/40">
                  Nama material khusus ini akan disimpan dan dapat dicari secara otomatis oleh pembeli di marketplace.
                </p>
              </div>
            )}
          </div>

          {/* ==========================================
              QUANTITY + UNIT
          ========================================== */}

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Jumlah
              </label>

              <input
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={handleChange}
                required
                placeholder="Contoh: 10"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-300"
              />

              <p className="mt-2 text-xs text-white/30">
                Jumlah resource yang tersedia.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Satuan
              </label>

              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none focus:border-emerald-300"
              >
                <option value="kg">
                  kilogram (kg)
                </option>

                <option value="gram">
                  gram
                </option>

                <option value="liter">
                  liter
                </option>

                <option value="pcs">
                  pcs
                </option>

                <option value="unit">
                  unit
                </option>
              </select>
            </div>

          </div>

          {/* ==========================================
              PRICE
          ========================================== */}

          <div>

            <label className="mb-2 block text-sm text-white/60">
              Harga per {form.unit}
            </label>

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                Rp
              </span>

              <input
                name="price"
                type="text"
                inputMode="decimal"
                value={formatRupiah(
                  form.price
                )}
                onChange={
                  handlePriceChange
                }
                required
                placeholder="10.000"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 outline-none placeholder:text-white/30 focus:border-emerald-300"
              />

            </div>

            <p className="mt-2 text-xs text-white/30">
              Masukkan harga untuk setiap{" "}
              {form.unit}. Contoh:
              Rp10.000/kg.
            </p>

          </div>

          {/* ==========================================
              TOTAL PRICE
          ========================================== */}

          {quantity > 0 &&
            pricePerUnit > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <p className="text-sm text-white/40">
                  Total harga seluruh resource
                </p>

                <p className="mt-1 text-2xl font-semibold text-white">
                  Rp
                  {formatRupiah(
                    totalPrice
                  )}
                </p>

                <p className="mt-2 text-sm text-white/40">
                  {formatRupiah(
                    quantity
                  )}{" "}
                  {form.unit}
                  {" × "}
                  Rp
                  {formatRupiah(
                    pricePerUnit
                  )}
                  /
                  {form.unit}
                </p>

              </div>
            )}

          {/* ==========================================
              NEGOTIATION
          ========================================== */}

          <div>

            <label className="mb-2 block text-sm text-white/60">
              Batas Negosiasi
            </label>

            <select
              name="negotiation_percent"
              value={
                form.negotiation_percent
              }
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none focus:border-emerald-300"
            >
              <option value="0">
                Tidak ada negosiasi
              </option>

              <option value="5">
                Boleh nego sampai 5%
              </option>

              <option value="10">
                Boleh nego sampai 10%
              </option>

              <option value="15">
                Boleh nego sampai 15%
              </option>

              <option value="20">
                Boleh nego sampai 20%
              </option>

              <option value="25">
                Boleh nego sampai 25%
              </option>

              <option value="30">
                Boleh nego sampai 30%
              </option>
            </select>

            <p className="mt-2 text-xs text-white/30">
              Pembeli tidak dapat menawar di bawah
              batas minimum yang kamu tentukan.
            </p>

          </div>

          {/* ==========================================
              NEGOTIATION PREVIEW
          ========================================== */}

          {pricePerUnit > 0 && (
            <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-5">

              <p className="text-sm text-white/50">
                Ringkasan harga
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">

                <div>
                  <p className="text-xs text-white/30">
                    Harga per {form.unit}
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    Rp
                    {formatRupiah(
                      pricePerUnit
                    )}
                  </p>
                </div>

                {negotiationPercent >
                  0 && (
                  <div>
                    <p className="text-xs text-white/30">
                      Harga minimum per {form.unit}
                    </p>

                    <p className="mt-1 text-lg font-semibold text-emerald-300">
                      Rp
                      {formatRupiah(
                        minimumPricePerUnit
                      )}
                    </p>
                  </div>
                )}

              </div>

              <div className="mt-5 border-t border-white/10 pt-4">

                <p className="text-xs text-white/30">
                  Total harga normal
                </p>

                <p className="mt-1 text-xl font-semibold">
                  Rp
                  {formatRupiah(
                    totalPrice
                  )}
                </p>

              </div>

              {negotiationPercent >
                0 && (
                <div className="mt-4">

                  <p className="text-xs text-white/30">
                    Total minimum jika ditawar maksimal{" "}
                    {negotiationPercent}%
                  </p>

                  <p className="mt-1 text-xl font-semibold text-emerald-300">
                    Rp
                    {formatRupiah(
                      minimumTotalPrice
                    )}
                  </p>

                </div>
              )}

            </div>
          )}

          {/* ==========================================
              LOCATION
          ========================================== */}

          <div className="space-y-4">

            <div>
              <p className="mb-1 text-sm font-medium text-white/70">
                Lokasi Resource
              </p>

              <p className="text-xs leading-5 text-white/30">
                Tentukan wilayah transaksi resource.
                Secara default ARVENA menggunakan
                wilayah yang tersimpan di profil kamu.
              </p>
            </div>

            {/* ==========================================
                USE PROFILE LOCATION
            ========================================== */}

            <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] p-4">

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  checked={
                    useProfileLocation
                  }
                  onChange={(e) =>
                    handleProfileLocationToggle(
                      e.target.checked
                    )
                  }
                  disabled={
                    profileLoading
                  }
                  className="mt-1 h-4 w-4 accent-emerald-300"
                />

                <div className="min-w-0">

                  <p className="text-sm font-medium text-white">
                    Gunakan wilayah sesuai profil saya
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    Resource akan menggunakan provinsi,
                    kabupaten/kota, dan kecamatan
                    yang tersimpan di profil kamu.
                    Matikan pilihan ini jika resource
                    berada di wilayah lain.
                  </p>

                  {useProfileLocation &&
                    profileLocation.province && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2">

                        <p className="text-xs text-white/30">
                          Wilayah dari profil
                        </p>

                        <p className="mt-1 text-sm text-emerald-300">
                          {profileLocation.province}
                          {" → "}
                          {profileLocation.city}
                          {" → "}
                          {profileLocation.district}
                        </p>

                      </div>
                    )}

                </div>

              </label>

            </div>

            {/* ==========================================
                MANUAL LOCATION
                HANYA MUNCUL JIKA PROFILE LOCATION
                TIDAK DIGUNAKAN
            ========================================== */}

            {!useProfileLocation && (
              <div className="space-y-4">

                {/* ==========================================
                    PROVINCE
                ========================================== */}

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Provinsi
                  </label>

                  <select
                    value={
                      form.province_code
                    }
                    onChange={
                      handleProvinceChange
                    }
                    required
                    disabled={
                      profileLoading ||
                      loadingProvinces
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none transition focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {loadingProvinces
                        ? "Memuat provinsi..."
                        : "Pilih provinsi"}
                    </option>

                    {provinces.map(
                      (province) => (
                        <option
                          key={
                            province.code
                          }
                          value={
                            province.code
                          }
                        >
                          {province.name}
                        </option>
                      )
                    )}

                  </select>
                </div>

                {/* ==========================================
                    CITY / REGENCY
                ========================================== */}

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Kabupaten / Kota
                  </label>

                  <select
                    value={
                      form.city_code
                    }
                    onChange={
                      handleCityChange
                    }
                    required
                    disabled={
                      profileLoading ||
                      !form.province_code ||
                      loadingCities
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none transition focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {!form.province_code
                        ? "Pilih provinsi terlebih dahulu"
                        : loadingCities
                          ? "Memuat kabupaten/kota..."
                          : "Pilih kabupaten/kota"}
                    </option>

                    {cities.map(
                      (city) => (
                        <option
                          key={city.code}
                          value={city.code}
                        >
                          {city.name}
                        </option>
                      )
                    )}

                  </select>
                </div>

                {/* ==========================================
                    DISTRICT
                ========================================== */}

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Kecamatan
                  </label>

                  <select
                    value={
                      form.district_code
                    }
                    onChange={
                      handleDistrictChange
                    }
                    required
                    disabled={
                      profileLoading ||
                      !form.city_code ||
                      loadingDistricts
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none transition focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {!form.city_code
                        ? "Pilih kabupaten/kota terlebih dahulu"
                        : loadingDistricts
                          ? "Memuat kecamatan..."
                          : "Pilih kecamatan"}
                    </option>

                    {districts.map(
                      (district) => (
                        <option
                          key={
                            district.code
                          }
                          value={
                            district.code
                          }
                        >
                          {district.name}
                        </option>
                      )
                    )}

                  </select>
                </div>

                {/* ==========================================
                    REGION ERROR
                ========================================== */}

                {regionError && (
                  <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.035] px-4 py-3">

                    <p className="text-xs leading-5 text-amber-200/70">
                      {regionError}
                    </p>

                  </div>
                )}

              </div>
            )}

          </div>

          {/* ==========================================
              DESCRIPTION
          ========================================== */}

          <div>

            <label className="mb-2 block text-sm text-white/60">
              Deskripsi
            </label>

            <textarea
              name="description"
              value={
                form.description
              }
              onChange={handleChange}
              rows={5}
              placeholder="Jelaskan resource yang kamu tawarkan..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-300"
            />

          </div>

          {/* ==========================================
              MAIN IMAGE
          ========================================== */}

          <div>

            <label className="mb-2 block text-sm text-white/60">
              Gambar Utama Resource
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleMainImageChange
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-300 file:px-4 file:py-2 file:font-semibold file:text-[#07130f]"
            />

            <p className="mt-2 text-xs text-white/30">
              Pilih 1 gambar utama untuk
              ditampilkan sebagai foto utama resource.
            </p>

            {mainImage && (
              <div className="relative mt-4 w-full max-w-sm overflow-hidden rounded-2xl border border-emerald-300/20">

                <img
                  src={URL.createObjectURL(
                    mainImage
                  )}
                  alt="Gambar utama resource"
                  className="h-56 w-full object-cover"
                />

                <div className="absolute left-3 top-3 rounded-lg bg-emerald-300 px-3 py-1 text-xs font-bold text-[#07130f]">
                  GAMBAR UTAMA
                </div>

                <button
                  type="button"
                  onClick={
                    removeMainImage
                  }
                  disabled={loading}
                  className="absolute right-3 top-3 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                >
                  Hapus
                </button>

              </div>
            )}

          </div>

          {/* ==========================================
              DETAIL IMAGES
          ========================================== */}

          <div>

            <label className="mb-2 block text-sm text-white/60">
              Gambar Detail Resource
            </label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={
                handleDetailImagesChange
              }
              disabled={
                detailImages.length >=
                MAX_DETAIL_IMAGES
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-300 file:px-4 file:py-2 file:font-semibold file:text-[#07130f] disabled:opacity-50"
            />

            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/30">

              <span>
                Maksimal 3 gambar detail.
              </span>

              <span>
                •
              </span>

              <span>
                Total semua gambar maksimal 20 MB.
              </span>

            </div>

            {detailImages.length >
              0 && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                {detailImages.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-white/10"
                    >

                      <img
                        src={URL.createObjectURL(
                          image
                        )}
                        alt={`Detail ${index + 1}`}
                        className="h-40 w-full object-cover"
                      />

                      <div className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
                        Detail{" "}
                        {index + 1}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeDetailImage(
                            index
                          )
                        }
                        disabled={
                          loading
                        }
                        className="absolute right-2 top-2 rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                      >
                        Hapus
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* ==========================================
              IMAGE SUMMARY
          ========================================== */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-white/70">
                  Ringkasan Foto
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Gambar utama + gambar detail
                </p>
              </div>

              <div className="text-right">

                <p className="text-lg font-semibold text-white">
                  {totalImages}/4
                  {" "}gambar
                </p>

                <p
                  className={`text-xs ${
                    totalImageSize >
                    MAX_TOTAL_IMAGE_SIZE
                      ? "text-red-400"
                      : "text-white/30"
                  }`}
                >
                  {formatFileSize(
                    totalImageSize
                  )}{" "}
                  / 20 MB
                </p>

              </div>

            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">

              <div
                className="h-full rounded-full bg-emerald-300 transition-all"
                style={{
                  width: `${Math.min(
                    (totalImageSize /
                      MAX_TOTAL_IMAGE_SIZE) *
                      100,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* ==========================================
              ERROR
          ========================================== */}

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ==========================================
              ACTION BUTTONS
          ========================================== */}

          <div className="grid gap-3 sm:grid-cols-2">

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (
                  window.confirm(
                    "Batalkan pembuatan resource ini?"
                  )
                ) {
                  router.push(
                    "/resources"
                  );
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                profileLoading
              }
              className="w-full rounded-xl bg-emerald-300 py-3 font-semibold text-[#07130f] transition hover:-translate-y-0.5 hover:bg-emerald-200 disabled:opacity-50"
            >
              {loading
                ? "Menyimpan resource..."
                : "Tambah Resource"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}