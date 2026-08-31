"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function CommunityDetailPage() {
  const params = useParams();
  const communityId = typeof params.id === "string" ? params.id : "";

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/community"
          className="text-sm text-emerald-300 transition hover:text-emerald-200"
        >
          ← Back to Communities
        </Link>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3.5 py-1 text-xs font-medium uppercase tracking-[0.16em] text-emerald-300">
              Community Hub
            </span>

            <span className="text-xs text-white/30">ID: {communityId}</span>
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Community Profile
          </h1>

          <p className="mt-3 leading-7 text-white/40">
            Connect with local members, participate in circular activities, and share resources within this initiative.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">
            Community activities and member feeds will be displayed here.
          </div>
        </div>
      </div>
    </main>
  );
}
