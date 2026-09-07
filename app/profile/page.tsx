"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";

type Region = {
  code: string;
  name: string;
};

type ProfileForm = {
  full_name: string;
  username: string;

  province: string;
  province_code: string;

  city: string;
  city_code: string;

  district: string;
  district_code: string;

  role: string;
  organization: string;
  bio: string;
};

type ProfileMeta = {
  uid: string;
  avatar_url: string;
};

const ROLES = [
  {
    value: "citizen",
    id: "Warga",
    en: "Citizen",
  },
  {
    value: "student",
    id: "Mahasiswa/Pelajar",
    en: "Student",
  },
  {
    value: "organization",
    id: "Organisasi",
    en: "Organization",
  },
  {
    value: "business",
    id: "Bisnis",
    en: "Business",
  },
  {
    value: "community",
    id: "Komunitas",
    en: "Community",
  },
  {
    value: "government",
    id: "Pemerintah",
    en: "Government",
  },
  {
    value: "researcher",
    id: "Peneliti",
    en: "Researcher",
  },
  {
    value: "other",
    id: "Lainnya",
    en: "Other",
  },
];

const STUDENT_LEVELS = [
  "SD",
  "SMP",
  "SMA",
  "SMK",
  "Diploma",
  "S1",
  "S2",
  "S3",
];

/* =========================================================
   HELPERS
========================================================= */

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sortRegions(regions: Region[]) {
  return [...regions].sort((a, b) =>
    a.name.localeCompare(
      b.name,
      "id",
      {
        sensitivity: "base",
      }
    )
  );
}

function filterRegions(
  regions: Region[],
  query: string
) {
  const normalizedQuery =
    normalizeSearch(query);

  const sorted =
    sortRegions(regions);

  if (!normalizedQuery) {
    return sorted;
  }

  return sorted.filter((region) =>
    normalizeSearch(
      region.name
    ).includes(normalizedQuery)
  );
}

/**
 * API wilayah dapat mengembalikan:
 *
 * { data: [...] }
 * { data: { data: [...] } }
 * [...]
 *
 * Kita normalisasi semuanya di satu tempat.
 */
function extractRegionArray(
  payload: unknown
): Region[] {
  if (Array.isArray(payload)) {
    return payload
      .filter(
        (item): item is Region =>
          typeof item === "object" &&
          item !== null &&
          typeof (
            item as Record<
              string,
              unknown
            >
          ).code === "string" &&
          typeof (
            item as Record<
              string,
              unknown
            >
          ).name === "string"
      );
  }

  if (
    typeof payload !==
    "object" ||
    payload === null
  ) {
    return [];
  }

  const object =
    payload as Record<
      string,
      unknown
    >;

  const candidates = [
    object.data,
    object.results,
    object.items,
  ];

  for (const candidate of candidates) {
    const result =
      extractRegionArray(
        candidate
      );

    if (result.length > 0) {
      return result;
    }
  }

  return [];
}

