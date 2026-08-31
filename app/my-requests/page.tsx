import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function formatRupiah(value: number | string) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function MyRequestsPage() {
  const supabase = await createClient();

  // ==========================================
  // CEK USER
  // ==========================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // ==========================================
  // AMBIL REQUEST MILIK USER
  // ==========================================

  const {
    data: requests,
    error,
  } = await supabase
    .from("resource_requests")
    .select(`
      id,
      requested_quantity,
      offered_price,
      message,
      status,
      created_at,
      resource_id,

      resources (
        id,
        title,
        category,
        quantity,
        unit,
        city,
        price,
        status,
        owner_id
      )
    `)
    .eq("requester_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "MY REQUESTS ERROR:",
      error
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">

        {/* ======================================
            BACK
        ====================================== */}

        <a
          href="/dashboard"
          className="text-sm text-emerald-300 transition hover:text-emerald-200"
        >
          ← Back to Dashboard
        </a>

        {/* ======================================
            HEADER
        ====================================== */}

        <p className="mt-8 text-sm font-medium text-emerald-300">
          ARVENA REQUESTS
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          My Requests
        </h1>

        <p className="mt-3 max-w-2xl text-white/40">
          Pantau semua permintaan resource yang
          sudah kamu ajukan.
        </p>

        {/* ======================================
            EMPTY STATE
        ====================================== */}

        {!requests ||
        requests.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">

            <div className="text-5xl opacity-30">
              📤
            </div>

            <p className="mt-5 text-lg font-medium">
              Belum ada request
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Kamu belum mengajukan request
              terhadap resource apa pun.
            </p>

            <a
              href="/resources"
              className="mt-6 inline-flex rounded-xl bg-emerald-300 px-5 py-3 font-semibold text-[#07130f] transition hover:bg-emerald-200"
            >
              Explore Resources
            </a>

          </div>
        ) : (

          /* ====================================
             REQUEST LIST
          ==================================== */

          <div className="mt-10 space-y-6">

            {requests.map(
              (request: any) => {

                const resource =
                  Array.isArray(
                    request.resources
                  )
                    ? request.resources[0]
                    : request.resources;

                const requestedQuantity =
                  Number(
                    request.requested_quantity
                  ) || 0;

                const offeredPrice =
                  Number(
                    request.offered_price
                  ) || 0;

                const resourcePrice =
                  Number(
                    resource?.price
                  ) || 0;

                const normalTotal =
                  requestedQuantity *
                  resourcePrice;

                // ==================================
                // STATUS STYLE
                // ==================================

                const statusStyle =
                  request.status ===
                  "accepted"
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300"
                    : request.status ===
                      "rejected"
                    ? "border-red-300/20 bg-red-300/10 text-red-300"
                    : "border-yellow-300/20 bg-yellow-300/10 text-yellow-300";

                return (
                  <div
                    key={request.id}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
                  >

                    <div className="p-6">

                      {/* ==========================
                          HEADER
                      ========================== */}

                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                        <div className="min-w-0">

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusStyle}`}
                          >
                            {request.status}
                          </span>

                          <h2 className="mt-4 text-2xl font-semibold">
                            {resource?.title ||
                              "Unknown Resource"}
                          </h2>

                          <p className="mt-2 text-sm text-white/40">
                            {resource?.category ||
                              "Unknown category"}
                            {" · "}
                            {resource?.city ||
                              "Unknown city"}
                          </p>

                        </div>

                        {/* DATE */}

                        <div className="text-left md:text-right">

                          <p className="text-xs text-white/30">
                            Requested
                          </p>

                          <p className="mt-1 text-sm text-white/50">
                            {formatDate(
                              request.created_at
                            )}
                          </p>

                        </div>

                      </div>

                      {/* ==========================
                          REQUEST DETAILS
                      ========================== */}

                      <div className="mt-6 grid gap-4 sm:grid-cols-3">

                        {/* QUANTITY */}

                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">

                          <p className="text-xs text-white/30">
                            Quantity
                          </p>

                          <p className="mt-2 font-semibold">
                            {formatRupiah(
                              requestedQuantity
                            )}{" "}
                            {resource?.unit}
                          </p>

                        </div>

                        {/* NORMAL PRICE */}

                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">

                          <p className="text-xs text-white/30">
                            Harga Normal
                          </p>

                          <p className="mt-2 font-semibold">
                            Rp
                            {formatRupiah(
                              normalTotal
                            )}
                          </p>

                        </div>

                        {/* OFFER */}

                        <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-4">

                          <p className="text-xs text-emerald-300/60">
                            Harga Tawaran
                          </p>

                          <p className="mt-2 font-semibold text-emerald-300">
                            Rp
                            {formatRupiah(
                              offeredPrice
                            )}
                          </p>

                        </div>

                      </div>

                      {/* ==========================
                          MESSAGE
                      ========================== */}

                      {request.message && (
                        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                          <p className="text-xs uppercase tracking-wider text-white/30">
                            Your Message
                          </p>

                          <p className="mt-3 text-sm leading-6 text-white/60">
                            {request.message}
                          </p>

                        </div>
                      )}

                      {/* ==========================
                          RESOURCE STATUS
                      ========================== */}

                      <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <p className="text-xs text-white/30">
                            Resource Status
                          </p>

                          <p className="mt-1 text-sm font-medium capitalize">
                            {resource?.status ||
                              "unknown"}
                          </p>

                        </div>

                        <a
                          href={`/resources/${resource?.id}`}
                          className="inline-flex justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-medium transition hover:border-emerald-300/30 hover:bg-white/[0.03]"
                        >
                          View Resource →
                        </a>

                      </div>

                      {/* ==========================
                          STATUS INFORMATION
                      ========================== */}

                      {request.status ===
                        "pending" && (
                        <div className="mt-5 rounded-2xl border border-yellow-300/10 bg-yellow-300/5 p-5">

                          <p className="font-medium text-yellow-300">
                            ⏳ Waiting for owner
                          </p>

                          <p className="mt-2 text-sm leading-6 text-white/40">
                            Request kamu sedang
                            menunggu keputusan
                            dari pemilik resource.
                          </p>

                        </div>
                      )}

                      {request.status ===
                        "accepted" && (
                        <div className="mt-5 rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-5">

                          <p className="font-medium text-emerald-300">
                            ✓ Request Accepted
                          </p>

                          <p className="mt-2 text-sm leading-6 text-white/40">
                            Pemilik resource telah
                            menerima request kamu.
                            Tahap selanjutnya dapat
                            dilanjutkan ke transaksi.
                          </p>

                        </div>
                      )}

                      {request.status ===
                        "rejected" && (
                        <div className="mt-5 rounded-2xl border border-red-300/10 bg-red-300/5 p-5">

                          <p className="font-medium text-red-300">
                            ✕ Request Rejected
                          </p>

                          <p className="mt-2 text-sm leading-6 text-white/40">
                            Pemilik resource menolak
                            request ini.
                          </p>

                        </div>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>
    </main>
  );
}