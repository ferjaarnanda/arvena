"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

/* =========================================================
   TYPES
========================================================= */

type Region = {
  code: string;
  name: string;
};

type ProfileForm = {
  full_name: string;
  username: string;
  province: string;
  city: string;
  district: string;
  role: string;
  organization: string;
  bio: string;
};

type ProfileMeta = {
  uid: string;
  avatar_url: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const ROLES = [
  {
    value: "citizen",
    label: "Citizen",
  },
  {
    value: "student",
    label: "Student",
  },
  {
    value: "organization",
    label: "Organization",
  },
  {
    value: "business",
    label: "Business",
  },
  {
    value: "community",
    label: "Community",
  },
  {
    value: "government",
    label: "Government",
  },
  {
    value: "researcher",
    label: "Researcher",
  },
  {
    value: "other",
    label: "Other",
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

/**
 * Digunakan HANYA untuk pencocokan.
 *
 * Tidak pernah digunakan sebagai value yang disimpan
 * ke database atau ditampilkan ke user.
 *
 * Contoh:
 *
 * "Tebing Tinggi"
 * "tebing tinggi"
 * "TEBING TINGGI"
 *
 * akan dianggap sama ketika mencari.
 *
 * Tetapi value asli yang ditampilkan tetap berasal
 * dari API/database.
 */
function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Sort hanya berdasarkan nama.
 *
 * PENTING:
 * Tidak mengubah nama asli.
 *
 * "Tebing Tinggi" tetap "Tebing Tinggi".
 */
function sortRegions(regions: Region[]) {
  return [...regions].sort((a, b) =>
    a.name.localeCompare(b.name, "id", {
      sensitivity: "base",
    })
  );
}

/**
 * Filter berdasarkan pencarian.
 */
function filterRegions(
  regions: Region[],
  query: string
) {
  const normalizedQuery =
    normalizeSearch(query);

  const sorted = sortRegions(regions);

  if (!normalizedQuery) {
    return sorted;
  }

  return sorted.filter((region) =>
    normalizeSearch(region.name).includes(
      normalizedQuery
    )
  );
}

/**
 * Cari region berdasarkan nama tanpa mengubah
 * nama region tersebut.
 */
function findRegionByName(
  regions: Region[],
  value: string
) {
  const normalizedValue =
    normalizeSearch(value);

  if (!normalizedValue) {
    return undefined;
  }

  return regions.find(
    (region) =>
      normalizeSearch(region.name) ===
      normalizedValue
  );
}

/**
 * Ambil initials profile.
 */
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
 * Role label.
 */
function getRoleLabel(role: string) {
  return (
    ROLES.find(
      (item) => item.value === role
    )?.label ?? "Citizen"
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

  const router = useRouter();
  const { locale } = useLanguage();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

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
      city: "",
      district: "",
      role: "citizen",
      organization: "",
      bio: "",
    });

  /* =======================================================
     EXTRA PROFILE DATA
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
     REGION CODES
  ======================================================= */

  /**
   * Code provinsi yang sedang dipilih.
   *
   * TIDAK disimpan ke database.
   * Hanya digunakan untuk mengambil kabupaten/kota.
   */
  const [selectedProvinceCode, setSelectedProvinceCode] =
    useState("");

  /**
   * Code kabupaten/kota yang sedang dipilih.
   *
   * TIDAK disimpan ke database.
   * Hanya digunakan untuk mengambil kecamatan.
   */
  const [selectedCityCode, setSelectedCityCode] =
    useState("");

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
     LOAD PROVINCES
  ========================================================= */

  const loadProvinces = useCallback(
    async () => {
      setLoadingProvinces(true);
      setRegionError("");

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

        const data =
          Array.isArray(result?.data)
            ? result.data
            : [];

        setProvinces(
          sortRegions(data)
        );

        return sortRegions(data);
      } catch (error) {
        console.error(
          "LOAD PROVINCES ERROR:",
          error
        );

        setProvinces([]);

        setRegionError(
          "Data provinsi gagal dimuat. Coba refresh halaman."
        );

        return [];
      } finally {
        setLoadingProvinces(false);
      }
    },
    []
  );

  /* =========================================================
     LOAD CITIES BY PROVINCE CODE
  ========================================================= */

  const loadCities = useCallback(
    async (
      provinceCode: string
    ) => {
      if (!provinceCode) {
        setCities([]);
        setSelectedCityCode("");
        return [];
      }

      setLoadingCities(true);
      setRegionError("");

      try {
        const response = await fetch(
          `/api/regions/regencies/${encodeURIComponent(
            provinceCode.trim()
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "CITY API RESPONSE:",
            errorText
          );

          throw new Error(
            `Gagal mengambil data kabupaten/kota. Status: ${response.status}`
          );
        }

        const result =
          await response.json();

        if (
          !Array.isArray(
            result?.data
          )
        ) {
          throw new Error(
            "Format data kabupaten/kota tidak valid."
          );
        }

        const cityData =
          sortRegions(result.data);

        setCities(cityData);

        return cityData;
      } catch (error) {
        console.error(
          "LOAD CITIES ERROR:",
          error
        );

        setCities([]);

        setRegionError(
          "Data kabupaten/kota gagal dimuat."
        );

        return [];
      } finally {
        setLoadingCities(false);
      }
    },
    []
  );

  /* =========================================================
     LOAD DISTRICTS BY CITY CODE
  ========================================================= */

  const loadDistricts = useCallback(
    async (
      cityCode: string
    ) => {
      if (!cityCode) {
        setDistricts([]);
        return [];
      }

      setLoadingDistricts(true);
      setRegionError("");

      try {
        const response = await fetch(
          `/api/regions/districts/${encodeURIComponent(
            cityCode.trim()
          )}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "DISTRICT API RESPONSE:",
            errorText
          );

          throw new Error(
            `Gagal mengambil data kecamatan. Status: ${response.status}`
          );
        }

        const result =
          await response.json();

        if (
          !Array.isArray(
            result?.data
          )
        ) {
          throw new Error(
            "Format data kecamatan tidak valid."
          );
        }

        const districtData =
          sortRegions(result.data);

        setDistricts(
          districtData
        );

        return districtData;
      } catch (error) {
        console.error(
          "LOAD DISTRICTS ERROR:",
          error
        );

        setDistricts([]);

        setRegionError(
          "Data kecamatan gagal dimuat."
        );

        return [];
      } finally {
        setLoadingDistricts(false);
      }
    },
    []
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        /**
         * -----------------------------------------------------
         * 1. GET AUTH USER
         * -----------------------------------------------------
         */

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError && userError.name !== "AuthSessionMissingError" && !userError.message?.toLowerCase().includes("session")) {
          console.warn("User session check:", userError.message);
        }

        if (!user) {
          router.push(
            "/auth/login"
          );
          return;
        }

        if (cancelled) {
          return;
        }

        setUserId(user.id);
        setEmail(
          user.email ?? ""
        );

        /**
         * -----------------------------------------------------
         * 2. LOAD PROFILE
         * -----------------------------------------------------
         */

        const {
          data: profile,
          error: profileError,
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
              district,
              province,
              bio
              `
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (profileError) {
          console.error(
            "LOAD PROFILE ERROR:",
            profileError
          );

          setSaveMessage(
            "Profile gagal dimuat. Silakan refresh halaman."
          );

          return;
        }

        if (!profile) {
          console.error(
            "PROFILE NOT FOUND:",
            user.id
          );

          setSaveMessage(
            "Data profile belum tersedia."
          );

          return;
        }

        if (cancelled) {
          return;
        }

        /**
         * -----------------------------------------------------
         * 3. SET PROFILE FORM
         * -----------------------------------------------------
         */

        const profileData: ProfileForm =
          {
            full_name:
              profile.full_name ??
              "",

            username:
              profile.username ??
              "",

            province:
              profile.province ??
              "",

            city:
              profile.city ??
              "",

            district:
              profile.district ??
              "",

            role:
              profile.role ??
              "citizen",

            organization:
              profile.organization ??
              "",

            bio:
              profile.bio ??
              "",
          };

        setForm(
          profileData
        );

        setProfileMeta({
          uid:
            profile.uid ??
            "",

          avatar_url:
            profile.avatar_url ??
            "",
        });

        /**
         * Query dibuat sama dengan data asli.
         *
         * JANGAN uppercase.
         */
        setProvinceQuery(
          profileData.province
        );

        setCityQuery(
          profileData.city
        );

        setDistrictQuery(
          profileData.district
        );

        /**
         * -----------------------------------------------------
         * 4. LOAD STUDENT DATA
         * -----------------------------------------------------
         */

        if (
          profileData.role ===
            "student" &&
          profileData.organization
        ) {
          const parts =
            profileData.organization.split(
              " | "
            );

          if (
            parts.length >= 2
          ) {
            const level =
              parts[0];

            if (
              STUDENT_LEVELS.includes(
                level
              )
            ) {
              setStudentLevel(
                level
              );
            }
          }
        }

        /**
         * -----------------------------------------------------
         * 5. LOAD RESEARCHER DATA
         * -----------------------------------------------------
         */

        if (
          profileData.role ===
            "researcher" &&
          profileData.bio
        ) {
          const prefix =
            "Research focus:";

          if (
            profileData.bio.startsWith(
              prefix
            )
          ) {
            setResearchFocus(
              profileData.bio
                .replace(
                  prefix,
                  ""
                )
                .trim()
            );
          }
        }

        /**
         * -----------------------------------------------------
         * 6. LOAD PROVINCES
         * -----------------------------------------------------
         *
         * Kita sengaja load langsung di sini supaya
         * proses existing profile tidak bergantung pada
         * state provinces yang belum selesai.
         */

        const provinceData =
          await loadProvinces();

        if (cancelled) {
          return;
        }

        /**
         * -----------------------------------------------------
         * 7. MATCH EXISTING PROVINCE
         * -----------------------------------------------------
         */

        const selectedProvince =
          findRegionByName(
            provinceData,
            profileData.province
          );

        if (
          !selectedProvince
        ) {
          console.warn(
            "PROVINCE NOT FOUND:",
            profileData.province
          );

          return;
        }

        setSelectedProvinceCode(
          selectedProvince.code
        );

        /**
         * -----------------------------------------------------
         * 8. LOAD EXISTING CITY
         * -----------------------------------------------------
         */

        const cityData =
          await loadCities(
            selectedProvince.code
          );

        if (cancelled) {
          return;
        }

        /**
         * -----------------------------------------------------
         * 9. MATCH EXISTING CITY
         * -----------------------------------------------------
         *
         * Ini bagian penting.
         *
         * Database menyimpan:
         *
         * "Kota Tebing Tinggi"
         *
         * atau
         *
         * "Tebing Tinggi"
         *
         * API harus dicari berdasarkan nama yang
         * sudah dinormalisasi.
         */

        const selectedCity =
          findRegionByName(
            cityData,
            profileData.city
          );

        if (
          !selectedCity
        ) {
          console.warn(
            "CITY NOT FOUND:",
            {
              savedCity:
                profileData.city,
              availableCities:
                cityData,
            }
          );

          return;
        }

        setSelectedCityCode(
          selectedCity.code
        );

        /**
         * -----------------------------------------------------
         * 10. LOAD EXISTING DISTRICT
         * -----------------------------------------------------
         */

        const districtData =
          await loadDistricts(
            selectedCity.code
          );

        if (cancelled) {
          return;
        }

        /**
         * -----------------------------------------------------
         * 11. MATCH EXISTING DISTRICT
         * -----------------------------------------------------
         */

        const selectedDistrict =
          findRegionByName(
            districtData,
            profileData.district
          );

        if (
          !selectedDistrict
        ) {
          console.warn(
            "DISTRICT NOT FOUND:",
            {
              savedDistrict:
                profileData.district,
              availableDistricts:
                districtData,
            }
          );

          /**
           * Jangan mengubah value database.
           *
           * Tetap tampilkan data yang tersimpan.
           */
          return;
        }

        /**
         * -----------------------------------------------------
         * 12. PASTIKAN QUERY MENAMPILKAN NAMA ASLI API
         * -----------------------------------------------------
         */

        setProvinceQuery(
          selectedProvince.name
        );

        setCityQuery(
          selectedCity.name
        );

        setDistrictQuery(
          selectedDistrict.name
        );

        /**
         * Form juga disinkronkan dengan nama API.
         *
         * Jadi misalnya API:
         *
         * Tebing Tinggi
         *
         * maka yang dipakai:
         *
         * Tebing Tinggi
         *
         * BUKAN:
         *
         * TEBING TINGGI
         */
        setForm(
          (previous) => ({
            ...previous,

            province:
              selectedProvince.name,

            city:
              selectedCity.name,

            district:
              selectedDistrict.name,
          })
        );
      } catch (error) {
        console.error(
          "PROFILE INITIALIZATION ERROR:",
          error
        );

        setSaveMessage(
          "Terjadi kesalahan saat memuat profile."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, [
    router,
    supabase,
    loadProvinces,
    loadCities,
    loadDistricts,
  ]);

  /* =========================================================
     SELECT PROVINCE
  ========================================================= */

  async function selectProvince(
    province: Region
  ) {
    /**
     * Simpan nama ASLI.
     */
    setForm(
      (previous) => ({
        ...previous,

        province:
          province.name,

        city: "",

        district: "",
      })
    );

    setProvinceQuery(
      province.name
    );

    setCityQuery("");
    setDistrictQuery("");

    setSelectedProvinceCode(
      province.code
    );

    setSelectedCityCode("");

    setCities([]);
    setDistricts([]);

    setShowProvinceOptions(
      false
    );

    setShowCityOptions(false);

    setShowDistrictOptions(
      false
    );

    /**
     * Load kabupaten/kota
     * berdasarkan CODE provinsi.
     */
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
    /**
     * Simpan nama ASLI API.
     */
    setForm(
      (previous) => ({
        ...previous,

        city: city.name,

        district: "",
      })
    );

    setCityQuery(
      city.name
    );

    setDistrictQuery("");

    setSelectedCityCode(
      city.code
    );

    setDistricts([]);

    setShowCityOptions(
      false
    );

    setShowDistrictOptions(
      false
    );

    /**
     * Load kecamatan berdasarkan
     * CODE kabupaten/kota.
     */
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
    /**
     * Simpan nama ASLI API.
     */
    setForm(
      (previous) => ({
        ...previous,

        district:
          district.name,
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
     ROLE
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
     ORGANIZATION LABEL
  ========================================================= */

  function getOrganizationLabel() {
    switch (form.role) {
      case "organization":
        return "Nama Organisasi";

      case "business":
        return "Nama Bisnis";

      case "community":
        return "Nama Community";

      case "government":
        return "Nama Institusi Pemerintahan";

      case "researcher":
        return "Nama Institusi Penelitian";

      default:
        return "Organization";
    }
  }

  function getOrganizationPlaceholder() {
    switch (form.role) {
      case "organization":
        return "Contoh: Komunitas Peduli Lingkungan";

      case "business":
        return "Contoh: Arvena Recycling";

      case "community":
        return "Contoh: Green Community Semarang";

      case "government":
        return "Contoh: Dinas Lingkungan Hidup";

      case "researcher":
        return "Contoh: Universitas Diponegoro";

      default:
        return "";
    }
  }

  /* =========================================================
     AVATAR UPLOAD
  ========================================================= */

  async function handleAvatarUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file || !userId) {
      return;
    }

    setAvatarError("");

    const MAX_SIZE =
      3 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      setAvatarError(
        "Ukuran foto maksimal 3 MB."
      );

      event.target.value = "";

      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setAvatarError(
        "File harus berupa gambar."
      );

      event.target.value = "";

      return;
    }

    setUploadingAvatar(true);

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
       * Hapus avatar lama.
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
            "/storage/v1/object/public/profile-avatars/";

          const markerIndex =
            oldUrl.pathname.indexOf(
              marker
            );

          if (
            markerIndex !== -1
          ) {
            const oldPath =
              decodeURIComponent(
                oldUrl.pathname.slice(
                  markerIndex +
                    marker.length
                )
              );

            await supabase.storage
              .from(
                "profile-avatars"
              )
              .remove([
                oldPath,
              ]);
          }
        } catch (error) {
          console.warn(
            "OLD AVATAR REMOVE WARNING:",
            error
          );
        }
      }

      /**
       * Upload avatar baru.
       */
      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            "profile-avatars"
          )
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

      if (uploadError) {
        throw uploadError;
      }

      /**
       * Public URL.
       */
      const {
        data: publicUrlData,
      } =
        supabase.storage
          .from(
            "profile-avatars"
          )
          .getPublicUrl(
            filePath
          );

      const avatarUrl =
        publicUrlData.publicUrl;

      /**
       * Update database.
       */
      const {
        error: updateError,
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

      if (updateError) {
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
        "Foto profil berhasil diperbarui."
      );
    } catch (error) {
      console.error(
        "AVATAR UPLOAD ERROR:",
        error
      );

      setAvatarError(
        error instanceof Error
          ? error.message
          : "Foto profil gagal diupload."
      );
    } finally {
      setUploadingAvatar(false);

      event.target.value = "";
    }
  }

  /* =========================================================
     REQUIRED PROFILE
  ========================================================= */

  const requiredFieldsComplete =
    Boolean(
      form.full_name.trim() &&
        form.username.trim() &&
        form.province.trim() &&
        form.city.trim() &&
        form.district.trim() &&
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
    ].filter(Boolean).length;

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  async function saveProfile(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!userId) {
      setSaveMessage(
        "User belum terdeteksi. Silakan refresh halaman."
      );

      return;
    }

    if (!requiredFieldsComplete) {
      setSaveMessage(
        "Lengkapi semua informasi wajib terlebih dahulu."
      );

      return;
    }

    setSaving(true);
    setSaveMessage("");

    try {
      /**
       * -----------------------------------------------------
       * ORGANIZATION
       * -----------------------------------------------------
       */

      let organizationValue =
        form.organization.trim();

      if (
        form.role ===
        "student"
      ) {
        organizationValue =
          `${studentLevel} | ${form.organization.trim()}`;
      }

      /**
       * -----------------------------------------------------
       * RESEARCHER
       * -----------------------------------------------------
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
       * -----------------------------------------------------
       * OTHER
       * -----------------------------------------------------
       */

      if (
        form.role ===
        "other"
      ) {
        organizationValue =
          otherRole.trim();
      }

      /**
       * -----------------------------------------------------
       * SAVE
       * -----------------------------------------------------
       *
       * Region disimpan menggunakan value ASLI:
       *
       * province:
       * "Sumatera Utara"
       *
       * city:
       * "Tebing Tinggi"
       *
       * district:
       * "Padang Hilir"
       *
       * Tidak ada uppercase.
       */

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

            city:
              form.city.trim(),

            district:
              form.district.trim(),

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
        "Profile berhasil disimpan."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "SAVE PROFILE ERROR:",
        error
      );

      setSaveMessage(
        "Terjadi kesalahan saat menyimpan profile."
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
     PROFILE DISPLAY
  ========================================================= */

  const initials =
    getInitials(
      form.full_name,
      form.username
    );

  const displayName =
    form.full_name ||
    form.username ||
    "ARVENA User";

  const displayRole =
    getRoleLabel(
      form.role
    );

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#092328] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-white/10" />

            <div className="mt-4 h-10 w-64 rounded bg-white/10" />

            <div className="mt-3 h-4 w-80 rounded bg-white/5" />

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
    <main className="relative min-h-screen bg-[#092328] px-6 py-10 text-white md:py-14 overflow-hidden">
      {/* Atmospheric beam */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-[550px] w-[550px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle at 30% 30%, #2A835F 0%, transparent 70%)" }}
      />
      <div className="mx-auto max-w-4xl">

        {/* =================================================
            PROFILE HEADER
        ================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* AVATAR */}

            <div className="flex shrink-0 flex-col items-center">

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

              <label className="mt-3 cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:border-emerald-300/20 hover:bg-emerald-400/10">
                {uploadingAvatar
                  ? "Uploading..."
                  : "Change"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
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
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40">
                      {
                        form.organization
                      }
                    </span>
                  )}

              </div>

              <h1 className="mt-3 truncate text-3xl font-semibold tracking-tight md:text-4xl">
                {displayName}
              </h1>

              <p className="mt-1 text-sm text-white/50">
                {form.username
                  ? `@${form.username}`
                  : "Username belum diatur"}
              </p>

              {profileMeta.uid && (
                <p className="mt-1 text-xs font-medium tracking-[0.12em] text-emerald-300/70">
                  UID{" "}
                  {
                    profileMeta.uid
                  }
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

            {/* LOG OUT BUTTON (HEADER) */}
            <div className="sm:ml-auto self-start sm:self-center">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 hover:border-red-500/40 disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>
                  {signingOut
                    ? locale === "id"
                      ? "Keluar..."
                      : "Logging out..."
                    : locale === "id"
                      ? "Keluar"
                      : "Log Out"}
                </span>
              </button>
            </div>

          </div>

        </div>

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="mt-10">

          <p className="text-sm font-medium text-emerald-300">
            ARVENA PROFILE
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Your Profile
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Kelola informasi profil dan lokasi
            kamu untuk membangun koneksi yang
            lebih relevan di ekosistem ARVENA.
          </p>

        </div>

        {/* =================================================
            PROFILE COMPLETENESS
        ================================================= */}

        {!requiredFieldsComplete ? (
          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-medium text-yellow-200">
                  Lengkapi profile kamu
                </p>

                <p className="mt-1 text-xs text-yellow-200/50">
                  Data wajib diperlukan sebelum
                  kamu dapat melakukan aktivitas
                  tertentu seperti menawarkan resource.
                </p>

              </div>

              <div className="shrink-0 text-sm font-semibold text-yellow-200">
                {
                  completedRequiredCount
                }
                /
                {
                  requiredFieldCount
                }
              </div>

            </div>

          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">

            <p className="text-sm font-medium text-emerald-300">
              Profile lengkap ✓
            </p>

            <p className="mt-1 text-xs text-emerald-300/50">
              Semua informasi wajib sudah
              dilengkapi.
            </p>

          </div>
        )}

        {/* =================================================
            REGION ERROR
        ================================================= */}

        {regionError && (
          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-200/80">
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

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

            <div className="mb-6">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                Identity
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Personal Information
              </h3>

              <p className="mt-1 text-sm text-white/35">
                Informasi dasar yang digunakan
                pada profil ARVENA kamu.
              </p>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* FULL NAME */}

              <div>

                <label className="mb-2 block text-sm text-white/60">
                  Full Name
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <input
                  value={
                    form.full_name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,

                      full_name:
                        e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                  placeholder="Nama lengkap"
                />

              </div>

              {/* USERNAME */}

              <div>

                <label className="mb-2 block text-sm text-white/60">
                  Username
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
                    onChange={(e) =>
                      setForm({
                        ...form,

                        username:
                          e.target.value.replace(
                            /\s/g,
                            ""
                          ),
                      })
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-9 pr-4 outline-none transition focus:border-emerald-400"
                    placeholder="username"
                  />

                </div>

                <p className="mt-2 text-xs text-white/25">
                  Username digunakan sebagai
                  identitas singkat di ARVENA.
                </p>

              </div>

              {/* ROLE */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm text-white/60">
                  Role
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <select
                  value={
                    form.role
                  }
                  onChange={(e) =>
                    changeRole(
                      e.target.value
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
                        {
                          role.label
                        }
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
                      Jenjang Pendidikan
                      <span className="ml-1 text-emerald-300">
                        *
                      </span>
                    </label>

                    <select
                      value={
                        studentLevel
                      }
                      onChange={(e) =>
                        setStudentLevel(
                          e.target.value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#0b1c16] px-4 py-3 outline-none transition focus:border-emerald-400"
                    >

                      <option value="">
                        Pilih jenjang
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
                      Nama Sekolah / Kampus
                      <span className="ml-1 text-emerald-300">
                        *
                      </span>
                    </label>

                    <input
                      value={
                        form.organization
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,

                          organization:
                            e.target
                              .value,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                      placeholder="Contoh: Universitas Diponegoro"
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
                    {
                      getOrganizationLabel()
                    }

                    <span className="ml-1 text-emerald-300">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.organization
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,

                        organization:
                          e.target
                            .value,
                      })
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                    placeholder={
                      getOrganizationPlaceholder()
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
                      Nama Institusi Penelitian
                      <span className="ml-1 text-emerald-300">
                        *
                      </span>
                    </label>

                    <input
                      value={
                        form.organization
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,

                          organization:
                            e.target
                              .value,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                      placeholder="Contoh: Universitas Diponegoro"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm text-white/60">
                      Fokus Penelitian
                      <span className="ml-1 text-emerald-300">
                        *
                      </span>
                    </label>

                    <input
                      value={
                        researchFocus
                      }
                      onChange={(e) =>
                        setResearchFocus(
                          e.target
                            .value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                      placeholder="Contoh: Circular economy dan waste management"
                    />

                  </div>
                </>
              )}

              {/* OTHER */}

              {form.role ===
                "other" && (
                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm text-white/60">
                    Jelaskan peran kamu
                    <span className="ml-1 text-emerald-300">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      otherRole
                    }
                    onChange={(e) =>
                      setOtherRole(
                        e.target
                          .value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                    placeholder="Contoh: Waste collector"
                  />

                </div>
              )}

            </div>

          </section>

          {/* =================================================
              LOCATION
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

            <div className="mb-6">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                Location
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Your Location
              </h3>

              <p className="mt-1 text-sm text-white/35">
                Tentukan wilayah kamu agar
                aktivitas dan koneksi di ARVENA
                lebih relevan.
              </p>

            </div>

            <div className="space-y-5">

              {/* =================================================
                  PROVINCE
              ================================================= */}

              <div className="relative">

                <label className="mb-2 block text-sm text-white/60">
                  Provinsi
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <input
                  value={
                    provinceQuery
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setProvinceQuery(
                      value
                    );

                    /**
                     * Jika user mengubah
                     * isi province secara manual,
                     * selection sebelumnya dianggap
                     * batal.
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

                          city: "",

                          district: "",
                        })
                      );

                      setSelectedProvinceCode(
                        ""
                      );

                      setSelectedCityCode(
                        ""
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
                    setTimeout(() => {
                      setShowProvinceOptions(
                        false
                      );
                    }, 150);
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400"
                  placeholder={
                    loadingProvinces
                      ? "Memuat provinsi..."
                      : "Cari provinsi..."
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
                            type="button"
                            key={
                              province.code
                            }
                            onMouseDown={(
                              e
                            ) =>
                              e.preventDefault()
                            }
                            onClick={() =>
                              selectProvince(
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
                      Provinsi tidak ditemukan.
                    </div>
                  )}

              </div>

              {/* =================================================
                  CITY
              ================================================= */}

              <div className="relative">

                <label className="mb-2 block text-sm text-white/60">
                  Kabupaten / Kota
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <input
                  value={
                    cityQuery
                  }
                  disabled={
                    !form.province
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setCityQuery(
                      value
                    );

                    /**
                     * Kalau user mengubah city
                     * manual, city code lama
                     * harus dihapus.
                     */
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

                          district: "",
                        })
                      );

                      setSelectedCityCode(
                        ""
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
                    setTimeout(() => {
                      setShowCityOptions(
                        false
                      );
                    }, 150);
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  placeholder={
                    form.province
                      ? "Cari kabupaten atau kota..."
                      : "Pilih provinsi terlebih dahulu"
                  }
                />

                {loadingCities && (
                  <p className="mt-2 text-xs text-white/30">
                    Memuat kabupaten/kota...
                  </p>
                )}

                {showCityOptions &&
                  form.province &&
                  filteredCities.length >
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1b15] p-2 shadow-2xl">

                      {filteredCities.map(
                        (city) => (
                          <button
                            type="button"
                            key={
                              city.code
                            }
                            onMouseDown={(
                              e
                            ) =>
                              e.preventDefault()
                            }
                            onClick={() =>
                              selectCity(
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
                  form.province &&
                  !loadingCities &&
                  cityQuery &&
                  filteredCities.length ===
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-white/10 bg-[#0b1b15] p-4 text-sm text-white/40 shadow-2xl">
                      Kabupaten/kota tidak ditemukan.
                    </div>
                  )}

              </div>

              {/* =================================================
                  DISTRICT
              ================================================= */}

              <div className="relative">

                <label className="mb-2 block text-sm text-white/60">
                  Kecamatan
                  <span className="ml-1 text-emerald-300">
                    *
                  </span>
                </label>

                <input
                  value={
                    districtQuery
                  }
                  disabled={
                    !form.city
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value;

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
                    setTimeout(() => {
                      setShowDistrictOptions(
                        false
                      );
                    }, 150);
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  placeholder={
                    form.city
                      ? "Cari kecamatan..."
                      : "Pilih kabupaten/kota terlebih dahulu"
                  }
                />

                {loadingDistricts && (
                  <p className="mt-2 text-xs text-white/30">
                    Memuat kecamatan...
                  </p>
                )}

                {showDistrictOptions &&
                  form.city &&
                  filteredDistricts.length >
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1b15] p-2 shadow-2xl">

                      {filteredDistricts.map(
                        (
                          district
                        ) => (
                          <button
                            type="button"
                            key={
                              district.code
                            }
                            onMouseDown={(
                              e
                            ) =>
                              e.preventDefault()
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
                  form.city &&
                  !loadingDistricts &&
                  districtQuery &&
                  filteredDistricts.length ===
                    0 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-white/10 bg-[#0b1b15] p-4 text-sm text-white/40 shadow-2xl">
                      Kecamatan tidak ditemukan.
                    </div>
                  )}

              </div>

            </div>

          </section>

          {/* =================================================
              ABOUT
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

            <div className="mb-6">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/70">
                About
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                About You
              </h3>

              <p className="mt-1 text-sm text-white/35">
                Ceritakan sedikit tentang dirimu
                dan kontribusimu di ekosistem
                ARVENA.
              </p>

            </div>

            <textarea
              value={
                form.bio
              }
              onChange={(e) =>
                setForm({
                  ...form,

                  bio: e.target.value,
                })
              }
              rows={6}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 leading-6 outline-none transition focus:border-emerald-400"
              placeholder="Contoh: Saya mahasiswa yang tertarik pada circular economy, teknologi lingkungan, dan pengembangan kota berkelanjutan..."
            />

            <p className="mt-2 text-xs text-white/25">
              Bio bersifat opsional.
            </p>

          </section>

          {/* =================================================
              SAVE AREA
          ================================================= */}

          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-medium text-white/70">
                {requiredFieldsComplete
                  ? "Profile kamu sudah lengkap"
                  : "Lengkapi profile terlebih dahulu"}
              </p>

              <p className="mt-1 text-xs text-white/30">
                {requiredFieldsComplete
                  ? "Informasi wajib sudah tersedia dan profile siap digunakan."
                  : "Nama, username, role, dan lokasi wajib diisi. Bio dan foto profil bersifat opsional."}
              </p>

            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                <span>{locale === "id" ? "Keluar" : "Log Out"}</span>
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  !requiredFieldsComplete
                }
                className="rounded-xl bg-[#2A835F] border border-[#12544F] px-7 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#349e73] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? locale === "id"
                    ? "Menyimpan..."
                    : "Saving..."
                  : locale === "id"
                    ? "Simpan Profil"
                    : "Save Profile"}
              </button>
            </div>

          </div>

          {/* =================================================
              SAVE MESSAGE
          ================================================= */}

          {saveMessage && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                saveMessage.includes(
                  "berhasil"
                )
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