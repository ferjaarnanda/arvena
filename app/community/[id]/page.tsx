"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  Users,
  Calendar,
  Package,
  Activity,
  MapPin,
  Shield,
  ShieldCheck,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  UserPlus,
  UserCheck,
  Clock,
  ArrowUpRight,
  Trash2,
  UserX,
  Share2,
} from "lucide-react";

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  province: string | null;
  city: string | null;
  district: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  creator_id: string;
  join_policy: "open" | "approval_required";
  status?: string | null;
  initial_members_required?: number | null;
  initial_members_accepted?: number | null;
  created_at: string;
};

type Member = {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "member";
  joined_at: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
};

type CommunityResource = {
  id: string;
  resource_id: string;
  contributor_id: string;
  created_at: string;
  resources: {
    id: string;
    title: string;
    category: string;
    custom_category?: string | null;
    quantity: number;
    unit: string;
    price: number | null;
    city: string | null;
    images: string[] | null;
  };
  profiles?: {
    full_name: string | null;
    username: string | null;
  } | null;
};

type CommunityEvent = {
  id: string;
  title: string;
  short_description: string;
  event_date: string;
  location_name: string;
  cover_image_url: string | null;
  status: string;
};

type CommunityInvitation = {
  id: string;
  invitee_identifier: string;
  invitee_id: string | null;
  role: string;
  status: string;
  created_at: string;
};

type JoinRequest = {
  id: string;
  user_id: string;
  message: string | null;
  created_at: string;
  profiles:
    | {
        full_name: string | null;
        username: string | null;
      }
    | {
        full_name: string | null;
        username: string | null;
      }[]
    | null;
};

