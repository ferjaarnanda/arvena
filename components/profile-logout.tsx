"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function ProfileLogout() {
  const pathname = usePathname();
  const router = useRouter();
  const [position, setPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    if (pathname !== "/profile") return;

    let cancelled = false;
    let retryFrame: number | null = null;

    function getProfileCard() {
      return document.querySelector("main > div > section") as HTMLElement | null;
    }

    function syncPosition(card: HTMLElement) {
      if (cancelled) return;

      const rect = card.getBoundingClientRect();

      // This is intentionally ABSOLUTE, not FIXED.
      // scrollY converts the card's viewport position to its document position,
      // so the logout button scrolls together with the profile card.
      setPosition({
        top: rect.top + window.scrollY + 48,
        right: Math.max(12, window.innerWidth - rect.right + 20),
      });
    }

    function findCard() {
      if (cancelled) return;

      const card = getProfileCard();
      if (!card) {
        retryFrame = window.requestAnimationFrame(findCard);
        return;
      }

      syncPosition(card);
    }

    function handleResize() {
      const card = getProfileCard();
      if (card) syncPosition(card);
    }

    findCard();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      if (retryFrame !== null) window.cancelAnimationFrame(retryFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  if (pathname !== "/profile" || !position) return null;

  function handleLogout() {
    const supabase = createClient();

    void supabase.auth.signOut({ scope: "local" }).catch((error) => {
      console.error("LOGOUT ERROR:", error);
    });

    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        top: position.top,
        right: position.right,
      }}
    >
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Log out"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-[#102f35]/95 px-4 py-2.5 text-sm font-medium text-red-200 shadow-lg backdrop-blur-md transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"
      >
        <LogOut className="h-4 w-4" />
        <span>Log out</span>
      </button>
    </div>
  );
}
