"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  LayoutDashboard,
  Package,
  Repeat,
  Users,
  Activity,
  Radio,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  User,
  Clock,
  Sparkles,
  Inbox,
  Send,
  MapPin,
} from "lucide-react";

type Profile = {
  full_name: string | null;
  username: string | null;
  city: string | null;
  role: string | null;
};

type DashboardData = {
  userId: string;
  userEmail: string;
  profile: Profile | null;
  myResourceCount: number;
  totalMarketplaceResources: number;
  incomingRequestsCount: number;
  outgoingRequestsCount: number;
  communityCount: number;
  totalImpactCO2: number;
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, city, role")
        .eq("id", user.id)
        .single();

      // My resources count
      const { count: myResCount } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

      // Total marketplace resources
      const { count: totalResCount } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("status", "available");

      // Incoming requests on my resources
      const { data: myResources } = await supabase
        .from("resources")
        .select("id")
        .eq("owner_id", user.id);

      const myResourceIds = (myResources || []).map((r) => r.id);
      let incomingCount = 0;
      if (myResourceIds.length > 0) {
        const { count } = await supabase
          .from("resource_requests")
          .select("*", { count: "exact", head: true })
          .in("resource_id", myResourceIds)
          .eq("status", "pending");
        incomingCount = count || 0;
      }

      // Outgoing requests by me
      const { count: outgoingCount } = await supabase
        .from("resource_requests")
        .select("*", { count: "exact", head: true })
        .eq("requester_id", user.id);

      // Communities count
      const { count: commCount } = await supabase
        .from("communities")
        .select("*", { count: "exact", head: true });

      // Impact records
      const { data: impacts } = await supabase.from("impact_records").select("co2_avoided_kg");
      const totalCO2 = impacts?.reduce((sum, item) => sum + Number(item.co2_avoided_kg || 0), 0) || 0;

      setData({
        userId: user.id,
        userEmail: user.email ?? "",
        profile: profile ?? null,
        myResourceCount: myResCount ?? 0,
        totalMarketplaceResources: totalResCount ?? 0,
        incomingRequestsCount: incomingCount,
        outgoingRequestsCount: outgoingCount ?? 0,
        communityCount: commCount ?? 0,
        totalImpactCO2: totalCO2,
      });

      setLoading(false);
    }

    loadDashboard();
  }, [supabase, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#092328] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
      </main>
    );
  }

  const displayName = data?.profile?.full_name || data?.profile?.username || data?.userEmail.split("@")[0] || "User";

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>ARVENA ECOSYSTEM DASHBOARD</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white">
              Welcome, {displayName}
            </h1>

            <p className="mt-2 text-xs text-white/40 flex items-center gap-2">
              <span>{data?.userEmail}</span>
              {data?.profile?.city && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-emerald-400" /> {data.profile.city}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/resources/new"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-6 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#349e73]"
            >
              <Plus className="h-4 w-4" />
              <span>List New Resource</span>
            </Link>
          </div>
        </div>

        {/* =====================================================
            STATS OVERVIEW CARDS
        ===================================================== */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">My Active Resources</span>
              <Package className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="mt-4 block text-3xl font-extrabold text-white">{data?.myResourceCount}</span>
            <Link href="/resources" className="mt-2 text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1">
              <span>Manage your inventory</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Incoming Requests</span>
              <Inbox className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="mt-4 block text-3xl font-extrabold text-emerald-300">{data?.incomingRequestsCount}</span>
            <Link href="/resource-requests" className="mt-2 text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1">
              <span>Review pending offers</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Outgoing Bids</span>
              <Send className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="mt-4 block text-3xl font-extrabold text-white">{data?.outgoingRequestsCount}</span>
            <Link href="/my-requests" className="mt-2 text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1">
              <span>Track your requests</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total City Hubs</span>
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="mt-4 block text-3xl font-extrabold text-white">{data?.communityCount}</span>
            <Link href="/community" className="mt-2 text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1">
              <span>Explore communities</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* =====================================================
            QUICK ACTIONS GRID
        ===================================================== */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-white mb-6">Quick Ecosystem Navigation</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/explore"
              className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-400/30 hover:bg-white/[0.04] transition duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition">
                Browse Marketplace
              </h3>
              <p className="mt-1 text-xs text-white/40 leading-5">
                Search secondary materials, filter by district, and negotiate circular supplies.
              </p>
            </Link>

            <Link
              href="/exchange"
              className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-400/30 hover:bg-white/[0.04] transition duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <Repeat className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition">
                Circular Exchange & Barter
              </h3>
              <p className="mt-1 text-xs text-white/40 leading-5">
                Propose direct material-to-material swaps and automated smart matches.
              </p>
            </Link>

            <Link
              href="/community"
              className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-400/30 hover:bg-white/[0.04] transition duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition">
                Community Hubs & Workshops
              </h3>
              <p className="mt-1 text-xs text-white/40 leading-5">
                Participate in local drop-offs, circular masterclasses, and neighborhood composting.
              </p>
            </Link>

            <Link
              href="/impact"
              className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-400/30 hover:bg-white/[0.04] transition duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition">
                GIS Routing & Emission Calculator
              </h3>
              <p className="mt-1 text-xs text-white/40 leading-5">
                Interactive route planning and vehicle-specific CO₂ calculation engine.
              </p>
            </Link>

            <Link
              href="/iot"
              className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-400/30 hover:bg-white/[0.04] transition duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition">
                IoT Sensor Telemetry
              </h3>
              <p className="mt-1 text-xs text-white/40 leading-5">
                Live monitoring of automated weighing nodes, smart bins, and collection centers.
              </p>
            </Link>

            <Link
              href="/traceability"
              className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-400/30 hover:bg-white/[0.04] transition duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition">
                Traceability & Hash Verification
              </h3>
              <p className="mt-1 text-xs text-white/40 leading-5">
                Inspect deterministic SHA-256 integrity records for circular transactions.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}