import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type RequesterProfile = {
  full_name: string | null;
  username: string | null;
  city: string | null;
};

type ResourceDetails = {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  city: string | null;
  price: number | null;
  negotiation_percent: number | null;
  status: string;
};

type IncomingRequest = {
  id: string;
  requested_quantity: number;
  offered_price: number | null;
  message: string | null;
  status: string;
  created_at: string;
  resource_id: string;
  requester_id: string;
  resources: ResourceDetails | ResourceDetails[] | null;
  profiles: RequesterProfile | RequesterProfile[] | null;
};

function formatRupiah(value: number | string) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(number);
}

export default async function ResourceRequestsPage() {
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
  // UPDATE REQUEST
  // ==========================================

  async function updateRequest(formData: FormData) {
    "use server";

    const requestId = formData.get("requestId") as string;
    const newStatus = formData.get("status") as string;

    if (
      !requestId ||
      !["accepted", "rejected"].includes(newStatus)
    ) {
      return;
    }

    const supabase = await createClient();

    // ==========================================
    // CEK USER
    // ==========================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    // ==========================================
    // AMBIL REQUEST + RESOURCE
    // SEKALIGUS CEK PEMILIK
    // ==========================================

    const { data: request, error: requestError } =
      await supabase
        .from("resource_requests")
        .select(`
          id,
          status,
          resource_id,
          resources (
            id,
            owner_id,
            quantity,
            unit,
            status
          )
        `)
        .eq("id", requestId)
        .single();

    if (requestError || !request) {
      console.error(
        "REQUEST VALIDATION ERROR:",
        requestError
      );

      return;
    }

    const resource = Array.isArray(request.resources)
      ? request.resources[0]
      : request.resources;

    if (!resource) {
      console.error("RESOURCE NOT FOUND");
      return;
    }

    // ==========================================
    // CEK PEMILIK RESOURCE
    // ==========================================

    if (resource.owner_id !== user.id) {
      console.error(
        "UNAUTHORIZED REQUEST ACTION"
      );

      return;
    }

    // ==========================================
    // HANYA REQUEST PENDING YANG BISA DIPROSES
    // ==========================================

    if (request.status !== "pending") {
      return;
    }

    // ==========================================
    // REJECT
    // ==========================================

    if (newStatus === "rejected") {
      const { error } = await supabase
        .from("resource_requests")
        .update({
          status: "rejected",
        })
        .eq("id", requestId)
        .eq("status", "pending");

      if (error) {
        console.error(
          "REJECT REQUEST ERROR:",
          error
        );

        return;
      }

      revalidatePath("/resource-requests");
      revalidatePath("/resources");
      revalidatePath("/dashboard");

      return;
    }

    // ==========================================
    // ACCEPT
    // ==========================================

    const { data, error } = await supabase.rpc(
      "accept_resource_request",
      {
        p_request_id: requestId,
      }
    );

    if (error) {
      console.error(
        "ACCEPT RPC ERROR:",
        error
      );

      return;
    }

    console.log(
      "ACCEPT RESULT:",
      data
    );

    // ==========================================
    // REFRESH DATA
    // ==========================================

    revalidatePath("/resource-requests");
    revalidatePath("/resources");
    revalidatePath("/dashboard");
  }

  // ==========================================
  // LOAD REQUESTS
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
      requester_id,

      resources (
        id,
        owner_id,
        title,
        category,
        quantity,
        unit,
        city,
        price,
        negotiation_percent,
        status
      ),

      profiles:requester_id (
        full_name,
        username,
        city
      )
    `)
    .eq("resources.owner_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "REQUEST LIST ERROR:",
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

        <Link
          href="/dashboard"
          className="text-sm text-emerald-300 transition hover:text-emerald-200"
        >
          ← Back to Dashboard
        </Link>

        {/* ======================================
            HEADER
        ====================================== */}

        <p className="mt-8 text-sm font-medium text-emerald-300">
          ARVENA REQUESTS
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Resource Requests
        </h1>

        <p className="mt-3 max-w-2xl text-white/40">
          Kelola permintaan pengguna terhadap
          resource yang kamu miliki.
        </p>

        {/* ======================================
            REQUEST LIST
        ====================================== */}

        {!requests || requests.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">

            <div className="text-5xl opacity-30">
              📭
            </div>

            <p className="mt-5 text-lg font-medium">
              Belum ada request
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Saat pengguna mengajukan permintaan
              terhadap resource milikmu, request
              tersebut akan muncul di halaman ini.
            </p>

          </div>
        ) : (
          <div className="mt-10 space-y-6">

            {(requests as IncomingRequest[]).map((request: IncomingRequest) => {
              const resource = Array.isArray(
                request.resources
              )
                ? request.resources[0]
                : request.resources;

              const profile = Array.isArray(
                request.profiles
              )
                ? request.profiles[0]
                : request.profiles;

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

              // ====================================
              // STATUS STYLE
              // ====================================

              const statusStyle =
                request.status === "accepted"
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300"
                  : request.status === "rejected"
                  ? "border-red-300/20 bg-red-300/10 text-red-300"
                  : "border-yellow-300/20 bg-yellow-300/10 text-yellow-300";

              return (
                <div
                  key={request.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
                >

                  {/* ==================================
                      CARD HEADER
                  ================================== */}

                  <div className="p-6">

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

                      {/* REQUEST QUANTITY */}

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 md:min-w-[180px] md:text-right">

                        <p className="text-xs text-white/30">
                          Requested Quantity
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {formatRupiah(
                            requestedQuantity
                          )}{" "}
                          {resource?.unit}
                        </p>

                      </div>

                    </div>

                    {/* ==================================
                        REQUESTER
                    ================================== */}

                    <div className="mt-6 border-t border-white/10 pt-6">

                      <p className="text-xs uppercase tracking-wider text-white/30">
                        Requested by
                      </p>

                      <p className="mt-2 font-medium">
                        {profile?.full_name ||
                          profile?.username ||
                          "ARVENA User"}
                      </p>

                      {profile?.username && (
                        <p className="mt-1 text-sm text-white/40">
                          @{profile.username}
                        </p>
                      )}

                      {profile?.city && (
                        <p className="mt-1 text-sm text-white/40">
                          📍 {profile.city}
                        </p>
                      )}

                    </div>

                    {/* ==================================
                        PRICE INFORMATION
                    ================================== */}

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">

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

                        <p className="mt-1 text-xs text-white/30">
                          {formatRupiah(
                            resourcePrice
                          )}{" "}
                          /{" "}
                          {resource?.unit}
                        </p>

                      </div>

                      {/* OFFERED PRICE */}

                      <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-4">

                        <p className="text-xs text-emerald-300/60">
                          Harga Tawaran
                        </p>

                        <p className="mt-2 text-xl font-semibold text-emerald-300">
                          Rp
                          {formatRupiah(
                            offeredPrice
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          Total untuk request ini
                        </p>

                      </div>

                      {/* AVAILABLE */}

                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">

                        <p className="text-xs text-white/30">
                          Resource Tersedia
                        </p>

                        <p className="mt-2 font-semibold">
                          {formatRupiah(
                            resource?.quantity ?? 0
                          )}{" "}
                          {resource?.unit}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          Status:{" "}
                          {resource?.status}
                        </p>

                      </div>

                    </div>

                    {/* ==================================
                        MESSAGE
                    ================================== */}

                    {request.message && (
                      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">

                        <p className="text-xs uppercase tracking-wider text-white/30">
                          Message
                        </p>

                        <p className="mt-3 text-sm leading-6 text-white/60">
                          {request.message}
                        </p>

                      </div>
                    )}

                    {/* ==================================
                        ACTION
                    ================================== */}

                    {request.status === "pending" && (
                      <div className="mt-6 border-t border-white/10 pt-6">

                        <div className="mb-4 rounded-2xl border border-yellow-300/10 bg-yellow-300/5 p-4">

                          <p className="text-sm font-medium text-yellow-300">
                            Request menunggu keputusanmu
                          </p>

                          <p className="mt-1 text-xs leading-5 text-white/40">
                            Periksa quantity dan harga
                            tawaran sebelum menerima
                            request.
                          </p>

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">

                          {/* ACCEPT */}

                          <form
                            action={updateRequest}
                            className="flex-1"
                          >
                            <input
                              type="hidden"
                              name="requestId"
                              value={request.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="accepted"
                            />

                            <button
                              type="submit"
                              className="w-full rounded-xl bg-emerald-300 px-5 py-3 font-semibold text-[#07130f] transition hover:-translate-y-0.5 hover:bg-emerald-200"
                            >
                              ✓ Accept Request
                            </button>
                          </form>

                          {/* REJECT */}

                          <form
                            action={updateRequest}
                            className="flex-1"
                          >
                            <input
                              type="hidden"
                              name="requestId"
                              value={request.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="rejected"
                            />

                            <button
                              type="submit"
                              className="w-full rounded-xl border border-red-300/20 bg-red-300/10 px-5 py-3 font-medium text-red-300 transition hover:-translate-y-0.5 hover:bg-red-300/15"
                            >
                              ✕ Reject Request
                            </button>
                          </form>

                        </div>

                      </div>
                    )}

                    {/* ==================================
                        ACCEPTED INFO
                    ================================== */}

                    {request.status === "accepted" && (
                      <div className="mt-6 rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-5">

                        <p className="font-medium text-emerald-300">
                          ✓ Request Accepted
                        </p>

                        <p className="mt-2 text-sm leading-6 text-white/40">
                          Request ini telah diterima.
                          Tahap berikutnya dapat
                          dilanjutkan ke proses transaksi
                          atau pertukaran resource.
                        </p>

                      </div>
                    )}

                    {/* ==================================
                        REJECTED INFO
                    ================================== */}

                    {request.status === "rejected" && (
                      <div className="mt-6 rounded-2xl border border-red-300/10 bg-red-300/5 p-5">

                        <p className="font-medium text-red-300">
                          Request Rejected
                        </p>

                        <p className="mt-2 text-sm leading-6 text-white/40">
                          Request ini telah ditolak
                          oleh pemilik resource.
                        </p>

                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}
