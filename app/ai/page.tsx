import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type ResourceRow = {
  id: string;
  title: string;
  category: string | null;
  quantity: number | string | null;
  unit: string | null;
  city: string | null;
  price: number | string | null;
  status: string | null;
  created_at: string | null;
};

type RequestRow = {
  id: string;
  requested_quantity: number | string | null;
  offered_price: number | string | null;
  status: string | null;
  resource_id: string;
  created_at: string | null;
};

type ImpactRow = {
  id: string;
  resource_id: string | null;
  material_type: string;
  quantity: number | string;
  co2_avoided_kg: number | string;
  economic_value: number | string;
  social_value: number | string;
  created_at: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    organic: "Organik",
    plastic: "Plastik",
    paper: "Kertas",
    metal: "Logam",
    electronic: "Elektronik",
    food: "Makanan",
    textile: "Tekstil",
    other: "Lainnya",
  };

  return labels[category] ?? category;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    organic: "🌿",
    plastic: "♻️",
    paper: "📄",
    metal: "🔩",
    electronic: "🔌",
    food: "🥬",
    textile: "👕",
    other: "📦",
  };

  return icons[category] ?? "📦";
}

export default async function AIPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // =========================================================
  // LOAD RESOURCES
  // =========================================================

  const {
    data: resources,
    error: resourcesError,
  } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      category,
      quantity,
      unit,
      city,
      price,
      status,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  // =========================================================
  // LOAD REQUESTS
  // =========================================================

  const {
    data: requests,
    error: requestsError,
  } = await supabase
    .from("resource_requests")
    .select(`
      id,
      requested_quantity,
      offered_price,
      status,
      resource_id,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  // =========================================================
  // LOAD IMPACT DATA
  // =========================================================

  const {
    data: impacts,
    error: impactsError,
  } = await supabase
    .from("impact_records")
    .select(`
      id,
      resource_id,
      material_type,
      quantity,
      co2_avoided_kg,
      economic_value,
      social_value,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  const resourceRows =
    (resources ?? []) as ResourceRow[];

  const requestRows =
    (requests ?? []) as RequestRow[];

  const impactRows =
    (impacts ?? []) as ImpactRow[];

  // =========================================================
  // RESOURCE ANALYSIS
  // =========================================================

  const totalResources =
    resourceRows.length;

  const availableResources =
    resourceRows.filter(
      (resource) =>
        resource.status === "available"
    );

  const totalAvailableQuantity =
    availableResources.reduce(
      (sum, resource) =>
        sum +
        Number(resource.quantity ?? 0),
      0
    );

  const totalRequests =
    requestRows.length;

  const pendingRequests =
    requestRows.filter(
      (request) =>
        request.status === "pending"
    ).length;

  const acceptedRequests =
    requestRows.filter(
      (request) =>
        request.status === "accepted"
    ).length;

  const rejectedRequests =
    requestRows.filter(
      (request) =>
        request.status === "rejected"
    ).length;

  const totalRequestedQuantity =
    requestRows.reduce(
      (sum, request) =>
        sum +
        Number(
          request.requested_quantity ?? 0
        ),
      0
    );

  // =========================================================
  // CATEGORY ANALYSIS
  // =========================================================

  const categoryMap = new Map<
    string,
    {
      category: string;
      count: number;
      quantity: number;
    }
  >();

  for (const resource of resourceRows) {
    const category =
      resource.category ?? "other";

    const current =
      categoryMap.get(category) ?? {
        category,
        count: 0,
        quantity: 0,
      };

    current.count += 1;

    current.quantity +=
      Number(resource.quantity ?? 0);

    categoryMap.set(
      category,
      current
    );
  }

  const categoryStats =
    Array.from(categoryMap.values()).sort(
      (a, b) =>
        b.quantity - a.quantity
    );

  const dominantCategory =
    categoryStats[0] ?? null;

  // =========================================================
  // CITY ANALYSIS
  // =========================================================

  const cityMap = new Map<
    string,
    {
      city: string;
      count: number;
      quantity: number;
    }
  >();

  for (const resource of resourceRows) {
    const city =
      resource.city?.trim() ||
      "Lokasi tidak diketahui";

    const current =
      cityMap.get(city) ?? {
        city,
        count: 0,
        quantity: 0,
      };

    current.count += 1;

    current.quantity +=
      Number(resource.quantity ?? 0);

    cityMap.set(city, current);
  }

  const cityStats =
    Array.from(cityMap.values()).sort(
      (a, b) =>
        b.quantity - a.quantity
    );

  const dominantCity =
    cityStats[0] ?? null;

  // =========================================================
  // IMPACT ANALYSIS
  // =========================================================

  const totalImpactQuantity =
    impactRows.reduce(
      (sum, impact) =>
        sum +
        Number(impact.quantity ?? 0),
      0
    );

  const totalCO2Avoided =
    impactRows.reduce(
      (sum, impact) =>
        sum +
        Number(
          impact.co2_avoided_kg ?? 0
        ),
      0
    );

  const totalEconomicValue =
    impactRows.reduce(
      (sum, impact) =>
        sum +
        Number(
          impact.economic_value ?? 0
        ),
      0
    );

  const totalSocialValue =
    impactRows.reduce(
      (sum, impact) =>
        sum +
        Number(
          impact.social_value ?? 0
        ),
      0
    );

  // =========================================================
  // REQUEST CONVERSION RATE
  // =========================================================

  const requestConversionRate =
    totalRequests > 0
      ? (acceptedRequests /
          totalRequests) *
        100
      : 0;

  // =========================================================
  // ENVIRONMENTAL INTELLIGENCE
  //
  // Untuk tahap awal, insight dibuat dari data nyata
  // Supabase menggunakan rule-based intelligence.
  //
  // Model AI eksternal akan dipasang setelah fondasi
  // data ini siap.
  // =========================================================

  const intelligenceMessages: string[] =
    [];

  if (dominantCategory) {
    intelligenceMessages.push(
      `${getCategoryLabel(
        dominantCategory.category
      )} merupakan kategori resource dengan volume tersedia terbesar di ARVENA saat ini.`
    );
  }

  if (pendingRequests > 0) {
    intelligenceMessages.push(
      `Terdapat ${pendingRequests} request yang masih menunggu keputusan. Memproses request tersebut dapat mempercepat perputaran resource dalam ekosistem.`
    );
  }

  if (
    requestConversionRate >= 60 &&
    totalRequests > 0
  ) {
    intelligenceMessages.push(
      `Tingkat penerimaan request mencapai ${formatNumber(
        requestConversionRate
      )}%. Aktivitas pertukaran resource menunjukkan tingkat kecocokan yang cukup baik.`
    );
  } else if (
    totalRequests > 0
  ) {
    intelligenceMessages.push(
      `Tingkat penerimaan request saat ini ${formatNumber(
        requestConversionRate
      )}%. Masih terdapat peluang untuk meningkatkan kecocokan antara resource dan kebutuhan pengguna.`
    );
  }

  if (dominantCity) {
    intelligenceMessages.push(
      `${dominantCity.city} menjadi lokasi dengan volume resource terdaftar terbesar berdasarkan data yang tersedia.`
    );
  }

  if (totalCO2Avoided > 0) {
    intelligenceMessages.push(
      `Aktivitas yang tercatat telah berkontribusi terhadap estimasi penghindaran ${formatNumber(
        totalCO2Avoided
      )} kg CO₂.`
    );
  }

  if (
    intelligenceMessages.length === 0
  ) {
    intelligenceMessages.push(
      "Belum cukup data untuk menghasilkan insight lingkungan yang kuat. Tambahkan resource dan aktivitas pertukaran untuk membangun intelligence ARVENA."
    );
  }

  const categoryCards =
    categoryStats.slice(0, 6);

  const cityCards =
    cityStats.slice(0, 5);

  // =========================================================
  // DATABASE WARNING
  // =========================================================

  const databaseWarning =
    resourcesError ||
    requestsError ||
    impactsError;

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <Link
          href="/dashboard"
          className="text-sm text-emerald-300 transition hover:text-emerald-200"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium tracking-[0.18em] text-emerald-300">
            ARVENA INTELLIGENCE
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Environmental Intelligence
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-white/40">
            ARVENA membaca aktivitas resource
            dan pertukaran material untuk
            membantu memahami kondisi
            circular economy di dalam ekosistem
            kota.
          </p>
        </div>

        {/* =====================================================
            DATABASE WARNING
        ===================================================== */}

        {databaseWarning && (
          <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5">
            <p className="font-medium text-amber-300">
              Sebagian data intelligence
              belum dapat dibaca.
            </p>

            <p className="mt-2 text-sm leading-6 text-white/40">
              ARVENA tetap menampilkan data
              yang berhasil diambil.
              Periksa error Supabase di
              terminal jika ada data yang
              kosong.
            </p>
          </div>
        )}

        {/* =====================================================
            OVERVIEW
        ===================================================== */}

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">
                Environmental Overview
              </p>

              <p className="mt-1 text-xs text-white/30">
                Ringkasan data yang sedang
                dianalisis ARVENA.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* RESOURCE */}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-white/35">
                Total Resources
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {formatNumber(
                  totalResources
                )}
              </p>

              <p className="mt-2 text-xs text-emerald-300/70">
                {formatNumber(
                  availableResources.length
                )}{" "}
                tersedia
              </p>
            </div>

            {/* REQUEST */}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-white/35">
                Resource Requests
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {formatNumber(
                  totalRequests
                )}
              </p>

              <p className="mt-2 text-xs text-yellow-300/70">
                {formatNumber(
                  pendingRequests
                )}{" "}
                menunggu
              </p>
            </div>

            {/* MATERIAL */}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-white/35">
                Material Available
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {formatNumber(
                  totalAvailableQuantity
                )}
              </p>

              <p className="mt-2 text-xs text-white/30">
                Total quantity resource
              </p>
            </div>

            {/* CO2 */}

            <div className="rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.04] p-6">
              <p className="text-sm text-white/35">
                CO₂ Avoided
              </p>

              <p className="mt-3 text-3xl font-semibold text-emerald-300">
                {formatNumber(
                  totalCO2Avoided
                )}
              </p>

              <p className="mt-2 text-xs text-white/30">
                kg CO₂
              </p>
            </div>

          </div>
        </section>

        {/* =====================================================
            AI INSIGHT
        ===================================================== */}

        <section className="mt-10">

          <div className="rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.08] to-white/[0.02] p-6 sm:p-8">

            <div className="flex flex-col gap-6 md:flex-row md:items-start">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-2xl">
                🧠
              </div>

              <div className="flex-1">

                <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                  ARVENA Intelligence
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Environmental Insights
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  Insight berikut dibuat dari
                  aktivitas resource dan
                  pertukaran yang tersimpan
                  di ARVENA.
                </p>

                <div className="mt-6 space-y-3">

                  {intelligenceMessages.map(
                    (message, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-white/10 bg-black/10 p-4"
                      >
                        <div className="flex gap-3">
                          <span className="mt-0.5 text-emerald-300">
                            {index + 1}.
                          </span>

                          <p className="text-sm leading-6 text-white/60">
                            {message}
                          </p>
                        </div>
                      </div>
                    )
                  )}

                </div>

              </div>
            </div>

          </div>

        </section>

        {/* =====================================================
            CATEGORY INTELLIGENCE
        ===================================================== */}

        <section className="mt-10">

          <div>
            <p className="text-sm font-medium text-white/70">
              Material Intelligence
            </p>

            <p className="mt-1 text-xs text-white/30">
              Material yang paling banyak
              tersedia dalam ekosistem.
            </p>
          </div>

          {categoryCards.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {categoryCards.map(
                (item) => (
                  <div
                    key={item.category}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xl">
                        {getCategoryIcon(
                          item.category
                        )}
                      </div>

                      <span className="text-xs text-white/30">
                        #{item.category}
                      </span>

                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      {getCategoryLabel(
                        item.category
                      )}
                    </h3>

                    <div className="mt-4 flex items-end justify-between">

                      <div>
                        <p className="text-2xl font-semibold text-emerald-300">
                          {formatNumber(
                            item.quantity
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          total quantity
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-medium">
                          {formatNumber(
                            item.count
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          resources
                        </p>
                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-white/10 p-10 text-center">
              <p className="text-white/40">
                Belum ada data material.
              </p>
            </div>
          )}

        </section>

        {/* =====================================================
            CITY INTELLIGENCE
        ===================================================== */}

        <section className="mt-10">

          <div>
            <p className="text-sm font-medium text-white/70">
              City Intelligence
            </p>

            <p className="mt-1 text-xs text-white/30">
              Distribusi resource berdasarkan
              lokasi.
            </p>
          </div>

          {cityCards.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">

              <div className="divide-y divide-white/10">

                {cityCards.map(
                  (city, index) => (
                    <div
                      key={city.city}
                      className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="flex items-center gap-4">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm text-emerald-300">
                          {index + 1}
                        </div>

                        <div>
                          <p className="font-medium">
                            {city.city}
                          </p>

                          <p className="mt-1 text-xs text-white/30">
                            {formatNumber(
                              city.count
                            )}{" "}
                            resource
                          </p>
                        </div>

                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-semibold">
                          {formatNumber(
                            city.quantity
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          total material
                        </p>
                      </div>

                    </div>
                  )
                )}

              </div>

            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-white/10 p-10 text-center">
              <p className="text-white/40">
                Belum ada data lokasi.
              </p>
            </div>
          )}

        </section>

        {/* =====================================================
            CIRCULAR ECONOMY ACTIVITY
        ===================================================== */}

        <section className="mt-10">

          <div>
            <p className="text-sm font-medium text-white/70">
              Circular Economy Activity
            </p>

            <p className="mt-1 text-xs text-white/30">
              Aktivitas pertukaran resource
              yang berhasil tercatat.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-sm text-white/35">
                Accepted Requests
              </p>

              <p className="mt-3 text-3xl font-semibold text-emerald-300">
                {formatNumber(
                  acceptedRequests
                )}
              </p>

              <p className="mt-2 text-xs text-white/30">
                berhasil diterima
              </p>

            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-sm text-white/35">
                Rejected Requests
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {formatNumber(
                  rejectedRequests
                )}
              </p>

              <p className="mt-2 text-xs text-white/30">
                ditolak
              </p>

            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-sm text-white/35">
                Material Requested
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {formatNumber(
                  totalRequestedQuantity
                )}
              </p>

              <p className="mt-2 text-xs text-white/30">
                total quantity diminta
              </p>

            </div>

            <div className="rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.04] p-6">

              <p className="text-sm text-white/35">
                Conversion Rate
              </p>

              <p className="mt-3 text-3xl font-semibold text-emerald-300">
                {formatNumber(
                  requestConversionRate
                )}
                %
              </p>

              <p className="mt-2 text-xs text-white/30">
                request menjadi accepted
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            IMPACT
        ===================================================== */}

        <section className="mt-10 pb-10">

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                  Environmental Impact
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Circular City Impact
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                  Data impact yang nantinya
                  akan menjadi salah satu sumber
                  utama untuk AI ARVENA.
                </p>
              </div>

              <Link
                href="/impact"
                className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-emerald-300/20 hover:bg-white/[0.05] hover:text-white"
              >
                View Impact
              </Link>

            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-xs text-white/30">
                  Material Recovered
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {formatNumber(
                    totalImpactQuantity
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-xs text-white/30">
                  CO₂ Avoided
                </p>

                <p className="mt-2 text-xl font-semibold text-emerald-300">
                  {formatNumber(
                    totalCO2Avoided
                  )}{" "}
                  kg
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-xs text-white/30">
                  Economic Value
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {formatRupiah(
                    totalEconomicValue
                  )}
                </p>
              </div>

            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs text-white/30">
                    Social Value
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    {formatRupiah(
                      totalSocialValue
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-white/30">
                    Intelligence Status
                  </p>

                  <p className="mt-2 text-sm font-medium text-emerald-300">
                    Data Connected
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}