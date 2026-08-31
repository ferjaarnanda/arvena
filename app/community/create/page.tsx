"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("circular");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Community creation flow (Phase 2 foundation)
    router.push("/community");
  }

  return (
    <main className="min-h-screen bg-[#07130f] px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/community"
          className="text-sm text-emerald-300 transition hover:text-emerald-200"
        >
          ← Back to Community
        </Link>

        <p className="mt-8 text-sm font-medium tracking-[0.18em] text-emerald-300">
          ARVENA COMMUNITY
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Create a Community
        </h1>

        <p className="mt-3 text-sm text-white/40">
          Start a local circular economy initiative or sustainable neighborhood group in your city.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm text-white/60">
              Community Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tembalang Circular Lab"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-300/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1d17] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/40"
            >
              <option value="circular">Circular Resources & Recycling</option>
              <option value="organic">Organic Composting & Urban Farming</option>
              <option value="ewaste">E-Waste & Electronics Repair</option>
              <option value="textile">Textile & Clothing Upcycling</option>
              <option value="general">Neighborhood Sustainability</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">
              City / Location
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kota Semarang"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-300/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">
              Mission & Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your community's purpose and activities..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-300/40"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-300 py-3.5 text-sm font-semibold text-[#07130f] transition hover:bg-emerald-200"
          >
            Create Community
          </button>
        </form>
      </div>
    </main>
  );
}