type AvailableResource = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  city?: string | null;
};

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const identifier = typeof params.id === "string" ? params.id : "";

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "moderator" | "member" | null>(null);
  const [pendingJoinRequest, setPendingJoinRequest] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
  const [myPendingInvitation, setMyPendingInvitation] = useState<CommunityInvitation | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "events" | "members" | "impact">("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Contribute Resource modal state
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [myAvailableResources, setMyAvailableResources] = useState<AvailableResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");

  // Join Request modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  async function loadCommunityData() {

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user ? { id: user.id } : null);

    // 1. Fetch community by slug or UUID
    let query = supabase.from("communities").select("*");
    if (identifier.includes("-") && identifier.length > 20) {
      query = query.or(`id.eq.${identifier},slug.eq.${identifier}`);
    } else {
      query = query.eq("slug", identifier);
    }

    const { data: commData, error: commError } = await query.single();

    if (commError || !commData) {
      console.error("COMMUNITY DETAIL ERROR:", commError);
      setLoading(false);
      return;
    }

    setCommunity(commData as Community);

    // 2. Fetch Members with Profiles
    const { data: memberData } = await supabase
      .from("community_members")
      .select("id, user_id, role, joined_at, profiles(full_name, username, avatar_url, city)")
      .eq("community_id", commData.id);

    const loadedMembers = (memberData as unknown as Member[]) || [];
    setMembers(loadedMembers);

    const myMembership = loadedMembers.find((m) => m.user_id === user?.id);
    const myRole = myMembership?.role || null;
    setUserRole(myRole);

    // Check pending join request
    if (user && !myMembership) {
      const { data: req } = await supabase
        .from("community_join_requests")
        .select("id")
        .eq("community_id", commData.id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      setPendingJoinRequest(!!req);
    }

    // If Admin or Mod, load pending join requests
    if (myRole === "admin" || myRole === "moderator") {
      const { data: reqs } = await supabase
        .from("community_join_requests")
        .select("id, user_id, message, created_at, profiles:user_id(full_name, username)")
        .eq("community_id", commData.id)
        .eq("status", "pending");
      setJoinRequests(reqs || []);
    }

    // Load invitations for anti-spam tracking
    const { data: invData } = await supabase
      .from("community_invitations")
      .select("id, invitee_identifier, invitee_id, role, status, created_at")
      .eq("community_id", commData.id);

    setInvitations(invData || []);

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
      const myInv = (invData || []).find((inv) =>
        inv.status === "pending" && (
          inv.invitee_id === user.id ||
          (user.email && inv.invitee_identifier.toLowerCase() === user.email.toLowerCase()) ||
          (profile?.username && inv.invitee_identifier.toLowerCase() === profile.username.toLowerCase())
        )
      );
      setMyPendingInvitation(myInv || null);
    }

    // 3. Fetch Community Resources
    const { data: resData } = await supabase
      .from("community_resources")
      .select("id, resource_id, contributor_id, created_at, resources(id, title, category, custom_category, quantity, unit, price, city, images), profiles:contributor_id(full_name, username)")
      .eq("community_id", commData.id);

    setResources((resData as unknown as CommunityResource[]) || []);

    // 4. Fetch Events
    const { data: eventData } = await supabase
      .from("community_events")
      .select("id, title, short_description, event_date, location_name, cover_image_url, status")
      .eq("community_id", commData.id)
      .order("event_date", { ascending: true });

    setEvents((eventData as CommunityEvent[]) || []);

    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    if (identifier) {
      const timer = setTimeout(() => {
        if (!ignore) void loadCommunityData();
      }, 0);
      return () => {
        ignore = true;
        clearTimeout(timer);
      };
    }
  }, [identifier, supabase]);

  // Handle Instant Join
  async function handleJoinOpen() {
    if (!currentUser || !community) {
      router.push("/auth/login");
      return;
    }

    setActionLoading(true);
    const { error } = await supabase.from("community_members").insert({
      community_id: community.id,
      user_id: currentUser.id,
      role: "member",
    });

    if (error) {
      console.error("JOIN ERROR:", error);
      alert(error.message);
    } else {
      await loadCommunityData();
    }
    setActionLoading(false);
  }

  // Handle Join Request Submit (Approval Required)
  async function handleJoinRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !community) return;

    setActionLoading(true);
    const { error } = await supabase.from("community_join_requests").insert({
      community_id: community.id,
      user_id: currentUser.id,
      message: joinMessage.trim() || "I would like to participate in this circular community.",
    });

    if (error) {
      alert(error.message);
    } else {
      setPendingJoinRequest(true);
      setShowJoinModal(false);
    }
    setActionLoading(false);
  }

  // Handle Leave Community
  async function handleLeaveCommunity() {
    if (!currentUser || !community) return;
    if (userRole === "admin") {
      alert("As the sole Admin, you cannot leave the community. You can delete the community or transfer ownership.");
      return;
    }

    if (!confirm("Are you sure you want to leave this community?")) return;

    setActionLoading(true);
    await supabase
      .from("community_members")
      .delete()
      .eq("community_id", community.id)
      .eq("user_id", currentUser.id);

    await loadCommunityData();
    setActionLoading(false);
  }

  // Load User's available resources to contribute
  async function handleOpenContributeModal() {
    if (!currentUser || !community) return;
    setShowContributeModal(true);

    const { data } = await supabase
      .from("resources")
      .select("id, title, category, quantity, unit")
      .eq("owner_id", currentUser.id)
      .eq("status", "available");

    setMyAvailableResources(data || []);
  }

  // Submit resource contribution
  async function handleContributeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !community || !selectedResourceId) return;

    setActionLoading(true);
    const { error } = await supabase.from("community_resources").insert({
      community_id: community.id,
      resource_id: selectedResourceId,
      contributor_id: currentUser.id,
    });

    if (error) {
      alert(error.message);
    } else {
      setShowContributeModal(false);
      setSelectedResourceId("");
      await loadCommunityData();
    }
    setActionLoading(false);
  }

  // Admin: promote member to moderator
  async function handlePromoteModerator(memberId: string, currentModCount: number) {
    if (currentModCount >= 4) {
      alert("Maximum 4 moderators allowed per community.");
      return;
    }

    await supabase.from("community_members").update({ role: "moderator" }).eq("id", memberId);
    await loadCommunityData();
  }

  // Admin: demote moderator to member
  async function handleDemoteModerator(memberId: string) {
    await supabase.from("community_members").update({ role: "member" }).eq("id", memberId);
    await loadCommunityData();
  }

  // Admin/Mod: approve join request
  async function handleApproveJoinRequest(requestId: string, applicantUserId: string) {
    setActionLoading(true);
    // 1. Add to community_members
    await supabase.from("community_members").insert({
      community_id: community?.id,
      user_id: applicantUserId,
      role: "member",
    });
    // 2. Update request status
    await supabase.from("community_join_requests").update({ status: "approved" }).eq("id", requestId);
    await loadCommunityData();
    setActionLoading(false);
  }

  // Admin/Mod: reject join request
  async function handleRejectJoinRequest(requestId: string) {
    setActionLoading(true);
    await supabase.from("community_join_requests").update({ status: "rejected" }).eq("id", requestId);
    await loadCommunityData();
    setActionLoading(false);
  }

  // Invitee: accept invitation to join as founding member
  async function handleAcceptInvitation(invId: string) {
    if (!currentUser || !community) return;
    setActionLoading(true);

    // 1. Insert into community_members as member
    const { error: memErr } = await supabase.from("community_members").insert({
      community_id: community.id,
      user_id: currentUser.id,
      role: "member",
    });

    if (memErr) {
      alert(`Error joining community: ${memErr.message}`);
      setActionLoading(false);
      return;
    }

    // 2. Mark invitation as accepted
    await supabase.from("community_invitations").update({
      status: "accepted",
      invitee_id: currentUser.id,
    }).eq("id", invId);

    // 3. Increment initial_members_accepted and activate if >= 2
    const currentAccepted = community.initial_members_accepted || 0;
    const newAccepted = currentAccepted + 1;
    const required = community.initial_members_required || 2;
    const shouldActivate = newAccepted >= required;

    await supabase.from("communities").update({
      initial_members_accepted: newAccepted,
      status: shouldActivate ? "active" : (community.status || "pending_activation"),
    }).eq("id", community.id);

    await loadCommunityData();
    setActionLoading(false);
  }

  // Invitee: decline invitation
  async function handleDeclineInvitation(invId: string) {
    if (!currentUser) return;
    setActionLoading(true);
    await supabase.from("community_invitations").update({
      status: "rejected",
    }).eq("id", invId);
    await loadCommunityData();
    setActionLoading(false);
  }

  // Admin: delete entire community (Admin ONLY)
  async function handleDeleteCommunity() {
    if (!community || userRole !== "admin") return;
    setActionLoading(true);
    const { error } = await supabase.from("communities").delete().eq("id", community.id);
    if (error) {
      alert(`Error deleting community: ${error.message}`);
      setActionLoading(false);
    } else {
      router.push("/community");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#092328] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
      </main>
    );
  }

  if (!community) {
    return (
      <main className="min-h-screen bg-[#092328] px-6 py-12 text-white">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm text-emerald-400">ARVENA COMMUNITY</p>
          <h1 className="mt-3 text-3xl font-bold">Community Not Found</h1>
          <p className="mt-2 text-sm text-white/40">The community you are looking for does not exist or has been removed.</p>
          <Link
            href="/community"
            className="mt-6 inline-flex rounded-xl bg-[#2A835F] border border-[#12544F] px-5 py-3 text-xs font-bold text-white hover:bg-[#349e73] transition"
          >
            ← Back to Community Directory
          </Link>
        </div>
      </main>
    );
  }

  const isMember = !!userRole;
  const isAdmin = userRole === "admin";
  const isModerator = userRole === "moderator";
  const canManageEvents = isAdmin || isModerator;

  const adminMember = members.find((m) => m.role === "admin");
  const moderatorMembers = members.filter((m) => m.role === "moderator");
  const standardMembers = members.filter((m) => m.role === "member");

  const locationDisplay = [community.district, community.city || community.province].filter(Boolean).join(", ") || "Indonesia";

  // Total Impact Estimates
  const totalResourceVolume = resources.reduce((acc, r) => acc + (Number(r.resources?.quantity) || 0), 0);
  const estimatedCO2Saved = Math.round(totalResourceVolume * 1.5);

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Community Directory</span>
        </Link>

        {/* PENDING ACTIVATION BANNER & INVITATION ACCEPTANCE */}
        {community.status === "pending_activation" && (
          <div className="mt-6 rounded-3xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Pending Community Activation (Anti-Spam Verification)</span>
                </div>
                <p className="mt-1 text-xs text-white/70 max-w-2xl leading-relaxed">
                  This community hub is pending activation until at least 2 initial invited members accept their invitations (
                  <strong className="text-amber-300">{community.initial_members_accepted || 0} / {community.initial_members_required || 2}</strong> accepted).
                </p>
              </div>

              {myPendingInvitation && !isMember && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAcceptInvitation(myPendingInvitation.id)}
                    className="rounded-xl bg-[#2A835F] border border-[#12544F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
                  >
                    Accept Founding Member Invitation
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleDeclineInvitation(myPendingInvitation.id)}
                    className="rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-white/50 hover:text-white transition"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            COMMUNITY HERO CARD
        ===================================================== */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                <Users className="h-8 w-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-0.5 text-xs font-semibold capitalize text-emerald-300">
                    {community.category} Hub
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-0.5 text-xs text-white/50">
                    {community.join_policy === "open" ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Open Join</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 text-amber-400" />
                        <span>Approval Required</span>
                      </>
                    )}
                  </span>
                </div>

                <h1 className="mt-2.5 text-2xl font-bold sm:text-3xl text-white">
                  {community.name}
                </h1>

                <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{locationDisplay}</span>
                  <span>•</span>
                  <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* JOIN / ACTION BUTTON */}
            <div className="flex items-center gap-3">
              {isMember ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-xs font-semibold text-emerald-300">
                    <UserCheck className="h-4 w-4" />
                    <span>{userRole === "admin" ? "Community Admin" : userRole === "moderator" ? "Moderator" : "Member"}</span>
                  </span>

                  {!isAdmin && (
                    <button
                      type="button"
                      onClick={handleLeaveCommunity}
                      disabled={actionLoading}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition"
                    >
                      Leave
                    </button>
                  )}
                </div>
              ) : pendingJoinRequest ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-300">
                  <Clock className="h-4 w-4" />
                  <span>Join Request Pending Approval</span>
                </span>
              ) : community.join_policy === "open" ? (
                <button
                  type="button"
                  onClick={handleJoinOpen}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-6 py-3 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Join Community</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowJoinModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-6 py-3 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
                >
                  <Lock className="h-4 w-4" />
                  <span>Request to Join</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/[0.08] pt-6">
            <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-3 text-center">
              <span className="text-xl font-bold text-white">{members.length}</span>
              <span className="block text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Total Members</span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-3 text-center">
              <span className="text-xl font-bold text-white">{resources.length}</span>
              <span className="block text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Shared Resources</span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-3 text-center">
              <span className="text-xl font-bold text-white">{events.length}</span>
              <span className="block text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Workshops / Events</span>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-3 text-center">
              <span className="text-xl font-bold text-emerald-300">{estimatedCO2Saved} kg</span>
              <span className="block text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Est. CO₂ Diverted</span>
            </div>
          </div>
        </div>

        {/* =====================================================
            TAB NAVIGATION
        ===================================================== */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
          {[
            { id: "overview", label: t.community.overviewTab, icon: Users },
            { id: "resources", label: `${t.community.resourcesTab} (${resources.length})`, icon: Package },
            { id: "events", label: `${t.community.eventsTab} (${events.length})`, icon: Calendar },
            { id: "members", label: `${t.community.membersTab} (${members.length})`, icon: ShieldCheck },
            { id: "impact", label: t.community.impactTab, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =====================================================
            TAB 1: OVERVIEW
        ===================================================== */}
        {activeTab === "overview" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Mission & Purpose */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>About & Circular Mission</span>
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/70">
                  {community.description}
                </p>
              </div>

              {/* Latest Upcoming Events Preview */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>Upcoming Community Events</span>
                  </h3>
                  {canManageEvents && (
                    <Link
                      href={`/community/${community.slug || community.id}/events/new`}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      Create Event
                    </Link>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {events.length === 0 ? (
                    <p className="text-xs text-white/40">No events scheduled yet.</p>
                  ) : (
                    events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.015] p-4 hover:border-emerald-400/20 transition"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-white">{event.title}</h4>
                          <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
                            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3 text-emerald-400/80" /> {new Date(event.event_date).toLocaleDateString()}</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-emerald-400/80" /> {event.location_name}</span>
                          </div>
                        </div>
                        <Link
                          href={`/community/events/${event.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                        >
                          <span>Read Article</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Organizer Info */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Leadership Team</span>
                </h3>

                <div className="mt-4 space-y-3">
                  {adminMember && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {adminMember.profiles?.full_name || adminMember.profiles?.username || "Admin User"}
                        </span>
                        <span className="text-[10px] text-white/40">Founder & Administrator</span>
                      </div>
                      <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        Admin
                      </span>
                    </div>
                  )}

                  {moderatorMembers.map((mod) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.015] p-3"
                    >
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {mod.profiles?.full_name || mod.profiles?.username || "Moderator"}
                        </span>
                        <span className="text-[10px] text-white/40">Community Moderator</span>
                      </div>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                        Mod
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            TAB 2: COMMUNITY RESOURCES
        ===================================================== */}
        {activeTab === "resources" && (
          <div className="mt-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Member Contributed Resources</h3>
                <p className="text-xs text-white/40">
                  Surplus materials pooled by members of {community.name} for circular exchange and community use.
                </p>
              </div>

              {isMember && (
                <button
                  type="button"
                  onClick={handleOpenContributeModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Contribute Resource</span>
                </button>
              )}
            </div>

            <div className="mt-6">
              {resources.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
                  <Package className="mx-auto h-8 w-8 text-white/20" />
                  <p className="mt-3 text-sm font-semibold">No Community Resources Contributed Yet</p>
                  <p className="mt-1 text-xs text-white/40">Community members can pool their surplus materials here.</p>
                  {isMember && (
                    <button
                      type="button"
                      onClick={handleOpenContributeModal}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#2A835F] border border-[#12544F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Contribute Your Resource</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {resources.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-400/30 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 uppercase">
                            {item.resources?.category}
                          </span>
                          <span className="text-[10px] text-white/40">
                            By {item.profiles?.full_name || "Member"}
                          </span>
                        </div>

                        <h4 className="mt-4 text-base font-bold text-white">{item.resources?.title}</h4>
                        <p className="mt-1 text-xs text-white/40">
                          Available: <strong className="text-white">{item.resources?.quantity} {item.resources?.unit}</strong>
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/[0.07] flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300">
                          {item.resources?.price && item.resources.price > 0
                            ? `Rp${item.resources.price.toLocaleString("id-ID")}`
                            : "Free / Community Shared"}
                        </span>

                        <Link
                          href={`/resources/${item.resource_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                          <span>View Details</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            TAB 3: EVENTS & ARTICLES
        ===================================================== */}
        {activeTab === "events" && (
          <div className="mt-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Community Events & Rich Articles</h3>
                <p className="text-xs text-white/40">
                  Public circular economy workshops, drop-off events, and educational articles hosted by {community.name}.
                </p>
              </div>

              {canManageEvents && (
                <Link
                  href={`/community/${community.slug || community.id}/events/new`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2A835F] border border-[#12544F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Event Article</span>
                </Link>
              )}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {events.length === 0 ? (
                <div className="col-span-2 rounded-3xl border border-dashed border-white/10 p-12 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-white/20" />
                  <p className="mt-3 text-sm font-semibold">No Events Published Yet</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:border-emerald-400/30 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{event.location_name}</span>
                        </span>
                      </div>

                      <h4 className="mt-3 text-lg font-bold text-white">{event.title}</h4>
                      <p className="mt-2 text-xs leading-6 text-white/50 line-clamp-3">
                        {event.short_description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.07] flex items-center justify-between">
                      <Link
                        href={`/community/events/${event.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                      >
                        <span>Read Full Article & Register</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            TAB 4: MEMBERS & ROLES
        ===================================================== */}
        {activeTab === "members" && (
          <div className="mt-6 space-y-6">
            {/* PENDING JOIN REQUESTS (FOR ADMIN / MOD) */}
            {canManageEvents && joinRequests.length > 0 && (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.03] p-6">
                <h3 className="text-base font-bold text-amber-300 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Pending Join Requests ({joinRequests.length})</span>
                </h3>
                <p className="text-xs text-white/50 mb-4">
                  These citizens have requested to join {community.name}. Review and approve their membership.
                </p>

                <div className="divide-y divide-white/5">
                  {joinRequests.map((req) => {
                    const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                    const applicantName = profile?.full_name || profile?.username || "Citizen";
                    return (
                      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                        <div>
                          <span className="text-xs font-bold text-white block">{applicantName}</span>
                          {req.message && (
                            <p className="text-xs text-white/60 italic mt-0.5">&ldquo;{req.message}&rdquo;</p>
                          )}
                          <span className="text-[10px] text-white/30">
                            Requested {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleApproveJoinRequest(req.id, req.user_id)}
                            className="rounded-xl bg-[#2A835F] border border-[#12544F] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#349e73] transition shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleRejectJoinRequest(req.id)}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COMMUNITY MEMBERS ROSTER */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-base font-bold text-white mb-4">
                Community Roster ({members.length} Total Members)
              </h3>

              <div className="divide-y divide-white/5">
                {members.map((member) => {
                  const name = member.profiles?.full_name || member.profiles?.username || "Member";
                  const isThisUserAdmin = member.role === "admin";
                  const isThisUserMod = member.role === "moderator";

                  return (
                    <div key={member.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-xs font-bold text-emerald-400">
                          {name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{name}</span>
                          <span className="text-[10px] text-white/40">Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isThisUserAdmin
                              ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                              : isThisUserMod
                              ? "bg-blue-400/20 text-blue-300 border border-blue-400/30"
                              : "bg-white/5 text-white/50"
                          }`}
                        >
                          {member.role.toUpperCase()}
                        </span>

                        {isAdmin && !isThisUserAdmin && (
                          <div className="flex items-center gap-1.5">
                            {isThisUserMod ? (
                              <button
                                type="button"
                                onClick={() => handleDemoteModerator(member.id)}
                                className="text-[10px] text-white/40 hover:text-white"
                              >
                                Demote
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePromoteModerator(member.id, moderatorMembers.length)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300"
                              >
                                Make Mod
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DANGER ZONE: ADMIN ONLY */}
            {isAdmin && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.02] p-6">
                <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Admin Zone: Delete Community</span>
                </h4>
                <p className="mt-1 text-xs text-white/40">
                  Only the creator/admin can delete this entire community hub. This action cannot be undone.
                </p>
                <div className="mt-4">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleDeleteCommunity}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition"
                      >
                        {actionLoading ? "Deleting..." : "Confirm Permanent Deletion"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition"
                    >
                      Delete Community Hub
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            TAB 5: IMPACT
        ===================================================== */}
        {activeTab === "impact" && (
          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.05] to-transparent p-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <span>Aggregated Environmental Impact</span>
            </h3>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#092328]/80 p-5">
                <span className="text-xs text-white/40 uppercase tracking-wider block">Estimated CO₂ Avoided</span>
                <span className="text-3xl font-extrabold text-emerald-300 mt-2 block">{estimatedCO2Saved} kg</span>
                <span className="text-[11px] text-white/40 mt-1 block">Calculated from {totalResourceVolume} kg material diverted</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#092328]/80 p-5">
                <span className="text-xs text-white/40 uppercase tracking-wider block">Materials Recycled / Pooled</span>
                <span className="text-3xl font-extrabold text-white mt-2 block">{totalResourceVolume} kg</span>
                <span className="text-[11px] text-white/40 mt-1 block">Across {resources.length} active resource streams</span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#092328]/80 p-5">
                <span className="text-xs text-white/40 uppercase tracking-wider block">Workshops & Drop-offs</span>
                <span className="text-3xl font-extrabold text-white mt-2 block">{events.length}</span>
                <span className="text-[11px] text-white/40 mt-1 block">Grassroots education activities</span>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            MODAL: CONTRIBUTE RESOURCE
        ===================================================== */}
        {showContributeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#071711] p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Contribute a Resource to {community.name}</h3>
              <p className="mt-1 text-xs text-white/40">
                Select one of your active marketplace resources to share with this community.
              </p>

              <form onSubmit={handleContributeSubmit} className="mt-5 space-y-4">
                {myAvailableResources.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 p-4 text-center text-xs text-white/40">
                    You have no active resources.{" "}
                    <Link href="/resources/new" className="text-emerald-400 underline">
                      Create one first.
                    </Link>
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">
                      Choose Your Resource *
                    </label>
                    <select
                      required
                      value={selectedResourceId}
                      onChange={(e) => setSelectedResourceId(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0b1d17] p-3 text-xs text-white outline-none focus:border-emerald-400"
                    >
                      <option value="">-- Select Resource --</option>
                      {myAvailableResources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.quantity} {r.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowContributeModal(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedResourceId || actionLoading}
                    className="rounded-xl bg-[#2A835F] border border-[#12544F] px-5 py-2 text-xs font-bold text-white hover:bg-[#349e73] disabled:opacity-50 shadow-sm"
                  >
                    Contribute
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================
            MODAL: JOIN REQUEST (APPROVAL REQUIRED)
        ===================================================== */}
        {showJoinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#071711] p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Request to Join {community.name}</h3>
              <p className="mt-1 text-xs text-white/40">
                This community requires admin approval for new members.
              </p>

              <form onSubmit={handleJoinRequestSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">
                    Message to Organizer (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="Tell the organizer why you'd like to join..."
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] p-3 text-xs text-white outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-xl bg-[#2A835F] border border-[#12544F] px-5 py-2 text-xs font-bold text-white hover:bg-[#349e73] shadow-sm"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
