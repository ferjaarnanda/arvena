"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

import type { User } from "@supabase/supabase-js";

type ResourceRecord = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string;
  custom_category: string | null;
  quantity: number;
  unit: string;
  price: number | null;
  negotiation_percent: number | null;
  province: string | null;
  city: string | null;
  district: string | null;
  images: string[] | null;
  status: string;
  [key: string]: unknown;
};

const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

export default function EditResourcePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const resourceId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [resource, setResource] = useState<ResourceRecord | null>(null);

  // ==========================================
  // FORM
  // ==========================================

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [category, setCategory] =
    useState("organic");
  const [customCategory, setCustomCategory] =
    useState("");
  const [quantity, setQuantity] =
    useState("");
  const [unit, setUnit] = useState("kg");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [negotiationPercent, setNegotiationPercent] =
    useState("");

  // ==========================================
  // GAMBAR LAMA
  // ==========================================

  const [existingImages, setExistingImages] =
    useState<string[]>([]);

  // ==========================================
  // GAMBAR BARU
  // ==========================================

  const [newImages, setNewImages] =
    useState<File[]>([]);

  const [mainImageIndex, setMainImageIndex] =
    useState(0);

  // ==========================================
  // STATE
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  // ==========================================
  // LOAD RESOURCE
  // ==========================================

  useEffect(() => {
    async function loadResource() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      const {
        data,
        error: resourceError,
      } = await supabase
        .from("resources")
        .select("*")
        .eq("id", resourceId)
        .single();

      if (
        resourceError ||
        !data
      ) {
        setError(
          "Resource tidak ditemukan."
        );
        setLoading(false);
        return;
      }

      // ========================================
      // CEK PEMILIK
      // ========================================

      if (data.owner_id !== user.id) {
        setError(
          "Kamu bukan pemilik resource ini."
        );
        setLoading(false);
        return;
      }

      setResource(data);

      // ========================================
      // ISI FORM
      // ========================================

      setTitle(data.title || "");
      setDescription(
        data.description || ""
      );
      setCategory(
        data.category || "organic"
      );
      setCustomCategory(
        data.custom_category || ""
      );
      setQuantity(
        String(data.quantity ?? "")
      );
      setUnit(data.unit || "kg");
      setCity(data.city || "");
      setPrice(
        String(data.price ?? "")
      );
      setNegotiationPercent(
        String(
          data.negotiation_percent ?? 0
        )
      );

      // ========================================
      // GAMBAR LAMA
      // ========================================

      const images =
        Array.isArray(data.images)
          ? data.images
          : [];

      setExistingImages(images);

      setLoading(false);
    }

    loadResource();
  }, [resourceId, router]);

  // ==========================================
  // TOTAL UKURAN FILE BARU
  // ==========================================

  function getNewImagesSize() {
    return newImages.reduce(
      (total, file) =>
        total + file.size,
      0
    );
  }

  // ==========================================
  // FORMAT SIZE
  // ==========================================

  function formatSize(bytes: number) {
    return (
      (bytes /
        1024 /
        1024).toFixed(2) +
      " MB"
    );
  }

  // ==========================================
  // TAMBAH GAMBAR BARU
  // ==========================================

  function handleNewImagesChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      e.target.files || []
    );

    if (files.length === 0) {
      return;
    }

    setError("");
    setSuccess("");

    // ========================================
    // VALIDASI JUMLAH
    // ========================================

    if (
      existingImages.length +
        newImages.length +
        files.length >
      4
    ) {
      setError(
        "Maksimal 4 gambar total: 1 gambar utama + 3 gambar detail."
      );

      e.target.value = "";
      return;
    }

    // ========================================
    // VALIDASI TIPE
    // ========================================

    const invalidFile =
      files.find(
        (file) =>
          !file.type.startsWith(
            "image/"
          )
      );

    if (invalidFile) {
      setError(
        `"${invalidFile.name}" bukan file gambar.`
      );

      e.target.value = "";
      return;
    }

    // ========================================
    // VALIDASI TOTAL SIZE
    // ========================================

    const totalSize =
      getNewImagesSize() +
      files.reduce(
        (total, file) =>
          total + file.size,
        0
      );

    if (
      totalSize >
      MAX_TOTAL_SIZE
    ) {
      setError(
        `Ukuran gambar baru terlalu besar. Maksimal 20 MB. Saat ini ${formatSize(
          totalSize
        )}.`
      );

      e.target.value = "";
      return;
    }

    setNewImages((prev) => [
      ...prev,
      ...files,
    ]);

    e.target.value = "";
  }

  // ==========================================
  // HAPUS GAMBAR LAMA
  // ==========================================

  function removeExistingImage(
    index: number
  ) {
    const confirmed = window.confirm(
      "Hapus gambar ini dari resource?"
    );

    if (!confirmed) {
      return;
    }

    setExistingImages((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );

    // ========================================
    // PERBAIKI INDEX GAMBAR UTAMA
    // ========================================

    if (
      mainImageIndex === index
    ) {
      setMainImageIndex(0);
    } else if (
      mainImageIndex > index
    ) {
      setMainImageIndex(
        (prev) => prev - 1
      );
    }
  }

  // ==========================================
  // HAPUS GAMBAR BARU
  // ==========================================

  function removeNewImage(
    index: number
  ) {
    setNewImages((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  }

  // ==========================================
  // SET GAMBAR UTAMA
  // ==========================================

  function makeExistingMain(
    index: number
  ) {
    setMainImageIndex(index);
  }

  // ==========================================
  // SIMPAN PERUBAHAN
  // ==========================================

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!user) {
      setError("Silakan login terlebih dahulu.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    // ========================================
    // VALIDASI
    // ========================================

    if (!title.trim()) {
      setError(
        "Judul resource wajib diisi."
      );
      setSaving(false);
      return;
    }

    const numericQuantity =
      Number(quantity);

    if (
      !numericQuantity ||
      numericQuantity <= 0
    ) {
      setError(
        "Quantity harus lebih dari 0."
      );
      setSaving(false);
      return;
    }

    const numericPrice =
      Number(price);

    if (
      Number.isNaN(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      setError(
        "Harga tidak valid."
      );
      setSaving(false);
      return;
    }

    const numericNegotiation =
      Number(
        negotiationPercent || 0
      );

    if (
      numericNegotiation < 0 ||
      numericNegotiation > 100
    ) {
      setError(
        "Persentase negosiasi harus antara 0 sampai 100."
      );
      setSaving(false);
      return;
    }

    // ========================================
    // TOTAL GAMBAR
    // ========================================

    const totalImages =
      existingImages.length +
      newImages.length;

    if (totalImages > 4) {
      setError(
        "Maksimal 4 gambar."
      );
      setSaving(false);
      return;
    }

    // ========================================
    // UPLOAD GAMBAR BARU
    // ========================================

    const uploadedUrls: string[] = [];

    for (
      const file of newImages
    ) {
      const fileExtension =
        file.name
          .split(".")
          .pop();

      const fileName =
        `${crypto.randomUUID()}.${fileExtension}`;

      const filePath =
        `${user.id}/${resourceId}/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from(
          "resource-images"
        )
        .upload(
          filePath,
          file,
          {
            cacheControl:
              "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "IMAGE UPLOAD ERROR:",
          uploadError
        );

        setError(
          `Gagal upload gambar: ${uploadError.message}`
        );

        setSaving(false);
        return;
      }

      const {
        data: publicUrlData,
      } =
        supabase.storage
          .from(
            "resource-images"
          )
          .getPublicUrl(
            filePath
          );

      uploadedUrls.push(
        publicUrlData
          .publicUrl
      );
    }

    // ========================================
    // GABUNG GAMBAR
    // ========================================

    let finalImages = [
      ...existingImages,
      ...uploadedUrls,
    ];

    // ========================================
    // BATAS 4 GAMBAR
    // ========================================

    if (
      finalImages.length > 4
    ) {
      finalImages =
        finalImages.slice(
          0,
          4
        );
    }

    // ========================================
    // PINDAHKAN GAMBAR UTAMA KE DEPAN
    // ========================================

    if (
      finalImages.length > 0 &&
      mainImageIndex <
        finalImages.length
    ) {
      const selectedMain =
        finalImages[
          mainImageIndex
        ];

      finalImages = [
        selectedMain,
        ...finalImages.filter(
          (_, index) =>
            index !==
            mainImageIndex
        ),
      ];
    }

    // ========================================
    // UPDATE DATABASE
    // ========================================

    const {
      error: updateError,
    } = await supabase
      .from("resources")
      .update({
        title:
          title.trim(),
        description:
          description.trim(),
        category,
        custom_category:
          category === "other"
            ? customCategory.trim()
            : null,
        quantity:
          numericQuantity,
        unit,
        city:
          city.trim(),
        price:
          numericPrice,
        negotiation_percent:
          numericNegotiation,
        images:
          finalImages,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", resourceId)
      .eq("owner_id", user.id);

    if (updateError) {
      console.error(
        "RESOURCE UPDATE ERROR:",
        updateError
      );

      setError(
        `Gagal menyimpan perubahan: ${updateError.message}`
      );

      setSaving(false);
      return;
    }

    // ========================================
    // BERHASIL
    // ========================================

    setSuccess(
      "Resource berhasil diperbarui."
    );

    setSaving(false);

    setTimeout(() => {
      router.push(
        `/resources/${resourceId}`
      );

      router.refresh();
    }, 700);
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07130f] text-white">
        <p className="text-white/50">
          Loading resource...
        </p>
      </main>
    );
  }

  // ==========================================
  // ERROR AWAL
  // ==========================================

  if (
    error &&
    !resource
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07130f] px-6 text-white">
        <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-8">
          <h1 className="text-2xl font-semibold">
            Cannot Edit Resource
          </h1>

          <p className="mt-3 text-white/50">
            {error}
          </p>

          <button
            onClick={() =>
              router.push(
                `/resources/${resourceId}`
              )
            }
            className="mt-6 rounded-xl bg-white/10 px-5 py-3"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">

      <div className="mx-auto max-w-3xl">

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/resources/${resourceId}`
            )
          }
          className="text-sm text-emerald-300 hover:text-emerald-200"
        >
          ← Back to Resource
        </button>

        {/* HEADER */}

        <p className="mt-8 text-sm text-emerald-300">
          ARVENA RESOURCE
        </p>

        <h1 className="mt-3 text-4xl font-semibold">
          Edit Resource
        </h1>

        <p className="mt-3 text-white/40">
          Perbarui informasi resource
          dan gambar yang kamu upload.
        </p>

        {/* ====================================
            FORM
        ==================================== */}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >

          {/* TITLE */}

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Title
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-300"
              placeholder="Contoh: Botol Plastik Bekas"
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={5}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-300"
              placeholder="Jelaskan resource..."
            />
          </div>

          {/* CATEGORY */}

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-3 outline-none focus:border-emerald-300"
            >
              <option value="organic">
                Organic
              </option>

              <option value="plastic">
                Plastic
              </option>

              <option value="paper">
                Paper
              </option>

              <option value="metal">
                Metal
              </option>

              <option value="electronic">
                Electronic
              </option>

              <option value="food">
                Food
              </option>

              <option value="textile">
                Textile
              </option>

              <option value="other">
                Other Material
              </option>
            </select>
          </div>

          {/* CUSTOM CATEGORY INPUT (IF OTHER) */}
          {category === "other" && (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.03] p-4 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="mb-2 block text-sm font-medium text-emerald-300">
                Custom Material / Resource Type *
              </label>
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Contoh: Sisa Kain Perca, Palet Kayu Pinus, Scrap Karet..."
                className="w-full rounded-xl border border-emerald-300/30 bg-[#07130f] px-4 py-3 text-white outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300"
              />
              <p className="mt-1.5 text-xs text-white/40">
                Sebutkan jenis material/sumber daya secara spesifik agar mudah dicari di marketplace.
              </p>
            </div>
          )}

          {/* QUANTITY + UNIT */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Quantity
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Unit
              </label>

              <input
                value={unit}
                onChange={(e) =>
                  setUnit(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-300"
                placeholder="kg"
              />
            </div>

          </div>

          {/* CITY */}

          <div>
            <label className="mb-2 block text-sm text-white/60">
              City
            </label>

            <input
              value={city}
              onChange={(e) =>
                setCity(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-300"
              placeholder="Semarang"
            />
          </div>

          {/* PRICE */}

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Price per Unit
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-300"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Negotiation (%)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={
                  negotiationPercent
                }
                onChange={(e) =>
                  setNegotiationPercent(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-emerald-300"
                placeholder="10"
              />
            </div>

          </div>

          {/* ====================================
              EXISTING IMAGES
          ==================================== */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold">
                  Current Images
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Klik gambar untuk
                  menjadikannya gambar
                  utama.
                </p>
              </div>

              <span className="text-xs text-white/30">
                {existingImages.length}
                /4
              </span>

            </div>

            {existingImages.length >
            0 ? (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">

                {existingImages.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      key={`${image}-${index}`}
                      className={`relative overflow-hidden rounded-xl border ${
                        index ===
                        mainImageIndex
                          ? "border-emerald-300 ring-2 ring-emerald-300/30"
                          : "border-white/10"
                      }`}
                    >

                      <button
                        type="button"
                        onClick={() =>
                          makeExistingMain(
                            index
                          )
                        }
                        className="block w-full"
                      >
                        <img
                          src={image}
                          alt={`Resource image ${
                            index + 1
                          }`}
                          className="h-32 w-full object-cover"
                        />
                      </button>

                      {index ===
                        mainImageIndex && (
                        <div className="absolute left-2 top-2 rounded-full bg-emerald-300 px-2 py-1 text-[10px] font-semibold text-[#07130f]">
                          MAIN
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeExistingImage(
                            index
                          )
                        }
                        className="absolute right-2 top-2 rounded-full bg-red-500/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                      >
                        ✕
                      </button>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
                Tidak ada gambar
                lama.
              </div>
            )}

          </div>

          {/* ====================================
              ADD NEW IMAGES
          ==================================== */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <h2 className="font-semibold">
              Add New Images
            </h2>

            <p className="mt-2 text-xs text-white/30">
              Maksimal 4 gambar total.
              Ukuran gambar baru
              maksimal 20 MB.
            </p>

            <label className="mt-5 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-emerald-300/30 bg-emerald-300/5 px-5 py-8 text-center transition hover:bg-emerald-300/10">

              <div>
                <p className="font-medium text-emerald-300">
                  + Choose Images
                </p>

                <p className="mt-1 text-xs text-white/30">
                  JPG, PNG, WEBP
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handleNewImagesChange
                }
                className="hidden"
              />

            </label>

            {/* NEW IMAGE PREVIEW */}

            {newImages.length >
              0 && (
              <div className="mt-5">

                <p className="mb-3 text-sm text-white/50">
                  New Images
                </p>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

                  {newImages.map(
                    (
                      file,
                      index
                    ) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-white/10"
                      >

                        <img
                          src={URL.createObjectURL(
                            file
                          )}
                          alt={file.name}
                          className="h-32 w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeNewImage(
                              index
                            )
                          }
                          className="absolute right-2 top-2 rounded-full bg-red-500/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                        >
                          ✕
                        </button>

                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 text-[10px] text-white/80">
                          {formatSize(
                            file.size
                          )}
                        </div>

                      </div>
                    )
                  )}

                </div>

                <p className="mt-3 text-xs text-white/30">
                  Total gambar baru:{" "}
                  {formatSize(
                    getNewImagesSize()
                  )}
                </p>

              </div>
            )}

          </div>

          {/* ====================================
              ERROR
          ==================================== */}

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ====================================
              SUCCESS
          ==================================== */}

          {success && (
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-300">
              {success}
            </div>
          )}

          {/* ====================================
              BUTTON
          ==================================== */}

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/resources/${resourceId}`
                )
              }
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white/70 transition hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-300 py-3 font-semibold text-[#07130f] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}