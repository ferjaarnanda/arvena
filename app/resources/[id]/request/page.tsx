"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Resource = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string | null;
  quantity: number | string;
  unit: string | null;
  city: string | null;
  price: number | string;
  negotiation_percent: number | string | null;
};

type AuthUser = {
  id: string;
  email?: string | null;
};

export default function NewRequestPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useParams();

  const resourceId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  // =========================================================
  // STATE
  // =========================================================

  const [resource, setResource] =
    useState<Resource | null>(null);

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [quantity, setQuantity] =
    useState("");

  const [offeredPrice, setOfferedPrice] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [submitError, setSubmitError] =
    useState("");

  // =========================================================
  // FORMAT ANGKA
  //
  // Contoh:
  // 1     -> 1
  // 1.1   -> 1,1
  // 1.5   -> 1,5
  // 10    -> 10
  // =========================================================

  function formatNumber(
    value: string | number | null | undefined
  ) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const number =
      typeof value === "number"
        ? value
        : Number(value);

    if (!Number.isFinite(number)) {
      return "";
    }

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  }

  // =========================================================
  // FORMAT RUPIAH
  //
  // PENTING:
  // Kalau value sudah berupa NUMBER, jangan menghapus
  // titik decimal menggunakan replace().
  //
  // Ini adalah sumber utama bug sebelumnya.
  //
  // 26666.4
  // harus menjadi:
  // Rp26.666,40
  //
  // BUKAN:
  // Rp266.664
  // =========================================================

  function formatRupiah(
    value: string | number | null | undefined
  ) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    let number: number;

    // -------------------------------------------------------
    // Kalau sudah NUMBER
    // langsung gunakan nilainya.
    // -------------------------------------------------------

    if (typeof value === "number") {
      number = value;
    } else {
      // -----------------------------------------------------
      // Kalau STRING:
      //
      // "22222"
      // "22222,5"
      // "22.222"
      //
      // Input harga tawaran menggunakan:
      // titik = pemisah ribuan
      // koma  = decimal
      // -----------------------------------------------------

      const normalized = value
        .replace(/\./g, "")
        .replace(",", ".");

      number = Number(normalized);
    }

    if (!Number.isFinite(number)) {
      return "";
    }

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  }

  // =========================================================
  // PARSE RUPIAH
  //
  // "22.222"     -> 22222
  // "24.444,20"  -> 24444.20
  // "24999,75"   -> 24999.75
  // =========================================================

  function parseRupiah(value: string) {
    if (!value) {
      return 0;
    }

    const normalized = value
      .replace(/\./g, "")
      .replace(",", ".");

    const number = Number(normalized);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return number;
  }

  // =========================================================
  // PARSE QUANTITY
  // =========================================================

  function parseQuantity(value: string) {
    if (!value) {
      return 0;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return number;
  }

  // =========================================================
  // HANDLE QUANTITY
  //
  // Quantity hanya boleh kelipatan 0.1
  //
  // 1
  // 1.1
  // 1.2
  // 1.3
  // dst.
  // =========================================================

  function handleQuantityChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = e.target.value;

    if (value === "") {
      setQuantity("");
      setOfferedPrice("");
      setSubmitError("");
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    const roundedValue =
      Math.round(numericValue * 10) / 10;

    setQuantity(String(roundedValue));
    setOfferedPrice("");
    setSubmitError("");
  }

  // =========================================================
  // HANDLE HARGA TAWARAN
  // =========================================================

  function handleOfferedPriceChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    let value = e.target.value;

    // Hapus titik pemisah ribuan
    value = value.replace(/\./g, "");

    // Hanya angka dan koma
    value = value.replace(/[^\d,]/g, "");

    // Hanya boleh satu koma
    const parts = value.split(",");

    if (parts.length > 2) {
      value =
        parts[0] +
        "," +
        parts.slice(1).join("");
    }

    // Maksimal 2 angka decimal
    const decimalParts = value.split(",");

    if (decimalParts[1]) {
      value =
        decimalParts[0] +
        "," +
        decimalParts[1].slice(0, 2);
    }

    setOfferedPrice(value);
    setSubmitError("");
  }

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setPageError("");

      // =====================================================
      // VALIDASI RESOURCE ID
      // =====================================================

      if (!resourceId) {
        if (!mounted) {
          return;
        }

        setPageError(
          "Resource ID tidak ditemukan."
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // CEK USER
      // =====================================================

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (authError || !authUser) {
        router.push("/auth/login");
        return;
      }

      const currentUser: AuthUser = {
        id: authUser.id,
        email: authUser.email,
      };

      setUser(currentUser);

      // =====================================================
      // AMBIL RESOURCE
      // =====================================================

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from("resources")
        .select("*")
        .eq("id", resourceId)
        .single();

      if (!mounted) {
        return;
      }

      if (
        resourceError ||
        !resourceData
      ) {
        console.error(
          "RESOURCE LOAD ERROR:",
          resourceError
        );

        setPageError(
          "Resource tidak ditemukan."
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // NORMALISASI RESOURCE
      // =====================================================

      const normalizedResource: Resource = {
        id: String(resourceData.id),

        owner_id:
          String(resourceData.owner_id),

        title:
          String(resourceData.title ?? ""),

        description:
          resourceData.description ?? null,

        category:
          resourceData.category ?? null,

        quantity:
          resourceData.quantity ?? 0,

        unit:
          resourceData.unit ?? null,

        city:
          resourceData.city ?? null,

        price:
          resourceData.price ?? 0,

        negotiation_percent:
          resourceData.negotiation_percent ?? 0,
      };

      setResource(normalizedResource);
      setLoading(false);
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [
    resourceId,
    router,
    supabase,
  ]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07130f] px-6 text-white">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-300" />

          <p className="mt-4 text-sm text-white/40">
            Loading resource...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR LOAD
  // =========================================================

  if (
    pageError ||
    !resource ||
    !user
  ) {
    return (
      <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10">
              <span className="text-xl text-red-300">
                !
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-semibold">
              Resource tidak dapat dibuka
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {pageError ||
                "Resource tidak dapat ditemukan atau sesi pengguna tidak tersedia."}
            </p>

            <Link
              href="/explore"
              className="mt-6 inline-flex rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#07130f] transition hover:bg-emerald-200"
            >
              Kembali ke Explore
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // NON-NULL REFERENCE
  // =========================================================

  const currentResource: Resource =
    resource;

  const currentUser: AuthUser = user;

  // =========================================================
  // CEGAH PEMILIK REQUEST RESOURCE SENDIRI
  // =========================================================

  if (
    currentResource.owner_id ===
    currentUser.id
  ) {
    return (
      <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/resources/${currentResource.id}`}
            className="text-sm text-white/40 transition hover:text-emerald-300"
          >
            ← Back to Resource
          </Link>

          <div className="mt-8 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
              <span className="text-xl text-amber-300">
                !
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-semibold">
              Cannot Request This Resource
            </h1>

            <p className="mt-3 leading-6 text-white/50">
              Kamu tidak dapat membuat
              request terhadap resource
              milikmu sendiri.
            </p>

            <Link
              href={`/resources/${currentResource.id}`}
              className="mt-6 inline-flex rounded-xl bg-emerald-300 px-5 py-3 font-semibold text-[#07130f] transition hover:bg-emerald-200"
            >
              Back to Resource
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // DATA RESOURCE
  // =========================================================

  const availableQuantity =
    Number(currentResource.quantity) || 0;

  const pricePerUnit =
    Number(currentResource.price) || 0;

  const negotiationPercent =
    Number(
      currentResource.negotiation_percent ??
        0
    ) || 0;

  const requestedQuantity =
    parseQuantity(quantity);

  // =========================================================
  // PERHITUNGAN HARGA
  //
  // Harga normal:
  //
  // quantity × harga per unit
  //
  // Contoh:
  //
  // 1.2 × Rp22.222
  // = Rp26.666,40
  //
  // Negosiasi 25%:
  //
  // Rp26.666,40 × 75%
  // = Rp19.999,80
  // =========================================================

  const normalPrice =
    requestedQuantity *
    pricePerUnit;

  const minimumPrice =
    normalPrice *
    (1 -
      negotiationPercent / 100);

  // =========================================================
  // HARGA TAWARAN
  // =========================================================

  const buyerOfferedPrice =
    parseRupiah(offeredPrice);

  const hasQuantity =
    requestedQuantity > 0;

  const quantityWithinLimit =
    hasQuantity &&
    requestedQuantity <=
      availableQuantity;

  const hasOfferedPrice =
    buyerOfferedPrice > 0;

  const offeredPriceIsValid =
    hasQuantity &&
    quantityWithinLimit &&
    hasOfferedPrice &&
    buyerOfferedPrice >=
      minimumPrice;

  const canSubmit =
    !submitting &&
    offeredPriceIsValid;

  // =========================================================
  // HANDLE SUBMIT
  // =========================================================

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSubmitError("");

    // =======================================================
    // AMBIL NILAI TERBARU
    // =======================================================

    const requestedQuantityValue =
      parseQuantity(quantity);

    const buyerOfferedPriceValue =
      parseRupiah(offeredPrice);

    const availableQuantityValue =
      Number(
        currentResource.quantity
      ) || 0;

    const pricePerUnitValue =
      Number(
        currentResource.price
      ) || 0;

    const negotiationPercentValue =
      Number(
        currentResource.negotiation_percent ??
          0
      ) || 0;

    // =======================================================
    // VALIDASI QUANTITY
    // =======================================================

    if (
      !Number.isFinite(
        requestedQuantityValue
      ) ||
      requestedQuantityValue <= 0
    ) {
      setSubmitError(
        "Masukkan quantity yang valid."
      );
      return;
    }

    // =======================================================
    // VALIDASI MAXIMUM QUANTITY
    // =======================================================

    if (
      requestedQuantityValue >
      availableQuantityValue
    ) {
      setSubmitError(
        `Quantity tidak boleh melebihi ${formatNumber(
          availableQuantityValue
        )} ${
          currentResource.unit ??
          "unit"
        }.`
      );

      return;
    }

    // =======================================================
    // HITUNG ULANG HARGA
    // =======================================================

    const normalPriceValue =
      requestedQuantityValue *
      pricePerUnitValue;

    const minimumPriceValue =
      normalPriceValue *
      (1 -
        negotiationPercentValue /
          100);

    // =======================================================
    // VALIDASI HARGA TAWARAN
    // =======================================================

    if (
      !Number.isFinite(
        buyerOfferedPriceValue
      ) ||
      buyerOfferedPriceValue <= 0
    ) {
      setSubmitError(
        "Masukkan harga tawaran."
      );

      return;
    }

    // =======================================================
    // CEK MINIMUM
    // =======================================================

    if (
      buyerOfferedPriceValue <
      minimumPriceValue
    ) {
      setSubmitError(
        `Harga tawaran belum memenuhi batas minimum Rp${formatRupiah(
          minimumPriceValue
        )}.`
      );

      return;
    }

    // =======================================================
    // SUBMIT
    // =======================================================

    setSubmitting(true);

    // =======================================================
    // INSERT DATABASE
    // =======================================================

    const { error: insertError } =
      await supabase
        .from("resource_requests")
        .insert({
          resource_id:
            currentResource.id,

          requester_id:
            currentUser.id,

          requested_quantity:
            requestedQuantityValue,

          offered_price:
            buyerOfferedPriceValue,

          message:
            message.trim(),

          status: "pending",
        });

    // =======================================================
    // DATABASE ERROR
    // =======================================================

    if (insertError) {
      console.error(
        "REQUEST INSERT ERROR:",
        insertError
      );

      setSubmitError(
        insertError.message ||
          "Request gagal dikirim."
      );

      setSubmitting(false);
      return;
    }

    // =======================================================
    // BERHASIL
    // =======================================================

    router.push(
      `/resources/${currentResource.id}`
    );

    router.refresh();
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-[#07130f] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">

        {/* =====================================================
            BACK
        ===================================================== */}

        <Link
          href={`/resources/${currentResource.id}`}
          className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-emerald-300"
        >
          <span>←</span>
          <span>Back to Resource</span>
        </Link>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
            ARVENA RESOURCE REQUEST
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Request Resource
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Ajukan permintaan resource
            kepada pemilik dengan quantity
            dan harga tawaran yang sesuai.
          </p>
        </div>

        {/* =====================================================
            RESOURCE CARD
        ===================================================== */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/10">
          <div className="p-6 sm:p-7">

            {currentResource.category && (
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                {currentResource.category}
              </p>
            )}

            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {currentResource.title}
            </h2>

            {currentResource.description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                {currentResource.description}
              </p>
            )}

            {/* RESOURCE META */}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-white/35">
                  Available
                </p>

                <p className="mt-1 text-sm font-medium text-white">
                  {formatNumber(
                    availableQuantity
                  )}{" "}
                  {currentResource.unit ??
                    "unit"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-white/35">
                  Location
                </p>

                <p className="mt-1 text-sm font-medium text-white">
                  {currentResource.city ||
                    "Tidak tersedia"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs text-white/35">
                  Negotiation
                </p>

                <p className="mt-1 text-sm font-medium text-emerald-300">
                  {formatNumber(
                    negotiationPercent
                  )}
                  %
                </p>
              </div>

            </div>

            {/* SELLER PRICE */}

            <div className="mt-6 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs text-white/35">
                    Harga penjual
                  </p>

                  <p className="mt-1 text-sm text-white/45">
                    Harga dasar per{" "}
                    {currentResource.unit ??
                      "unit"}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-2xl font-semibold tracking-tight text-white">
                    Rp
                    {formatRupiah(
                      pricePerUnit
                    )}
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    /{" "}
                    {currentResource.unit ??
                      "unit"}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="mt-6 overflow-visible rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-7"
        >

          {/* FORM HEADER */}

          <div className="border-b border-white/10 pb-5">
            <p className="text-sm font-medium text-white">
              Detail Request
            </p>

            <p className="mt-1 text-xs leading-5 text-white/35">
              Tentukan quantity dan harga
              yang ingin kamu tawarkan.
            </p>
          </div>

          {/* ===================================================
              QUANTITY
          =================================================== */}

          <div className="mt-6">

            <label
              htmlFor="quantity"
              className="mb-2 block text-sm font-medium text-white/65"
            >
              Quantity
            </label>

            <div className="relative">

              <input
                id="quantity"
                type="number"
                min="0.1"
                max={availableQuantity}
                step="0.1"
                value={quantity}
                onChange={
                  handleQuantityChange
                }
                onWheel={(e) => {
                  const input =
                    e.currentTarget;

                  if (
                    document.activeElement ===
                    input
                  ) {
                    e.preventDefault();
                  }
                }}
                required
                placeholder={`Maksimal ${formatNumber(
                  availableQuantity
                )}`}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-base text-white outline-none transition placeholder:text-white/20 focus:border-emerald-300/60 focus:bg-white/[0.06]"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/35">
                {currentResource.unit ??
                  "unit"}
              </span>

            </div>

            <div className="mt-2 flex items-center justify-between gap-4">

              <p className="text-xs text-white/30">
                Maksimal permintaan:{" "}
                <span className="text-white/45">
                  {formatNumber(
                    availableQuantity
                  )}{" "}
                  {currentResource.unit ??
                    "unit"}
                </span>
              </p>

              <p className="text-xs text-white/25">
                Kelipatan 0,1
              </p>

            </div>
          </div>

          {/* ===================================================
              PRICE CALCULATION
          =================================================== */}

          {hasQuantity && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/10">

              {/* HEADER */}

              <div className="border-b border-white/10 px-5 py-4">

                <p className="text-sm font-medium text-white/70">
                  Perhitungan harga
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Harga otomatis menyesuaikan
                  quantity yang kamu pilih.
                </p>

              </div>

              <div className="space-y-4 p-5">

                {/* PRICE PER UNIT */}

                <div className="flex items-center justify-between gap-5">

                  <span className="text-sm text-white/40">
                    Harga per{" "}
                    {currentResource.unit ??
                      "unit"}
                  </span>

                  <span className="text-sm font-medium text-white">
                    Rp
                    {formatRupiah(
                      pricePerUnit
                    )}
                  </span>

                </div>

                {/* QUANTITY */}

                <div className="flex items-center justify-between gap-5">

                  <span className="text-sm text-white/40">
                    Quantity
                  </span>

                  <span className="text-sm font-medium text-white">
                    {formatNumber(
                      requestedQuantity
                    )}{" "}
                    {currentResource.unit ??
                      "unit"}
                  </span>

                </div>

                {/* NORMAL PRICE */}

                <div className="border-t border-white/10 pt-4">

                  <div className="flex items-end justify-between gap-5">

                    <div>

                      <p className="text-sm text-white/40">
                        Harga normal
                      </p>

                      <p className="mt-1 text-xs text-white/25">
                        Quantity × harga/unit
                      </p>

                    </div>

                    <p className="text-xl font-semibold tracking-tight text-white">
                      Rp
                      {formatRupiah(
                        normalPrice
                      )}
                    </p>

                  </div>

                </div>

                {/* NEGOTIATION */}

                {negotiationPercent > 0 && (
                  <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">

                    <div className="flex items-start justify-between gap-5">

                      <div>

                        <p className="text-sm text-white/45">
                          Minimum tawaran
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/25">
                          Seller mengizinkan
                          negosiasi hingga{" "}
                          <span className="text-emerald-300/70">
                            {formatNumber(
                              negotiationPercent
                            )}
                            %
                          </span>
                        </p>

                      </div>

                      <p className="whitespace-nowrap text-lg font-semibold text-emerald-300">
                        Rp
                        {formatRupiah(
                          minimumPrice
                        )}
                      </p>

                    </div>

                  </div>
                )}

                {/* NO NEGOTIATION */}

                {negotiationPercent <= 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

                    <div className="flex items-center justify-between gap-5">

                      <div>

                        <p className="text-sm text-white/45">
                          Negosiasi
                        </p>

                        <p className="mt-1 text-xs text-white/25">
                          Resource ini tidak
                          memiliki potongan
                          negosiasi.
                        </p>

                      </div>

                      <p className="text-sm font-medium text-white/60">
                        Harga penuh
                      </p>

                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

          {/* ===================================================
              OFFERED PRICE
          =================================================== */}

          <div className="mt-6">

            <label
              htmlFor="offered-price"
              className="mb-2 block text-sm font-medium text-white/65"
            >
              Harga Tawaran
            </label>

            <div
              className={`relative rounded-2xl border transition ${
                hasOfferedPrice &&
                hasQuantity &&
                buyerOfferedPrice <
                  minimumPrice
                  ? "border-amber-300/30 bg-amber-300/[0.025]"
                  : "border-white/10 bg-white/[0.045]"
              }`}
            >

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/35">
                Rp
              </span>

              <input
                id="offered-price"
                type="text"
                inputMode="decimal"
                value={formatRupiah(
                  offeredPrice
                )}
                onChange={
                  handleOfferedPriceChange
                }
                disabled={!hasQuantity}
                required
                placeholder={
                  hasQuantity
                    ? formatRupiah(
                        minimumPrice
                      )
                    : "Pilih quantity terlebih dahulu"
                }
                className="w-full rounded-2xl bg-transparent px-4 py-4 pl-11 pr-4 text-base text-white outline-none placeholder:text-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              />

            </div>

            {/* MINIMUM INFO */}

            {hasQuantity && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">

                <p className="text-xs text-white/30">
                  Minimum tawaran:{" "}
                  <span className="font-medium text-emerald-300/80">
                    Rp
                    {formatRupiah(
                      minimumPrice
                    )}
                  </span>
                </p>

                <p className="text-xs text-white/25">
                  Total untuk{" "}
                  {formatNumber(
                    requestedQuantity
                  )}{" "}
                  {currentResource.unit ??
                    "unit"}
                </p>

              </div>
            )}

            {/* PRICE STATUS */}

            {hasQuantity &&
              hasOfferedPrice &&
              buyerOfferedPrice >=
                minimumPrice && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] px-4 py-3">

                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/15 text-xs text-emerald-300">
                    ✓
                  </span>

                  <p className="text-xs text-emerald-300/80">
                    Harga tawaran siap
                    diajukan.
                  </p>

                </div>
              )}

            {hasQuantity &&
              hasOfferedPrice &&
              buyerOfferedPrice <
                minimumPrice && (
                <div className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[0.025] px-4 py-3">

                  <p className="text-xs text-amber-200/65">
                    Tingkatkan harga tawaran
                    hingga minimal Rp
                    {formatRupiah(
                      minimumPrice
                    )}
                    .
                  </p>

                </div>
              )}

          </div>

          {/* ===================================================
              MESSAGE BUBBLE
          =================================================== */}

          <div className="relative mt-3">

            <div className="absolute -top-2 left-8 z-10 h-4 w-4 rotate-45 border-l border-t border-white/10 bg-[#0c1915]" />

            <div className="relative rounded-2xl border border-white/10 bg-[#0c1915] p-4 shadow-xl shadow-black/10">

              {/* CHAT HEADER */}

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/10 bg-emerald-300/[0.06]">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-emerald-300"
                  >
                    <path
                      d="M20 11.5C20 15.6421 16.4183 19 12 19C10.8954 19 9.84734 18.791 8.92147 18.4127L5 20L6.17862 16.8568C4.82389 15.4296 4 13.5587 4 11.5C4 7.35786 7.58172 4 12 4C16.4183 4 20 7.35786 20 11.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                </div>

                <div>

                  <p className="text-sm font-medium text-white/75">
                    Message
                  </p>

                  <p className="text-xs text-white/30">
                    Sampaikan pesan kepada
                    pemilik resource.
                  </p>

                </div>

              </div>

              {/* TEXTAREA */}

              <textarea
                id="message"
                value={message}
                onChange={(e) => {
                  setMessage(
                    e.target.value
                  );

                  setSubmitError("");
                }}
                rows={4}
                maxLength={1000}
                placeholder="Contoh: Saya membutuhkan 5 liter untuk kebutuhan produksi. Apakah bisa diproses minggu ini?"
                className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-emerald-300/50 focus:bg-white/[0.05]"
              />

              <div className="mt-2 flex items-center justify-between">

                <p className="text-[11px] text-white/20">
                  Pesan bersifat opsional.
                </p>

                <p className="text-[11px] text-white/20">
                  {message.length}/1000
                </p>

              </div>

            </div>
          </div>

          {/* ===================================================
              SUBMIT ERROR
          =================================================== */}

          {submitError && (
            <div className="mt-4 rounded-2xl border border-red-300/10 bg-red-300/[0.035] px-4 py-3">

              <p className="text-xs leading-5 text-red-200/70">
                {submitError}
              </p>

            </div>
          )}

          {/* ===================================================
              REQUEST SUMMARY
          =================================================== */}

          {hasQuantity && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5">

              <div className="flex items-center justify-between">

                <p className="text-sm text-white/40">
                  Ringkasan request
                </p>

                <p className="text-xs text-white/25">
                  Pending
                </p>

              </div>

              <div className="mt-4 space-y-3">

                <div className="flex items-center justify-between gap-4">

                  <span className="text-xs text-white/30">
                    Quantity
                  </span>

                  <span className="text-sm font-medium text-white">
                    {formatNumber(
                      requestedQuantity
                    )}{" "}
                    {currentResource.unit ??
                      "unit"}
                  </span>

                </div>

                <div className="flex items-center justify-between gap-4">

                  <span className="text-xs text-white/30">
                    Harga normal
                  </span>

                  <span className="text-sm font-medium text-white">
                    Rp
                    {formatRupiah(
                      normalPrice
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between gap-4">

                  <span className="text-xs text-white/30">
                    Harga tawaran
                  </span>

                  <span
                    className={`text-sm font-semibold ${
                      offeredPriceIsValid
                        ? "text-emerald-300"
                        : "text-white/45"
                    }`}
                  >
                    {hasOfferedPrice
                      ? `Rp${formatRupiah(
                          buyerOfferedPrice
                        )}`
                      : "Belum diisi"}
                  </span>

                </div>

              </div>
            </div>
          )}

          {/* ===================================================
              SUBMIT BUTTON
          =================================================== */}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-semibold text-[#07130f] transition hover:-translate-y-0.5 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
          >

            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07130f]/20 border-t-[#07130f]" />

                <span>
                  Sending Request...
                </span>
              </>
            ) : (
              <>
                <span>
                  Send Request
                </span>

                <span aria-hidden="true">
                  →
                </span>
              </>
            )}

          </button>

          {/* FOOTER NOTE */}

          <p className="mt-4 text-center text-[11px] leading-5 text-white/20">
            Dengan mengirim request, kamu
            mengajukan penawaran kepada
            pemilik resource. Request akan
            berstatus pending sampai diproses
            oleh pemilik.
          </p>

        </form>

        {/* =====================================================
            BOTTOM BACK LINK
        ===================================================== */}

        <div className="mt-6 pb-8 text-center">

          <Link
            href={`/resources/${currentResource.id}`}
            className="text-xs text-white/25 transition hover:text-white/50"
          >
            ← Kembali ke detail resource
          </Link>

        </div>

      </div>
    </main>
  );
}