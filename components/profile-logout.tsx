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

    function syncPosition() {
      // Use the real rendered profile header as the anchor instead of guessing
      // its max-width. This keeps the fixed button inside the card even when
      // the profile layout changes responsively.
      const profileCard = document.querySelector(
        "main > section"
      ) as HTMLElement | null;

      if (!profileCard) {
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

    // Measure after the profile card has rendered.
    const frame = window.requestAnimationFrame(syncPosition);
    window.addEventListener("resize", syncPosition);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncPosition);
    };
  }, [pathname]);

  if (pathname !== "/profile" || !position) {
    return null;
  }

  function handleLogout() {
    const supabase = createClient();

    // Local sign-out clears the current browser session without waiting for
    // a remote session revocation request before changing pages.
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