function getInitials(
  fullName: string,
  username: string
) {
  const value =
    fullName.trim() ||
    username.trim();

  if (!value) {
    return "A";
  }

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

/**
 * Beberapa versi API / data lama dapat
 * memiliki variasi penulisan nama wilayah.
 *
 * Matching dibuat cukup longgar tetapi
 * tetap aman karena parent code tetap
 * digunakan untuk city/district.
 */
function findRegionByName(
  regions: Region[],
  name: string
) {
  const target =
    normalizeSearch(name);

  if (!target) {
    return undefined;
  }

  return regions.find(
    (region) =>
      normalizeSearch(
        region.name
      ) === target
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ProfilePage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const router =
    useRouter();

  const { locale } =
    useLanguage();

  /**
   * MIX mengikuti konsep existing
   * dictionary ARVENA:
   *
   * - EN -> English
   * - ID -> Indonesian
   * - default/MIX -> mixed UI
   */
  const isEnglish =
    locale === "en";

  const isIndonesian =
    locale === "id";

  /* =======================================================
     TRANSLATION
  ======================================================= */

  const text = {
    profileLabel: isEnglish
      ? "ARVENA PROFILE"
      : "ARVENA PROFILE",

    profileTitle: isEnglish
      ? "Your Profile"
      : isIndonesian
        ? "Profil Kamu"
        : "Your Profile",

    profileDescription:
      isEnglish
        ? "Manage your profile and location information to build more relevant connections across the ARVENA ecosystem."
        : isIndonesian
          ? "Kelola informasi profil dan lokasi kamu untuk membangun koneksi yang lebih relevan di ekosistem ARVENA."
          : "Kelola informasi profil dan lokasi kamu untuk membangun koneksi yang lebih relevan di ekosistem ARVENA.",

    completeTitle:
      isEnglish
        ? "Complete your profile"
        : "Lengkapi profile kamu",

    completeDescription:
      isEnglish
        ? "Required information is needed before you can perform certain activities such as offering resources."
        : "Data wajib diperlukan sebelum kamu dapat melakukan aktivitas tertentu seperti menawarkan resource.",

    completeStatus:
      isEnglish
        ? "Profile complete"
        : "Profile lengkap",

    completeStatusDescription:
      isEnglish
        ? "All required information has been completed."
        : "Semua informasi wajib sudah dilengkapi.",

    identity:
      isEnglish
        ? "Identity"
        : "Identitas",

    personalInformation:
      isEnglish
        ? "Personal Information"
        : "Informasi Pribadi",

    personalDescription:
      isEnglish
        ? "Basic information used on your ARVENA profile."
        : "Informasi dasar yang digunakan pada profil ARVENA kamu.",

    fullName:
      isEnglish
        ? "Full Name"
        : "Nama Lengkap",

    username:
      "Username",

    usernameHint:
      isEnglish
        ? "Your username is used as your short identity on ARVENA."
        : "Username digunakan sebagai identitas singkat di ARVENA.",

    role:
      isEnglish
        ? "Role"
        : "Peran",

    educationLevel:
      isEnglish
        ? "Education Level"
        : "Jenjang Pendidikan",

    chooseLevel:
      isEnglish
        ? "Choose education level"
        : "Pilih jenjang",

    school:
      isEnglish
        ? "School / University"
        : "Nama Sekolah / Kampus",

    location:
      isEnglish
        ? "Location"
        : "Lokasi",

    yourLocation:
      isEnglish
        ? "Your Location"
        : "Lokasi Kamu",

    locationDescription:
      isEnglish
        ? "Set your area so activities and connections in ARVENA can be more relevant."
        : "Tentukan wilayah kamu agar aktivitas dan koneksi di ARVENA lebih relevan.",

    province:
      isEnglish
        ? "Province"
        : "Provinsi",

    city:
      isEnglish
        ? "Regency / City"
        : "Kabupaten / Kota",

    district:
      isEnglish
        ? "District"
        : "Kecamatan",

    searchProvince:
      isEnglish
        ? "Search province..."
        : "Cari provinsi...",

    searchCity:
      isEnglish
        ? "Search regency or city..."
        : "Cari kabupaten atau kota...",

    searchDistrict:
      isEnglish
        ? "Search district..."
        : "Cari kecamatan...",

    chooseProvinceFirst:
      isEnglish
        ? "Choose a province first"
        : "Pilih provinsi terlebih dahulu",

    chooseCityFirst:
      isEnglish
        ? "Choose a regency/city first"
        : "Pilih kabupaten/kota terlebih dahulu",

    loadingProvince:
      isEnglish
        ? "Loading provinces..."
        : "Memuat provinsi...",

    loadingCity:
      isEnglish
        ? "Loading regencies/cities..."
        : "Memuat kabupaten/kota...",

    loadingDistrict:
      isEnglish
        ? "Loading districts..."
        : "Memuat kecamatan...",

    provinceNotFound:
      isEnglish
        ? "Province not found."
        : "Provinsi tidak ditemukan.",

    cityNotFound:
      isEnglish
        ? "Regency/city not found."
        : "Kabupaten/kota tidak ditemukan.",

    districtNotFound:
      isEnglish
        ? "District not found."
        : "Kecamatan tidak ditemukan.",

    about:
      isEnglish
        ? "About"
        : "Tentang",

    aboutYou:
      isEnglish
        ? "About You"
        : "Tentang Kamu",

    aboutDescription:
      isEnglish
        ? "Tell us a little about yourself and your contribution to the ARVENA ecosystem."
        : "Ceritakan sedikit tentang dirimu dan kontribusimu di ekosistem ARVENA.",

    bioOptional:
      isEnglish
        ? "Bio is optional."
        : "Bio bersifat opsional.",

    bioPlaceholder:
      isEnglish
        ? "Example: I am interested in circular economy, environmental technology, and sustainable cities..."
        : "Contoh: Saya tertarik pada circular economy, teknologi lingkungan, dan pengembangan kota berkelanjutan...",

    save:
      isEnglish
        ? "Save Profile"
        : "Simpan Profil",

    saving:
      isEnglish
        ? "Saving..."
        : "Menyimpan...",

    profileReady:
      isEnglish
        ? "Your profile is complete"
        : "Profile kamu sudah lengkap",

    profileReadyDescription:
      isEnglish
        ? "Required information is available and your profile is ready to use."
        : "Informasi wajib sudah tersedia dan profile siap digunakan.",

    profileIncomplete:
      isEnglish
        ? "Complete your profile first"
        : "Lengkapi profile terlebih dahulu",

    profileIncompleteDescription:
      isEnglish
        ? "Name, username, role, and location are required. Bio and profile photo are optional."
        : "Nama, username, role, dan lokasi wajib diisi. Bio dan foto profil bersifat opsional.",

    userNotDetected:
      isEnglish
        ? "User could not be detected. Please refresh the page."
        : "User belum terdeteksi. Silakan refresh halaman.",

    requiredIncomplete:
      isEnglish
        ? "Please complete all required information first."
        : "Lengkapi semua informasi wajib terlebih dahulu.",

    loadProfileError:
      isEnglish
        ? "Profile could not be loaded. Please refresh the page."
        : "Profile gagal dimuat. Silakan refresh halaman.",

    profileNotFound:
      isEnglish
        ? "Profile data is not available. Please contact the administrator."
        : "Data profile belum tersedia. Silakan hubungi administrator.",

    regionLoadError:
      isEnglish
        ? "Location data could not be loaded. Please try refreshing the page."
        : "Data wilayah gagal dimuat. Coba refresh halaman.",

    saveSuccess:
      isEnglish
        ? "Profile saved successfully."
        : "Profile berhasil disimpan.",

    saveError:
      isEnglish
        ? "An error occurred while saving your profile."
        : "Terjadi kesalahan saat menyimpan profile.",

    avatarChange:
      isEnglish
        ? "Change"
        : "Ganti",

    avatarUpdated:
      isEnglish
        ? "Profile photo updated successfully."
        : "Foto profil berhasil diperbarui.",

    maxPhoto:
      isEnglish
        ? "Profile photo must be 3 MB or smaller."
        : "Ukuran foto maksimal 3 MB.",

    imageOnly:
      isEnglish
        ? "File must be an image."
        : "File harus berupa gambar.",

    roleName: (
      role: string
    ) => {
      const found =
        ROLES.find(
          (item) =>
            item.value === role
        );

      if (!found) {
        return isEnglish
          ? "Citizen"
          : "Warga";
      }

      return isEnglish
        ? found.en
        : found.id;
    },

    organization:
      isEnglish
        ? "Organization"
        : "Organisasi",

    organizationPlaceholder:
      isEnglish
        ? "Organization / company"
        : "Organisasi / perusahaan",

    schoolPlaceholder:
      isEnglish
        ? "Example: Diponegoro University"
        : "Contoh: Universitas Diponegoro",

    researchInstitution:
      isEnglish
        ? "Research Institution"
        : "Institusi Penelitian",

    researchFocus:
      isEnglish
        ? "Research Focus"
        : "Fokus Penelitian",

    researchPlaceholder:
      isEnglish
        ? "Example: Circular economy and waste management"
        : "Contoh: Circular economy dan waste management",

    otherRole:
      isEnglish
        ? "Describe your role"
        : "Jelaskan peran kamu",

    otherRolePlaceholder:
      isEnglish
        ? "Example: Waste collector"
        : "Contoh: Pengelola sampah",

    orgLabel: (
      role: string
    ) => {
      switch (role) {
        case "organization":
          return isEnglish
            ? "Organization Name"
            : "Nama Organisasi";

        case "business":
          return isEnglish
            ? "Business Name"
            : "Nama Bisnis";

        case "community":
          return isEnglish
            ? "Community Name"
            : "Nama Komunitas";

        case "government":
          return isEnglish
            ? "Government Institution"
            : "Nama Institusi Pemerintahan";

        case "researcher":
          return isEnglish
            ? "Research Institution"
            : "Nama Institusi Penelitian";

        default:
          return isEnglish
            ? "Organization"
            : "Organisasi";
      }
    },

    orgPlaceholder: (
      role: string
    ) => {
      switch (role) {
        case "organization":
          return isEnglish
            ? "Example: Environmental Care Community"
            : "Contoh: Komunitas Peduli Lingkungan";

        case "business":
          return isEnglish
            ? "Example: ARVENA Recycling"
            : "Contoh: ARVENA Recycling";

        case "community":
          return isEnglish
            ? "Example: Green Community Semarang"
            : "Contoh: Green Community Semarang";

        case "government":
          return isEnglish
            ? "Example: Environmental Agency"
            : "Contoh: Dinas Lingkungan Hidup";

        case "researcher":
          return isEnglish
            ? "Example: Diponegoro University"
            : "Contoh: Universitas Diponegoro";

        default:
          return isEnglish
            ? "Organization / company"
            : "Organisasi / perusahaan";
      }
    },
  };

  /* =======================================================
     USER
  ======================================================= */

  const [userId, setUserId] =
    useState("");

  const [email, setEmail] =
    useState("");

  /* =======================================================
     PROFILE META
  ======================================================= */

  const [profileMeta, setProfileMeta] =
    useState<ProfileMeta>({
      uid: "",
      avatar_url: "",
    });

  /* =======================================================
     PROFILE FORM
  ======================================================= */

  const [form, setForm] =
    useState<ProfileForm>({
      full_name: "",
      username: "",

      province: "",
      province_code: "",

      city: "",
      city_code: "",

      district: "",
      district_code: "",

      role: "citizen",
      organization: "",
      bio: "",
    });

  /* =======================================================
     ROLE EXTRA
  ======================================================= */

  const [studentLevel, setStudentLevel] =
    useState("");

  const [researchFocus, setResearchFocus] =
    useState("");

  const [otherRole, setOtherRole] =
    useState("");

  /* =======================================================
     REGION DATA
  ======================================================= */

  const [provinces, setProvinces] =
    useState<Region[]>([]);

  const [cities, setCities] =
    useState<Region[]>([]);

  const [districts, setDistricts] =
    useState<Region[]>([]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const [provinceQuery, setProvinceQuery] =
    useState("");

  const [cityQuery, setCityQuery] =
    useState("");

  const [districtQuery, setDistrictQuery] =
    useState("");

  /* =======================================================
     DROPDOWN
  ======================================================= */

  const [showProvinceOptions, setShowProvinceOptions] =
    useState(false);

  const [showCityOptions, setShowCityOptions] =
    useState(false);

  const [showDistrictOptions, setShowDistrictOptions] =
    useState(false);

  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [loadingProvinces, setLoadingProvinces] =
    useState(false);

  const [loadingCities, setLoadingCities] =
    useState(false);

  const [loadingDistricts, setLoadingDistricts] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  /* =======================================================
     FEEDBACK
  ======================================================= */

  const [regionError, setRegionError] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [avatarError, setAvatarError] =
    useState("");

  /* =========================================================
     GENERIC REGION FETCHER
  ========================================================= */

  async function fetchRegions(
    url: string
  ): Promise<Region[]> {
    const response =
      await fetch(url, {
        cache: "no-store",
      });

    if (!response.ok) {
      let detail = "";

      try {
        detail =
          await response.text();
      } catch {
        // ignore
      }

      console.error(
        "REGION REQUEST FAILED:",
        url,
        response.status,
        detail
      );

      throw new Error(
        `Region request failed: ${response.status}`
      );
    }

    const result =
      await response.json();

    const regions =
      extractRegionArray(result);

    if (
      regions.length === 0
    ) {
      console.error(
        "REGION RESPONSE HAS NO DATA:",
        url,
        result
      );

      throw new Error(
        "Region response is empty or invalid."
      );
    }

    return sortRegions(
      regions
    );
  }

  /* =========================================================
     LOAD PROVINCES
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadProvinces() {
      setLoadingProvinces(true);
      setRegionError("");

      try {
        let regions: Region[] = [];

        try {
          regions =
            await fetchRegions(
              "/api/regions/provinces"
            );
        } catch (primaryError) {
          console.warn(
            "PRIMARY PROVINCE ENDPOINT FAILED:",
            primaryError
          );

          /**
           * Fallback ke route /api/regions
           * yang juga digunakan oleh beberapa
           * versi ARVENA sebelumnya.
           */
          regions =
            await fetchRegions(
              "/api/regions"
            );
        }

        if (!cancelled) {
          setProvinces(
            regions
          );
        }
      } catch (error) {
        console.error(
          "LOAD PROVINCES ERROR:",
          error
        );

        if (!cancelled) {
          setProvinces([]);
          setRegionError(
            text.regionLoadError
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProvinces(
            false
          );
        }
      }
    }

    void loadProvinces();

    return () => {
      cancelled = true;
    };
  }, [text.regionLoadError]);

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          router.push(
            "/auth/login"
          );
          return;
        }

        if (cancelled) {
          return;
        }

        setUserId(
          user.id
        );

        setEmail(
          user.email ?? ""
        );

        const {
          data,
          error,
        } =
          await supabase
            .from("profiles")
            .select(
              `
                id,
                uid,
                full_name,
                username,
                avatar_url,
                role,
                organization,
                city,
                city_code,
                district,
                district_code,
                province,
                province_code,
                bio
              `
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (error) {
          console.error(
            "LOAD PROFILE ERROR:",
            error
          );

          if (!cancelled) {
            setSaveMessage(
              text.loadProfileError
            );
          }

          return;
        }

        if (!data) {
          console.error(
            "PROFILE NOT FOUND:",
            user.id
          );

          if (!cancelled) {
            setSaveMessage(
              text.profileNotFound
            );
          }

          return;
        }

        if (cancelled) {
          return;
        }

        const loadedProvince =
          data.province ?? "";

        const loadedCity =
          data.city ?? "";

        const loadedDistrict =
          data.district ?? "";

        const loadedProvinceCode =
          data.province_code ??
          "";

        const loadedCityCode =
          data.city_code ??
          "";

        const loadedDistrictCode =
          data.district_code ??
          "";

        setForm({
          full_name:
            data.full_name ??
            "",

          username:
            data.username ??
            "",

          province:
            loadedProvince,

          province_code:
            loadedProvinceCode,

          city:
            loadedCity,

          city_code:
            loadedCityCode,

          district:
            loadedDistrict,

          district_code:
            loadedDistrictCode,

          role:
            data.role ??
            "citizen",

          organization:
            data.organization ??
            "",

          bio:
            data.bio ??
            "",
        });

        setProfileMeta({
          uid:
            data.uid ??
            "",

          avatar_url:
            data.avatar_url ??
            "",
        });

        setProvinceQuery(
          loadedProvince
        );

        setCityQuery(
          loadedCity
        );

        setDistrictQuery(
          loadedDistrict
        );

        /**
         * Student data lama:
         *
         * "S1 | Universitas Diponegoro"
         */
        if (
          data.role ===
            "student" &&
          data.organization
        ) {
          const parts =
            data.organization.split(
              " | "
            );

          if (
            parts.length >=
            2
          ) {
            const possibleLevel =
              parts[0];

            if (
              STUDENT_LEVELS.includes(
                possibleLevel
              )
            ) {
              setStudentLevel(
                possibleLevel
              );
            }
          }
        }

        /**
         * Researcher lama:
         * jika bio menyimpan:
         *
         * Research focus: ...
         */
        if (
          data.role ===
            "researcher" &&
          data.bio?.startsWith(
            "Research focus:"
          )
        ) {
          setResearchFocus(
            data.bio
              .replace(
                "Research focus:",
                ""
              )
              .trim()
          );
        }

        /**
         * Kalau other menggunakan
         * organization sebagai role.
         */
        if (
          data.role ===
            "other" &&
          data.organization
        ) {
          setOtherRole(
            data.organization
          );
        }

        /**
         * =====================================================
         * RESOLVE OLD PROFILE LOCATION
         * =====================================================
         *
         * Profile lama mungkin sudah punya:
         *
         * province = "Riau"
         *
         * tetapi:
         *
         * province_code = ""
         *
         * Kita cari code dari nama.
         */
        if (
          loadedProvince &&
          provinces.length > 0
        ) {
          const matchedProvince =
            findRegionByName(
              provinces,
              loadedProvince
            );

          if (
            matchedProvince &&
            !loadedProvinceCode
          ) {
            setForm(
              (previous) => ({
                ...previous,
                province_code:
                  matchedProvince.code,
              })
            );
          }

          if (
            matchedProvince
          ) {
            try {
              const cityData =
                await fetchRegions(
                  `/api/regions/regencies/${encodeURIComponent(
                    matchedProvince.code
                  )}`
                );

              if (
                cancelled
              ) {
                return;
              }

              setCities(
                cityData
              );

              const matchedCity =
                findRegionByName(
                  cityData,
                  loadedCity
                );

              if (
                matchedCity
              ) {
                setForm(
                  (previous) => ({
                    ...previous,
                    province_code:
                      matchedProvince.code,
                    city_code:
                      matchedCity.code,
                  })
                );

                try {
                  const districtData =
                    await fetchRegions(
                      `/api/regions/districts/${encodeURIComponent(
                        matchedCity.code
                      )}`
                    );

                  if (
                    cancelled
                  ) {
                    return;
                  }

                  setDistricts(
                    districtData
                  );

                  const matchedDistrict =
                    findRegionByName(
                      districtData,
                      loadedDistrict
                    );

                  if (
                    matchedDistrict
                  ) {
                    setForm(
                      (previous) => ({
                        ...previous,
                        province_code:
                          matchedProvince.code,
                        city_code:
                          matchedCity.code,
                        district_code:
                          matchedDistrict.code,
                      })
                    );
                  }
                } catch (
                  districtError
                ) {
                  console.warn(
                    "EXISTING DISTRICT RESOLVE FAILED:",
                    districtError
                  );
                }
              }
            } catch (
              cityError
            ) {
              console.warn(
                "EXISTING CITY RESOLVE FAILED:",
                cityError
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "LOAD PROFILE ERROR:",
          error
        );

        if (!cancelled) {
          setSaveMessage(
            text.loadProfileError
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [
    router,
    supabase,
    provinces,
    text.loadProfileError,
    text.profileNotFound,
  ]);

  /* =========================================================
     LOAD CITIES
  ========================================================= */

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
      const cityData =
        await fetchRegions(
          `/api/regions/regencies/${encodeURIComponent(
            provinceCode
          )}`
        );

      setCities(
        cityData
      );
    } catch (error) {
      console.error(
        "LOAD CITIES ERROR:",
        error
      );

      setCities([]);

      setRegionError(
        text.regionLoadError
      );
    } finally {
      setLoadingCities(
        false
      );
    }
  }

  /* =========================================================
     LOAD DISTRICTS
  ========================================================= */

  async function loadDistricts(
    cityCode: string
  ) {
    if (!cityCode) {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(
      true
    );

    setRegionError("");

    try {
      const districtData =
        await fetchRegions(
          `/api/regions/districts/${encodeURIComponent(
            cityCode.trim()
          )}`
        );

      setDistricts(
        districtData
      );
    } catch (error) {
      console.error(
        "LOAD DISTRICTS ERROR:",
        error
      );

      setDistricts([]);

      setRegionError(
        text.regionLoadError
      );
    } finally {
      setLoadingDistricts(
        false
      );
    }
  }

  /* =========================================================
     SELECT PROVINCE
  ========================================================= */

  async function selectProvince(
    province: Region
  ) {
    setRegionError("");

    setForm(
      (previous) => ({
        ...previous,

        province:
          province.name,

        province_code:
          province.code,

        city: "",
        city_code: "",

        district: "",
        district_code: "",
      })
    );

    setProvinceQuery(
      province.name
    );

    setCityQuery("");
    setDistrictQuery("");

    setCities([]);
    setDistricts([]);

    setShowProvinceOptions(
      false
    );

    setShowCityOptions(
      false
    );

    setShowDistrictOptions(
      false
    );

    await loadCities(
      province.code
    );
  }

  /* =========================================================
     SELECT CITY
  ========================================================= */

  async function selectCity(
    city: Region
  ) {
    setRegionError("");

    setForm(
      (previous) => ({
        ...previous,

        city:
          city.name,

        city_code:
          city.code,

        district: "",
        district_code: "",
      })
    );

    setCityQuery(
      city.name
    );

    setDistrictQuery("");

    setDistricts([]);

    setShowCityOptions(
      false
    );

    setShowDistrictOptions(
      false
    );

    await loadDistricts(
      city.code
    );
  }

  /* =========================================================
     SELECT DISTRICT
  ========================================================= */

  function selectDistrict(
    district: Region
  ) {
    setRegionError("");

    setForm(
      (previous) => ({
        ...previous,

        district:
          district.name,

        district_code:
          district.code,
      })
    );

    setDistrictQuery(
      district.name
    );

    setShowDistrictOptions(
      false
    );
  }

  /* =========================================================
     ROLE CHANGE
  ========================================================= */

  function changeRole(
    role: string
  ) {
    setForm(
      (previous) => ({
        ...previous,

        role,

        organization: "",
      })
    );

    setStudentLevel("");
    setResearchFocus("");
    setOtherRole("");
  }

  /* =========================================================
     AVATAR UPLOAD
  ========================================================= */

  async function handleAvatarUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (
      !file ||
      !userId
    ) {
      return;
    }

    setAvatarError("");

    const MAX_SIZE =
      3 * 1024 * 1024;

    if (
      file.size >
      MAX_SIZE
    ) {
      setAvatarError(
        text.maxPhoto
      );

      event.target.value =
        "";

      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setAvatarError(
        text.imageOnly
      );

      event.target.value =
        "";

      return;
    }

    setUploadingAvatar(
      true
    );

    try {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const filePath =
        `${userId}/avatar.${extension}`;

      /**
       * Pertahankan bucket existing
       * ARVENA.
       */
      if (
        profileMeta.avatar_url
      ) {
        try {
          const oldUrl =
            new URL(
              profileMeta.avatar_url
            );

          const marker =
            "/storage/v1/object/public/avatars/";

          const markerIndex =
            oldUrl.pathname.indexOf(
              marker
            );

          if (
            markerIndex !==
            -1
          ) {
            const oldPath =
              decodeURIComponent(
                oldUrl.pathname.slice(
                  markerIndex +
                    marker.length
                )
              );

            await supabase.storage
              .from("avatars")
              .remove([
                oldPath,
              ]);
          }
        } catch (
          removeError
        ) {
          console.warn(
            "OLD AVATAR REMOVE WARNING:",
            removeError
          );
        }
      }

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from("avatars")
          .upload(
            filePath,
            file,
            {
              upsert: true,
              contentType:
                file.type,
              cacheControl:
                "3600",
            }
          );

      if (
        uploadError
      ) {
        throw uploadError;
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(
            filePath
          );

      const avatarUrl =
        publicUrlData.publicUrl;

      const {
        error:
          updateError,
      } =
        await supabase
          .from("profiles")
          .update({
            avatar_url:
              avatarUrl,
          })
          .eq(
            "id",
            userId
          );

      if (
        updateError
      ) {
        throw updateError;
      }

      setProfileMeta(
        (previous) => ({
          ...previous,

          avatar_url:
            avatarUrl,
        })
      );

      setSaveMessage(
        text.avatarUpdated
      );
    } catch (error) {
      console.error(
        "AVATAR UPLOAD ERROR:",
        error
      );

      setAvatarError(
        error instanceof Error
          ? error.message
          : text.saveError
      );
    } finally {
      setUploadingAvatar(
        false
      );

      event.target.value =
        "";
    }
  }

  /* =========================================================
     REQUIRED PROFILE CHECK
  ========================================================= */

  const requiredFieldsComplete =
    Boolean(
      form.full_name.trim() &&
        form.username.trim() &&
        form.province.trim() &&
        form.province_code.trim() &&
        form.city.trim() &&
        form.city_code.trim() &&
        form.district.trim() &&
        form.district_code.trim() &&
        form.role.trim()
    ) &&
    (
      form.role ===
        "citizen" ||

      (
        form.role ===
          "student" &&
        studentLevel.trim() &&
        form.organization.trim()
      ) ||

      (
        [
          "organization",
          "business",
          "community",
          "government",
        ].includes(
          form.role
        ) &&
        form.organization.trim()
      ) ||

      (
        form.role ===
          "researcher" &&
        form.organization.trim() &&
        researchFocus.trim()
      ) ||

      (
        form.role ===
          "other" &&
        otherRole.trim()
      )
    );

  const requiredFieldCount =
    6 +
    (
      form.role ===
        "citizen"
        ? 0
        : form.role ===
            "student"
          ? 2
          : form.role ===
              "researcher"
            ? 2
            : 1
    );

  const completedRequiredCount =
    [
      form.full_name.trim(),
      form.username.trim(),
      form.province.trim(),
      form.city.trim(),
      form.district.trim(),
      form.role.trim(),

      ...(form.role ===
      "student"
        ? [
            studentLevel.trim(),
            form.organization.trim(),
          ]
        : form.role ===
            "researcher"
          ? [
              form.organization.trim(),
              researchFocus.trim(),
            ]
          : form.role ===
              "citizen"
            ? []
            : form.role ===
                "other"
              ? [
                  otherRole.trim(),
                ]
              : [
                  form.organization.trim(),
                ]),
    ].filter(Boolean)
      .length;

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  async function saveProfile(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!userId) {
      setSaveMessage(
        text.userNotDetected
      );

      return;
    }

    if (
      !requiredFieldsComplete
    ) {
      setSaveMessage(
        text.requiredIncomplete
      );

      return;
    }

    setSaving(true);
    setSaveMessage("");

    try {
      let organizationValue =
        form.organization.trim();

      /**
       * Student:
       * organization =
       *
       * "S1 | Universitas Diponegoro"
       */
      if (
        form.role ===
        "student"
      ) {
        organizationValue =
          `${studentLevel} | ${form.organization.trim()}`;
      }

      /**
       * Researcher:
       * jika bio kosong, simpan
       * research focus di bio.
       */
      let bioValue =
        form.bio.trim();

      if (
        form.role ===
          "researcher" &&
        !bioValue &&
        researchFocus.trim()
      ) {
        bioValue =
          `Research focus: ${researchFocus.trim()}`;
      }

      /**
       * Other:
       * organization dipakai untuk
       * menyimpan peran custom.
       */
      if (
        form.role ===
        "other"
      ) {
        organizationValue =
          otherRole.trim();
      }

      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            full_name:
              form.full_name.trim(),

            username:
              form.username.trim(),

            province:
              form.province.trim(),

            province_code:
              form.province_code.trim(),

            city:
              form.city.trim(),

            city_code:
              form.city_code.trim(),

            district:
              form.district.trim(),

            district_code:
              form.district_code.trim(),

            role:
              form.role,

            organization:
              organizationValue,

            bio:
              bioValue,
          })
          .eq(
            "id",
            userId
          );

      if (error) {
        console.error(
          "SAVE PROFILE ERROR:",
          error
        );

        setSaveMessage(
          error.message
        );

        return;
      }

      setForm(
        (previous) => ({
          ...previous,

          organization:
            organizationValue,

          bio:
            bioValue,
        })
      );

      setSaveMessage(
        text.saveSuccess
      );

      router.refresh();
    } catch (error) {
      console.error(
        "SAVE PROFILE ERROR:",
        error
      );

      setSaveMessage(
        text.saveError
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     FILTERED OPTIONS
  ========================================================= */

  const filteredProvinces =
    useMemo(
      () =>
        filterRegions(
          provinces,
          provinceQuery
        ),
      [
        provinces,
        provinceQuery,
      ]
    );

  const filteredCities =
    useMemo(
      () =>
        filterRegions(
          cities,
          cityQuery
        ),
      [
        cities,
        cityQuery,
      ]
    );

  const filteredDistricts =
    useMemo(
      () =>
        filterRegions(
          districts,
          districtQuery
        ),
      [
        districts,
        districtQuery,
      ]
    );

  /* =========================================================
     DISPLAY
  ========================================================= */

  const initials =
    getInitials(
      form.full_name,
      form.username
    );

  const displayName =
    form.full_name ||
    form.username ||
    "Arvena User";

  const displayRole =
    text.roleName(
      form.role
    );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07130f] px-4 py-10 text-white sm:px-6 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-white/10" />

            <div className="mt-4 h-10 w-64 rounded bg-white/10" />

            <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/5" />

            <div className="mt-10 h-[700px] rounded-3xl border border-white/10 bg-white/[0.03]" />
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#07130f] px-4 py-8 text-white sm:px-6 md:py-12">
      <div className="mx-auto max-w-4xl">

        {/* =================================================
            PROFILE HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* AVATAR */}

            <div className="relative shrink-0">

              {profileMeta.avatar_url ? (
                <img
                  src={
                    profileMeta.avatar_url
                  }
                  alt="Profile avatar"
                  className="h-24 w-24 rounded-3xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-300/20 bg-emerald-300/10 text-2xl font-semibold text-emerald-300">
                  {initials}
                </div>
              )}

              <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-full border border-white/10 bg-[#0b1b15] px-3 py-1.5 text-xs font-medium text-emerald-300 shadow-lg transition hover:bg-emerald-400/10">

                {uploadingAvatar
                  ? "..."
                  : text.avatarChange}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleAvatarUpload
                  }
                  disabled={
                    uploadingAvatar
                  }
                  className="hidden"
                />

              </label>

            </div>

            {/* PROFILE INFO */}

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {displayRole}
                </span>

                {form.organization &&
                  form.role !==
                    "student" && (
                    <span className="max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40">
                      {form.organization}
                    </span>
                  )}

              </div>

              <h1 className="mt-3 truncate text-3xl font-semibold tracking-tight md:text-4xl">
                {displayName}
              </h1>

              <p className="mt-1 text-sm text-white/50">
                {form.username
                  ? `@${form.username}`
                  : isEnglish
                    ? "Username not set"
                    : "Username belum diatur"}
              </p>

              {profileMeta.uid && (
                <p className="mt-1 text-xs font-medium tracking-[0.12em] text-emerald-300/70">
                  UID {profileMeta.uid}
                </p>
              )}

              <p className="mt-2 text-sm text-white/30">
                {email}
              </p>

              {avatarError && (
                <p className="mt-2 text-xs text-red-300">
                  {avatarError}
                </p>
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="mt-10">

          <p className="text-sm font-medium text-emerald-300">
            {text.profileLabel}
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {text.profileTitle}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            {text.profileDescription}
          </p>

        </div>

        {/* =================================================
            COMPLETENESS
        ================================================= */}

        {!requiredFieldsComplete ? (
          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-yellow-200">
                  {text.completeTitle}
                </p>

                <p className="mt-1 text-xs leading-5 text-yellow-200/50">
                  {text.completeDescription}
                </p>
              </div>

              <div className="shrink-0 text-sm font-semibold text-yellow-200">
                {completedRequiredCount}/
                {requiredFieldCount}
              </div>

            </div>

          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">

            <p className="text-sm font-medium text-emerald-300">
              {text.completeStatus}
            </p>

            <p className="mt-1 text-xs text-emerald-300/50">
              {text.completeStatusDescription}
            </p>

          </div>
        )}

        {/* =================================================
            REGION ERROR
        ================================================= */}

        {regionError && (
          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm leading-5 text-yellow-200/80">
            {regionError}
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={
            saveProfile
          }
          className="mt-8 space-y-8"
        >

          {/* =================================================
              IDENTITY
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-8">

            <div className="mb-6">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                {text.identity}
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                {text.personalInformation}
              </h3>

              <p className="mt-1 text-sm leading-6 text-white/35">
                {text.personalDescription}
              </p>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* FULL NAME */}

              <div>

                <label className="mb-2 block text-sm text-white/60">
                  {text.fullName}
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <input
                  value={
                    form.full_name
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        full_name:
                          event.target.value,
                      })
                    )
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                  placeholder={
                    isEnglish
                      ? "Your full name"
                      : "Nama lengkap"
                  }
                />

              </div>

              {/* USERNAME */}

              <div>

                <label className="mb-2 block text-sm text-white/60">
                  {text.username}
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                    @
                  </span>

                  <input
                    value={
                      form.username
                    }
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          username:
                            event.target.value.replace(
                              /\s/g,
                              ""
                            ),
                        })
                      )
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-9 pr-4 outline-none transition focus:border-emerald-400"
                    placeholder="username"
                  />

                </div>

                <p className="mt-2 text-xs leading-5 text-white/25">
                  {text.usernameHint}
                </p>

              </div>

              {/* ROLE */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm text-white/60">
                  {text.role}
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <select
                  value={
                    form.role
                  }
                  onChange={(event) =>
                    changeRole(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none transition focus:border-emerald-400"
                >

                  {ROLES.map(
                    (role) => (
                      <option
                        key={
                          role.value
                        }
                        value={
                          role.value
                        }
                      >
                        {isEnglish
                          ? role.en
                          : role.id}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* STUDENT */}

              {form.role ===
                "student" && (
                <>
                  <div>

                    <label className="mb-2 block text-sm text-white/60">
                      {text.educationLevel}
                      <span className="ml-1 text-emerald-300">
                        *
                      </span>
                    </label>

                    <select
                      value={
                        studentLevel
                      }
                      onChange={(event) =>
                        setStudentLevel(
                          event.target.value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none transition focus:border-emerald-400"
                    >

                      <option value="">
                        {text.chooseLevel}
                      </option>

                      {STUDENT_LEVELS.map(
                        (level) => (
                          <option
                            key={
                              level
                            }
                            value={
                              level
                            }
                          >
                            {level}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm text-white/60">
                      {text.school}
                      <span className="ml-1 text-emerald-300">
                        *
                      </span>
                    </label>

                    <input
                      value={
                        form.organization
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            organization:
                              event.target.value,
                          })
                        )
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                      placeholder={
                        text.schoolPlaceholder
                      }
                    />

                  </div>
                </>
              )}

              {/* ORGANIZATION / BUSINESS / COMMUNITY / GOVERNMENT */}

              {[
                "organization",
                "business",
                "community",
                "government",
              ].includes(
                form.role
              ) && (
                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm text-white/60">
                    {text.orgLabel(
                      form.role
                    )}
                    <span className="ml-1 text-emerald-300">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.organization
                    }
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          organization:
                            event.target.value,
                        })
                      )
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                    placeholder={
                      text.orgPlaceholder(
                        form.role
                      )
                    }
                  />

                </div>
              )}

              {/* RESEARCHER */}

              {form.role ===
                "researcher" && (
                <>
                  <div>

                    <label className="mb-2 block text-sm text-white/60">
                      {text.researchInstitution}
                      <span className="ml-1 text-emerald-300">
                        *
                      </span>
                    </label>

                    <input
                      value={
                        form.organization
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            organization:
                              event.target.value,
                          })
                        )
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                      placeholder={
                        text.schoolPlaceholder
                      }
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm text-white/60">
                      {text.researchFocus}
                      <span className="ml-1 text-emerald-300">
                        *
                      </span>
                    </label>

                    <input
                      value={
                        researchFocus
                      }
                      onChange={(event) =>
                        setResearchFocus(
                          event.target.value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                      placeholder={
                        text.researchPlaceholder
                      }
                    />

                  </div>
                </>
              )}

              {/* OTHER */}

              {form.role ===
                "other" && (
                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm text-white/60">
                    {text.otherRole}
                    <span className="ml-1 text-emerald-300">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      otherRole
                    }
                    onChange={(event) =>
                      setOtherRole(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                    placeholder={
                      text.otherRolePlaceholder
                    }
                  />

                </div>
              )}

            </div>

          </section>

          {/* =================================================
              LOCATION
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-8">

            <div className="mb-6">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                {text.location}
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                {text.yourLocation}
              </h3>

              <p className="mt-1 text-sm leading-6 text-white/35">
                {text.locationDescription}
              </p>

            </div>

            <div className="space-y-5">

              {/* =================================================
                  PROVINCE
              ================================================= */}

              <div className="relative">

                <label className="mb-2 block text-sm text-white/60">
                  {text.province}
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <input
                  value={
                    provinceQuery
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setProvinceQuery(
                      value
                    );

                    /**
                     * Ketika user mengubah
                     * query dari province yang
                     * sudah dipilih, reset
                     * child hierarchy.
                     */
                    if (
                      normalizeSearch(
                        value
                      ) !==
                      normalizeSearch(
                        form.province
                      )
                    ) {
                      setForm(
                        (previous) => ({
                          ...previous,

                          province: "",
                          province_code: "",

                          city: "",
                          city_code: "",

                          district: "",
                          district_code: "",
                        })
                      );

                      setCities([]);
                      setDistricts([]);

                      setCityQuery("");
                      setDistrictQuery("");
                    }

                    setShowProvinceOptions(
                      true
                    );
                  }}
                  onFocus={() =>
                    setShowProvinceOptions(
                      true
                    )
                  }
                  onBlur={() => {
                    setTimeout(
                      () =>
                        setShowProvinceOptions(
                          false
                        ),
                      180
                    );
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                  placeholder={
                    loadingProvinces
                      ? text.loadingProvince
                      : text.searchProvince
                  }
                />

                {showProvinceOptions &&
                  filteredProvinces.length >
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1b15] p-2 shadow-2xl">

                      {filteredProvinces.map(
                        (
                          province
                        ) => (
                          <button
                            key={
                              province.code
                            }
                            type="button"
                            onMouseDown={(
                              event
                            ) =>
                              event.preventDefault()
                            }
                            onClick={() =>
                              void selectProvince(
                                province
                              )
                            }
                            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-white/80 transition hover:bg-emerald-400/10 hover:text-emerald-300"
                          >
                            {
                              province.name
                            }
                          </button>
                        )
                      )}

                    </div>
                  )}

                {showProvinceOptions &&
                  !loadingProvinces &&
                  provinceQuery &&
                  filteredProvinces.length ===
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-[#0b1b15] p-4 text-sm text-white/40 shadow-2xl">
                      {text.provinceNotFound}
                    </div>
                  )}

              </div>

              {/* =================================================
                  CITY
              ================================================= */}

              <div className="relative">

                <label className="mb-2 block text-sm text-white/60">
                  {text.city}
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <input
                  value={
                    cityQuery
                  }
                  disabled={
                    !form.province_code
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setCityQuery(
                      value
                    );

                    if (
                      normalizeSearch(
                        value
                      ) !==
                      normalizeSearch(
                        form.city
                      )
                    ) {
                      setForm(
                        (previous) => ({
                          ...previous,

                          city: "",
                          city_code: "",

                          district: "",
                          district_code: "",
                        })
                      );

                      setDistrictQuery("");
                      setDistricts([]);
                    }

                    setShowCityOptions(
                      true
                    );
                  }}
                  onFocus={() =>
                    setShowCityOptions(
                      true
                    )
                  }
                  onBlur={() => {
                    setTimeout(
                      () =>
                        setShowCityOptions(
                          false
                        ),
                      180
                    );
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  placeholder={
                    !form.province_code
                      ? text.chooseProvinceFirst
                      : loadingCities
                        ? text.loadingCity
                        : text.searchCity
                  }
                />

                {loadingCities && (
                  <p className="mt-2 text-xs text-white/30">
                    {text.loadingCity}
                  </p>
                )}

                {showCityOptions &&
                  form.province_code &&
                  filteredCities.length >
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1b15] p-2 shadow-2xl">

                      {filteredCities.map(
                        (
                          city
                        ) => (
                          <button
                            key={
                              city.code
                            }
                            type="button"
                            onMouseDown={(
                              event
                            ) =>
                              event.preventDefault()
                            }
                            onClick={() =>
                              void selectCity(
                                city
                              )
                            }
                            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-white/80 transition hover:bg-emerald-400/10 hover:text-emerald-300"
                          >
                            {
                              city.name
                            }
                          </button>
                        )
                      )}

                    </div>
                  )}

                {showCityOptions &&
                  form.province_code &&
                  !loadingCities &&
                  cityQuery &&
                  filteredCities.length ===
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-white/10 bg-[#0b1b15] p-4 text-sm text-white/40 shadow-2xl">
                      {text.cityNotFound}
                    </div>
                  )}

              </div>

              {/* =================================================
                  DISTRICT
              ================================================= */}

              <div className="relative">

                <label className="mb-2 block text-sm text-white/60">
                  {text.district}
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <input
                  value={
                    districtQuery
                  }
                  disabled={
                    !form.city_code
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setDistrictQuery(
                      value
                    );

                    if (
                      normalizeSearch(
                        value
                      ) !==
                      normalizeSearch(
                        form.district
                      )
                    ) {
                      setForm(
                        (previous) => ({
                          ...previous,

                          district: "",
                          district_code: "",
                        })
                      );
                    }

                    setShowDistrictOptions(
                      true
                    );
                  }}
                  onFocus={() =>
                    setShowDistrictOptions(
                      true
                    )
                  }
                  onBlur={() => {
                    setTimeout(
                      () =>
                        setShowDistrictOptions(
                          false
                        ),
                      180
                    );
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  placeholder={
                    !form.city_code
                      ? text.chooseCityFirst
                      : loadingDistricts
                        ? text.loadingDistrict
                        : text.searchDistrict
                  }
                />

                {loadingDistricts && (
                  <p className="mt-2 text-xs text-white/30">
                    {text.loadingDistrict}
                  </p>
                )}

                {showDistrictOptions &&
                  form.city_code &&
                  filteredDistricts.length >
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1b15] p-2 shadow-2xl">

                      {filteredDistricts.map(
                        (
                          district
                        ) => (
                          <button
                            key={
                              district.code
                            }
                            type="button"
                            onMouseDown={(
                              event
                            ) =>
                              event.preventDefault()
                            }
                            onClick={() =>
                              selectDistrict(
                                district
                              )
                            }
                            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-white/80 transition hover:bg-emerald-400/10 hover:text-emerald-300"
                          >
                            {
                              district.name
                            }
                          </button>
                        )
                      )}

                    </div>
                  )}

                {showDistrictOptions &&
                  form.city_code &&
                  !loadingDistricts &&
                  districtQuery &&
                  filteredDistricts.length ===
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-white/10 bg-[#0b1b15] p-4 text-sm text-white/40 shadow-2xl">
                      {text.districtNotFound}
                    </div>
                  )}

              </div>

            </div>

          </section>

          {/* =================================================
              ABOUT
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-8">

            <div className="mb-6">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                {text.about}
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                {text.aboutYou}
              </h3>

              <p className="mt-1 text-sm leading-6 text-white/35">
                {text.aboutDescription}
              </p>

            </div>

            <textarea
              value={
                form.bio
              }
              onChange={(event) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    bio:
                      event.target.value,
                  })
                )
              }
              rows={6}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 leading-6 outline-none transition focus:border-emerald-400"
              placeholder={
                text.bioPlaceholder
              }
            />

            <p className="mt-2 text-xs text-white/25">
              {text.bioOptional}
            </p>

          </section>

          {/* =================================================
              SAVE AREA
          ================================================= */}

          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-medium text-white/70">
                {requiredFieldsComplete
                  ? text.profileReady
                  : text.profileIncomplete}
              </p>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-white/30">
                {requiredFieldsComplete
                  ? text.profileReadyDescription
                  : text.profileIncompleteDescription}
              </p>

            </div>

            <button
              type="submit"
              disabled={
                saving ||
                !requiredFieldsComplete
              }
              className="rounded-xl bg-emerald-400 px-7 py-3 font-semibold text-black transition hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-lg hover:shadow-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? text.saving
                : text.save}
            </button>

          </div>

          {/* =================================================
              SAVE MESSAGE
          ================================================= */}

          {saveMessage && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                saveMessage ===
                  text.saveSuccess
                  ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
                  : "border-red-400/20 bg-red-400/5 text-red-300"
              }`}
            >
              {saveMessage}
            </div>
          )}

        </form>

      </div>
    </main>
  );
}
