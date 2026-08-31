"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

export default function ResourceDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const resourceId = params.id as string;

  const [resource, setResource] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  // ==========================================
  // FORMAT RUPIAH
  // ==========================================

  function formatRupiah(value: string | number) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "0";
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

    if (Number.isNaN(number)) {
      return "0";
    }

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  }

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      // ========================================
      // CEK USER
      // ========================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "AUTH ERROR:",
          userError
        );

        setError(
          `Auth error: ${userError.message}`
        );

        setLoading(false);
        return;
      }

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      // ========================================
      // AMBIL RESOURCE
      // ========================================

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from("resources")
        .select(`
          *,
          profiles (
            full_name,
            username,
            city,
            avatar_url
          )
        `)
        .eq("id", resourceId)
        .single();

      if (resourceError || !resourceData) {
        console.error(
          "RESOURCE DETAIL ERROR:",
          resourceError
        );

        setError(
          "Resource tidak ditemukan atau sudah dihapus."
        );

        setLoading(false);
        return;
      }

      setResource(resourceData);

      // ========================================
      // SET GAMBAR UTAMA
      // ========================================

      const resourceImages =
        Array.isArray(resourceData.images)
          ? resourceData.images
          : [];

      if (resourceImages.length > 0) {
        setSelectedImage(
          resourceImages[0]
        );
      }

      setLoading(false);
    }

    loadData();
  }, [resourceId, router]);

  // ==========================================
  // DELETE RESOURCE
  // ==========================================

  async function handleDeleteResource() {
    const confirmed = window.confirm(
      "Yakin ingin menghapus resource ini?\n\nResource akan dihapus dari NEXORA dan tidak dapat dikembalikan."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    const {
      error: deleteError,
    } = await supabase
      .from("resources")
      .delete()
      .eq("id", resource.id)
      .eq("owner_id", user.id);

    if (deleteError) {
      console.error(
        "DELETE RESOURCE ERROR:",
        deleteError
      );

      setError(
        `Resource gagal dihapus: ${deleteError.message}`
      );

      setDeleting(false);
      return;
    }

    router.push("/resources");
    router.refresh();
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07130f] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-300" />

          <p className="mt-4 text-sm text-white/40">
            Loading resource...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (
    error ||
    !resource ||
    !user
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07130f] px-6 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-400/10 p-8">
          <p className="text-sm font-medium text-red-300">
            NEXORA RESOURCE
          </p>

          <h1 className="mt-3 text-2xl font-semibold">
            Resource Tidak Ditemukan
          </h1>

          <p className="mt-3 leading-6 text-white/50">
            {error ||
              "Resource tidak dapat ditemukan."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/resources")
            }
            className="mt-6 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium transition hover:bg-white/15"
          >
            ← Back to Resources
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // DATA RESOURCE
  // ==========================================

  const isOwner =
    resource.owner_id === user.id;

  const images: string[] =
    Array.isArray(resource.images)
      ? resource.images
      : [];

  const mainImage =
    selectedImage ||
    images[0] ||
    null;

  const quantity =
    Number(resource.quantity) || 0;

  const pricePerUnit =
    Number(resource.price) || 0;

  const negotiationPercent =
    Number(
      resource.negotiation_percent || 0
    );

  const totalPrice =
    quantity *
    pricePerUnit;

  const minimumPricePerUnit =
    pricePerUnit *
    (1 -
      negotiationPercent / 100);

  const minimumTotalPrice =
    totalPrice *
    (1 -
      negotiationPercent / 100);

  const ownerName =
    resource.profiles?.full_name ||
    resource.profiles?.username ||
    "NEXORA User";

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">

      <div className="mx-auto max-w-6xl">

        {/* ======================================
            BACK
        ====================================== */}

        <button
          type="button"
          onClick={() =>
            router.push("/resources")
          }
          className="text-sm text-emerald-300 transition hover:text-emerald-200"
        >
          ← Back to Resources
        </button>

        {/* ======================================
            MAIN CARD
        ====================================== */}

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">

          {/* ====================================
              IMAGE SECTION
          ==================================== */}

          {mainImage ? (
            <div className="p-5">

              {/* MAIN IMAGE */}

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">

                <img
                  src={mainImage}
                  alt={resource.title}
                  className="h-[420px] w-full object-cover"
                />

                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
                  Resource Image
                </div>

              </div>

              {/* THUMBNAILS */}

              {images.length > 1 && (
                <div className="mt-5">

                  <div className="mb-3 flex items-center justify-between">

                    <p className="text-sm font-medium text-white/70">
                      Resource Photos
                    </p>

                    <p className="text-xs text-white/30">
                      {images.length}{" "}
                      {images.length === 1
                        ? "image"
                        : "images"}
                    </p>

                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                    {images.map(
                      (
                        image,
                        index
                      ) => {
                        const isSelected =
                          selectedImage ===
                          image;

                        return (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() =>
                              setSelectedImage(
                                image
                              )
                            }
                            className={`group relative overflow-hidden rounded-xl border transition ${
                              isSelected
                                ? "border-emerald-300 ring-2 ring-emerald-300/30"
                                : "border-white/10 hover:border-white/30"
                            }`}
                          >

                            <img
                              src={image}
                              alt={`${resource.title} image ${
                                index + 1
                              }`}
                              className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
                            />

                            {index ===
                              0 && (
                              <div className="absolute left-2 top-2 rounded-md bg-emerald-300 px-2 py-1 text-[10px] font-semibold text-[#07130f]">
                                MAIN
                              </div>
                            )}

                            {isSelected && (
                              <div className="absolute inset-0 bg-emerald-300/10" />
                            )}

                          </button>
                        );
                      }
                    )}

                  </div>
                </div>
              )}

            </div>
          ) : (

            /* ==================================
               NO IMAGE
            ================================== */

            <div className="flex h-80 items-center justify-center border-b border-white/10 bg-white/[0.02]">

              <div className="text-center">

                <div className="text-6xl opacity-20">
                  📦
                </div>

                <p className="mt-4 text-sm text-white/30">
                  No image available
                </p>

              </div>

            </div>
          )}

          {/* ====================================
              CONTENT
          ==================================== */}

          <div className="p-8">

            {/* CATEGORY + STATUS */}

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div className="flex flex-wrap gap-2">

                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs capitalize text-emerald-300">
                  {resource.category}
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                  {resource.unit}
                </span>

              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs capitalize ${
                  resource.status ===
                  "available"
                    ? "bg-emerald-300/10 text-emerald-300"
                    : "bg-white/10 text-white/50"
                }`}
              >
                ●{" "}
                {resource.status}
              </span>

            </div>

            {/* TITLE */}

            <h1 className="mt-6 text-4xl font-semibold tracking-tight">
              {resource.title}
            </h1>

            {/* LOCATION */}

            <p className="mt-3 text-sm text-white/40">
              📍 {resource.city ||
                "Location not specified"}
            </p>

            {/* DESCRIPTION */}

            <div className="mt-8">

              <p className="text-sm font-medium text-white/60">
                Description
              </p>

              <p className="mt-3 max-w-4xl whitespace-pre-line leading-7 text-white/50">
                {resource.description ||
                  "Tidak ada deskripsi untuk resource ini."}
              </p>

            </div>

            {/* ==================================
                RESOURCE INFORMATION
            ================================== */}

            <div className="mt-8 grid gap-4 md:grid-cols-3">

              {/* QUANTITY */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <p className="text-sm text-white/40">
                  Available Quantity
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatRupiah(
                    quantity
                  )}{" "}
                  <span className="text-base font-normal text-white/40">
                    {resource.unit}
                  </span>
                </p>

              </div>

              {/* LOCATION */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <p className="text-sm text-white/40">
                  Location
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {resource.city ||
                    "Unknown"}
                </p>

              </div>

              {/* PRICE */}

              <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-5">

                <p className="text-sm text-white/40">
                  Price per{" "}
                  {resource.unit}
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  Rp
                  {formatRupiah(
                    pricePerUnit
                  )}
                </p>

              </div>

            </div>

            {/* ==================================
                PRICE SUMMARY
            ================================== */}

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-sm font-medium text-white/60">
                Price Summary
              </p>

              <div className="mt-5 grid gap-6 md:grid-cols-2">

                {/* TOTAL */}

                <div>

                  <p className="text-xs text-white/30">
                    Total resource value
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    Rp
                    {formatRupiah(
                      totalPrice
                    )}
                  </p>

                  <p className="mt-2 text-xs text-white/30">
                    {formatRupiah(
                      quantity
                    )}{" "}
                    {resource.unit} × Rp
                    {formatRupiah(
                      pricePerUnit
                    )}
                  </p>

                </div>

                {/* NEGOTIATION */}

                <div>

                  <p className="text-xs text-white/30">
                    Negotiation limit
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {negotiationPercent}%
                  </p>

                  <p className="mt-2 text-xs text-white/30">
                    {negotiationPercent ===
                    0
                      ? "Harga tidak dapat dinegosiasikan."
                      : `Pembeli dapat menawar hingga ${negotiationPercent}%.`}
                  </p>

                </div>

              </div>

              {/* MINIMUM PRICE */}

              {negotiationPercent >
                0 && (
                <div className="mt-6 border-t border-white/10 pt-5">

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>

                      <p className="text-xs text-white/30">
                        Minimum price per{" "}
                        {resource.unit}
                      </p>

                      <p className="mt-2 text-xl font-semibold text-emerald-300">
                        Rp
                        {formatRupiah(
                          minimumPricePerUnit
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-white/30">
                        Minimum total price
                      </p>

                      <p className="mt-2 text-xl font-semibold text-emerald-300">
                        Rp
                        {formatRupiah(
                          minimumTotalPrice
                        )}
                      </p>

                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* ==================================
                OWNER
            ================================== */}

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-sm text-white/40">
                Resource Owner
              </p>

              <div className="mt-4 flex items-center gap-4">

                {/* AVATAR */}

                {resource.profiles
                  ?.avatar_url ? (

                  <img
                    src={
                      resource.profiles
                        .avatar_url
                    }
                    alt={ownerName}
                    className="h-12 w-12 rounded-full object-cover"
                  />

                ) : (

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300/10 text-lg">
                    👤
                  </div>
                )}

                <div>

                  <p className="font-medium">
                    {ownerName}
                  </p>

                  {resource.profiles
                    ?.username && (
                    <p className="mt-1 text-sm text-white/30">
                      @
                      {
                        resource
                          .profiles
                          .username
                      }
                    </p>
                  )}

                  <p className="mt-1 text-xs text-white/30">
                    {resource.profiles
                      ?.city ||
                      resource.city ||
                      "City not specified"}
                  </p>

                </div>

              </div>

            </div>

            {/* ==================================
                ERROR
            ================================== */}

            {error && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* ==================================
                ACTION
            ================================== */}

            <div className="mt-8 border-t border-white/10 pt-8">

              {isOwner ? (

                /* =================================
                   OWNER
                ================================= */

                <div>

                  <div className="mb-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-5">

                    <p className="font-medium">
                      This is your resource
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/40">
                      Kamu dapat mengubah
                      informasi, mengatur gambar,
                      atau menghapus resource ini.
                    </p>

                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">

                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/resources/${resource.id}/edit`
                        )
                      }
                      className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-6 py-4 font-semibold text-emerald-300 transition hover:-translate-y-0.5 hover:bg-emerald-300/20"
                    >
                      ✏️ Edit Resource
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={
                        handleDeleteResource
                      }
                      disabled={deleting}
                      className="rounded-2xl border border-red-400/20 bg-red-400/10 px-6 py-4 font-semibold text-red-300 transition hover:-translate-y-0.5 hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleting
                        ? "Deleting..."
                        : "🗑️ Delete Resource"}
                    </button>

                  </div>

                </div>

              ) : resource.status !==
                "available" ? (

                /* =================================
                   UNAVAILABLE
                ================================= */

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">

                  <p className="font-medium">
                    Resource Unavailable
                  </p>

                  <p className="mt-2 text-sm text-white/40">
                    Resource ini sedang tidak
                    tersedia untuk request.
                  </p>

                </div>

              ) : (

                /* =================================
                   REQUEST
                ================================= */

                <div>

                  <div className="mb-4">

                    <p className="text-sm text-white/40">
                      Interested in this resource?
                    </p>

                    <p className="mt-1 text-xs text-white/25">
                      Ajukan permintaan kepada pemilik
                      resource melalui NEXORA.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/resources/${resource.id}/request`
                      )
                    }
                    className="block w-full rounded-2xl bg-emerald-300 px-6 py-4 text-center font-semibold text-[#07130f] transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-200"
                  >
                    Request This Resource →
                  </button>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}