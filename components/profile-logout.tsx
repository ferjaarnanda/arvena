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
    if (pathname !== "/profile") {
      return;
    }

    let cancelled = false;
    let retryFrame: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    function syncPosition(profileCard: HTMLElement) {
      if (cancelled) {
        return;
      }

      const rect = profileCard.getBoundingClientRect();
      const buttonRightInset = 20;
      const buttonTopOffset = 20;

      setPosition({
        top: Math.max(76, rect.top + buttonTopOffset),
        right: Math.max(
          12,
          window.innerWidth - rect.right + buttonRightInset
        ),
      });
    }

    function getProfileCard() {
      return document.querySelector(
        "main > div > section"
      ) as HTMLElement | null;
    }

    function handleResize() {
      const profileCard = getProfileCard();

      if (profileCard) {
        syncPosition(profileCard);
      }
    }

    function findProfileCard() {
      if (cancelled) {
        return;
      }

      // The profile page initially renders a loading state, so wait until
      // the real profile header card exists before calculating its position.
      const profileCard = getProfileCard();

      if (!profileCard) {
        retryFrame = window.requestAnimationFrame(findProfileCard);
        return;
      }

      syncPosition(profileCard);

      resizeObserver = new ResizeObserver(() => {
        syncPosition(profileCard);
      });
      resizeObserver.observe(profileCard);
    }

    findProfileCard();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;

      if (retryFrame !== null) {
        window.cancelAnimationFrame(retryFrame);
      }

      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  if (pathname !== "/profile" || !position) {
    return null;
  }

  function handleLogout() {
    const supabase = createClient();

    // Clear the current browser session without blocking the redirect.
    void supabase.auth
      .signOut({ scope: "local" })
      .catch((error) => {
        console.error("LOGOUT ERROR:", error);
      });

    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Log out"
      style={{
        top: position.top,
        right: position.right,
      }}
      className="fixed z-50 inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-[#102f35]/95 px-4 py-2.5 text-sm font-medium text-red-200 shadow-lg backdrop-blur-md transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"
    >
      <LogOut className="h-4 w-4" />
      <span>Log out</span>
    </button>
  );
}
