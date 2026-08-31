"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Resource = {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  city: string | null;
  description: string | null;
  status: string;
  price: number | null;
  negotiation_percent: number | null;
  images: string[] | null;
};

export default function ResourcesPage() {
  const supabase = createClient();

  const [resources, setResources] = useState<Resource[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadResources() {
    setLoading(true);

    // =========================
    // CEK USER
    // =========================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserId(user?.id ?? null);

    // =========================
    // AMBIL RESOURCE
    // =========================

    const { data, error } = await supabase
      .from("resources")
      .select(
        "id, owner_id, title, category, quantity, unit, city, description, status, price, negotiation_percent, images"
      )
      .eq("status", "available")
      .order("created_at", { ascending: false });

   if (error) {
  console.error("RESOURCE ERROR:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  setLoading(false);
  return;
}

    setResources((data as Resource[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadResources();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            HEADER
        ========================= */}

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">
              ARVENA RESOURCE HUB
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Resources
            </h1>

            <p className="mt-3 max-w-2xl text-white/50">
              Temukan resource yang tersedia di ekosistem ARVENA
              dan gunakan kembali untuk menciptakan dampak yang lebih besar.
            </p>
          </div>

          <Link
            href="/resources/new"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-300 px-5 py-3 font-semibold text-[#07130f] transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-200 hover:shadow-lg hover:shadow-emerald-300/10"
          >
            + Add Resource
          </Link>
        </div>

        {/* =========================
            CONTENT
        ========================= */}

        <div className="mt-12">

          {/* LOADING */}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
                />
              ))}
            </div>

          ) : resources.length === 0 ? (

            /* EMPTY */

            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="text-lg font-medium">
                Belum ada resource
              </p>

              <p className="mt-2 text-sm text-white/40">
                Jadilah pengguna pertama yang menambahkan resource.
              </p>

              <Link
                href="/resources/new"
                className="mt-6 inline-flex rounded-xl bg-emerald-300 px-5 py-3 font-semibold text-[#07130f] transition hover:-translate-y-1"
              >
                Add your first resource
              </Link>
            </div>

          ) : (

            /* RESOURCE GRID */

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {resources.map((resource) => {
                const isOwner = resource.owner_id === userId;

                const imageCount = resource.images?.length || 0;

                const minimumPrice =
                  resource.price &&
                  resource.negotiation_percent
                    ? Math.round(
                        resource.price *
                          (1 -
                            resource.negotiation_percent / 100)
                      )
                    : resource.price || 0;

                return (
                  <div
                    key={resource.id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-2 hover:border-emerald-300/30 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-black/20"
                  >

                    {/* =========================
                        IMAGE
                    ========================= */}

                    {imageCount > 0 ? (
                      <Link href={`/resources/${resource.id}`}>
                        <div className="relative overflow-hidden">
                          <img
                            src={resource.images![0]}
                            alt={resource.title}
                            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          {/* PHOTO COUNT */}

                          <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
                            📷 {imageCount}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <Link href={`/resources/${resource.id}`}>
                        <div className="flex h-52 items-center justify-center border-b border-white/10 bg-white/[0.02]">
                          <div className="text-center">
                            <div className="text-4xl opacity-30">
                              📦
                            </div>

                            <p className="mt-2 text-xs text-white/30">
                              Belum ada foto
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {/* =========================
                        CARD CONTENT
                    ========================= */}

                    <div className="p-6">

                      {/* CATEGORY + STATUS */}

                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium capitalize text-emerald-300">
                          {resource.category}
                        </span>

                        <span className="text-xs text-white/30">
                          {resource.status}
                        </span>
                      </div>

                      {/* TITLE */}

                      <Link
                        href={`/resources/${resource.id}`}
                        className="mt-5 flex items-center gap-2 text-xl font-semibold transition-colors duration-300 hover:text-emerald-200"
                      >
                        <span>
                          {resource.title}
                        </span>

                        <span className="text-sm text-white/30 transition group-hover:translate-x-1 group-hover:text-emerald-300">
                          →
                        </span>
                      </Link>

                      {/* DESCRIPTION */}

                      <p className="mt-3 min-h-[48px] text-sm leading-6 text-white/40">
                        {resource.description ||
                          "Tidak ada deskripsi resource."}
                      </p>

                      {/* INFO */}

                      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">

                        <div>
                          <p className="text-xs text-white/30">
                            Quantity
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {resource.quantity} {resource.unit}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-white/30">
                            Location
                          </p>

                          <p className="mt-1 truncate text-sm font-medium">
                            {resource.city || "Unknown"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-white/30">
                            Photos
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            📷 {imageCount}
                          </p>
                        </div>

                      </div>

                      {/* =========================
                          PRICE
                      ========================= */}

                      {resource.price && resource.price > 0 && (
                        <div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] p-4">

                          <div className="flex items-end justify-between gap-3">

                            <div>
                              <p className="text-xs text-white/30">
                                Harga Jual
                              </p>

                              <p className="mt-1 text-lg font-semibold text-emerald-300">
                                Rp
                                {resource.price.toLocaleString(
                                  "id-ID"
                                )}
                              </p>
                            </div>

                            {resource.negotiation_percent &&
                              resource.negotiation_percent > 0 && (
                                <div className="text-right">
                                  <p className="text-xs text-white/30">
                                    Bisa nego
                                  </p>

                                  <p className="mt-1 text-sm font-medium text-white/60">
                                    hingga{" "}
                                    {resource.negotiation_percent}%
                                  </p>
                                </div>
                              )}

                          </div>

                          {resource.negotiation_percent &&
                            resource.negotiation_percent > 0 && (
                              <p className="mt-2 text-xs text-white/30">
                                Harga minimum:
                                {" "}
                                <span className="text-white/50">
                                  Rp
                                  {minimumPrice.toLocaleString(
                                    "id-ID"
                                  )}
                                </span>
                              </p>
                            )}

                        </div>
                      )}

                      {/* =========================
                          REQUEST / OWNER
                      ========================= */}

                      {isOwner ? (
                        <div className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.02] py-3 text-center text-sm text-white/40">
                          Your Resource
                        </div>
                      ) : (
                        <Link
                          href={`/resources/${resource.id}/request`}
                          className="mt-6 block w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-center text-sm font-medium transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-emerald-300/10 hover:text-emerald-200"
                        >
                          Request Resource
                        </Link>
                      )}

                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>
      </div>
    </main>
  );
}