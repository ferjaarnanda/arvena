import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-300">
              NEXORA EXPLORE
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Resource Marketplace
            </h1>
          </div>

          <Link
            href="/resources/new"
            className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black"
          >
            + Add Resource
          </Link>
        </div>

        {resources?.length === 0 && (
          <div className="mt-10 rounded-3xl border border-white/10 p-10 text-center text-white/40">
            Belum ada resource.
          </div>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {resources?.map((resource) => (
            <div
              key={resource.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="text-sm text-emerald-300">
                {resource.category}
              </div>

              <h2 className="mt-2 text-2xl font-semibold">
                {resource.title}
              </h2>

              <p className="mt-3 text-white/50">
                {resource.description}
              </p>

              <div className="mt-5 flex justify-between text-sm">
                <span>
                  {resource.quantity} {resource.unit}
                </span>

                <span>{resource.city}</span>
              </div>

              <button className="mt-6 w-full rounded-xl border border-white/10 py-3">
                Request Resource
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}