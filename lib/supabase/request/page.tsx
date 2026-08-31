"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Request = {
  id: string;
  resource_id: string;
  requester_id: string;
  requested_quantity: number;
  message: string | null;
  status: string;
  created_at: string;
  resources: {
    id: string;
    title: string;
    unit: string;
    city: string | null;
    owner_id: string;
  } | null;
};

export default function RequestsPage() {
  const supabase = createClient();

  const [requests, setRequests] = useState<Request[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("resource_requests")
      .select(`
        id,
        resource_id,
        requester_id,
        requested_quantity,
        message,
        status,
        created_at,
        resources (
          id,
          title,
          unit,
          city,
          owner_id
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("REQUEST LOAD ERROR:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setRequests((data as unknown as Request[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function updateRequest(
    requestId: string,
    status: "accepted" | "rejected"
  ) {
    setProcessing(requestId);
    setError("");

    const { error } = await supabase
      .from("resource_requests")
      .update({
        status,
      })
      .eq("id", requestId);

    if (error) {
      console.error("REQUEST UPDATE ERROR:", error);
      setError(error.message);
      setProcessing(null);
      return;
    }

    await loadRequests();
    setProcessing(null);
  }

  const incomingRequests = requests.filter(
    (request) => request.resources?.owner_id === userId
  );

  const myRequests = requests.filter(
    (request) => request.requester_id === userId
  );

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div>
          <p className="text-sm font-medium text-emerald-300">
            NEXORA REQUESTS
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            Resource Requests
          </h1>

          <p className="mt-3 text-white/40">
            Kelola permintaan resource dan lihat status request kamu.
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* INCOMING */}
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Incoming Requests
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Request dari pengguna lain untuk resource kamu.
            </p>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse rounded-3xl bg-white/[0.03]" />
          ) : incomingRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center">
              <p className="font-medium">
                Belum ada request masuk
              </p>

              <p className="mt-2 text-sm text-white/40">
                Request untuk resource milikmu akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                    <div>
                      <p className="text-sm text-emerald-300">
                        Resource Request
                      </p>

                      <h3 className="mt-2 text-xl font-semibold">
                        {request.resources?.title || "Resource"}
                      </h3>

                      <p className="mt-3 text-sm text-white/40">
                        Requested quantity:{" "}
                        <span className="text-white">
                          {request.requested_quantity}{" "}
                          {request.resources?.unit}
                        </span>
                      </p>

                      {request.message && (
                        <div className="mt-4 rounded-xl bg-white/[0.03] p-4 text-sm text-white/60">
                          "{request.message}"
                        </div>
                      )}

                      <p className="mt-4 text-xs text-white/30">
                        Requester ID: {request.requester_id}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">

                      <span
                        className={`rounded-full px-3 py-1 text-xs capitalize ${
                          request.status === "pending"
                            ? "bg-yellow-300/10 text-yellow-300"
                            : request.status === "accepted"
                            ? "bg-emerald-300/10 text-emerald-300"
                            : "bg-red-300/10 text-red-300"
                        }`}
                      >
                        {request.status}
                      </span>

                      {request.status === "pending" && (
                        <div className="flex gap-3">

                          <button
                            onClick={() =>
                              updateRequest(request.id, "rejected")
                            }
                            disabled={processing === request.id}
                            className="rounded-xl border border-red-300/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-300/10 disabled:opacity-50"
                          >
                            Reject
                          </button>

                          <button
                            onClick={() =>
                              updateRequest(request.id, "accepted")
                            }
                            disabled={processing === request.id}
                            className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#07130f] transition hover:bg-emerald-200 disabled:opacity-50"
                          >
                            {processing === request.id
                              ? "Processing..."
                              : "Accept"}
                          </button>

                        </div>
                      )}

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MY REQUESTS */}
        <section className="mt-16">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              My Requests
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Request yang pernah kamu kirim.
            </p>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse rounded-3xl bg-white/[0.03]" />
          ) : myRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center">
              <p className="font-medium">
                Belum ada request
              </p>

              <Link
                href="/resources"
                className="mt-5 inline-block rounded-xl bg-emerald-300 px-5 py-3 font-semibold text-[#07130f]"
              >
                Explore Resources
              </Link>
            </div>
          ) : (
            <div className="grid gap-5">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex items-center justify-between gap-4">

                    <div>
                      <h3 className="text-lg font-semibold">
                        {request.resources?.title || "Resource"}
                      </h3>

                      <p className="mt-2 text-sm text-white/40">
                        {request.requested_quantity}{" "}
                        {request.resources?.unit}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs capitalize ${
                        request.status === "pending"
                          ? "bg-yellow-300/10 text-yellow-300"
                          : request.status === "accepted"
                          ? "bg-emerald-300/10 text-emerald-300"
                          : "bg-red-300/10 text-red-300"
                      }`}
                    >
                      {request.status}
                    </span>

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}