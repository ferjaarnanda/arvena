"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function ProfileLogout() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!mounted || pathname !== "/profile") {
      return;
    }

    let cancelled = false;
    let retryFrame: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    function getProfileCard() {
      return document.querySelector(
        "main > div > section"
      ) as HTMLElement | null;
    }

    function syncPosition(profileCard: HTMLElement) {
      if (cancelled) {
        return;
      }

      const rect = profileCard.getBoundingClientRect();
      const buttonRightInset = 20;
      const buttonTopOffset = 20;

      setPosition({
        // Capture the card's viewport position once. The button itself is
        // rendered through a body portal, so this fixed coordinate does not
        // become tied to a scrolling/transformed parent.
        top: Math.max(76, rect.top + buttonTopOffset),
        right: Math.max(
          12,
          window.innerWidth - rect.right + buttonRightInset
        ),
      });
    }

    function findProfileCard() {
      if (cancelled) {
        return;
      }

      const profileCard = getProfileCard();

      if (!profileCard) {
        retryFrame = window.requestAnimationFrame(findProfileCard);
        return;
      }

      syncPosition(profileCard);

      // Recalculate only when the card's size changes. Do NOT recalculate on
      // scroll: the logout button must remain fixed at the captured viewport
      // position instead of following the profile card down the page.
      resizeObserver = new ResizeObserver(() => {
        syncPosition(profileCard);
      });
      resizeObserver.observe(profileCard);
    }

    findProfileCard();

    function handleResize() {
      const profileCard = getProfileCard();

      if (profileCard) {
        syncPosition(profileCard);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;

      if (retryFrame !== null) {
        window.cancelAnimationFrame(retryFrame);
      }

      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted, pathname]);

  if (!mounted || pathname !== "/profile" || !position) {
    return null;
  }

  function handleLogout() {
    const supabase = createClient();

    void supabase.auth
      .signOut({ scope: "local" })
      .catch((error) => {
        console.error("LOGOUT ERROR:", error);
      });

    router.replace("/auth/login");
    router.refresh();
  }

  const button = (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Log out"
      style={{
        position: "fixed",
        top: position.top,
        right: position.right,
      }}
      className="z-[9999] inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-[#102f35]/95 px-4 py-2.5 text-sm font-medium text-red-200 shadow-lg backdrop-blur-md transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100"
    >
      <LogOut className="h-4 w-4" />
      <span>Log out</span>
    </button>
  );

  // Portal to document.body so position: fixed can never be affected by a
  // transformed/positioned ancestor in the navbar or provider tree.
  return createPortal(button, document.body);
}
