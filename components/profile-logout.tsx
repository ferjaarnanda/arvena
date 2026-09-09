"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileLogout() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname !== "/profile") {
    return null;
  }

  function handleLogout() {
    const supabase = createClient();

    // Start local sign-out without blocking the UI/redirect on the auth request.
    // Supabase local scope clears the current browser session.
    void supabase.auth
      .signOut({ scope: "local" })
      .catch((error) => {
        console.error("LOGOUT ERROR:", error);
      });

    // Redirect immediately so the button can never remain stuck on
    // "Logging out..." when the auth request is slow or unavailable.
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[124px] z-50 md:top-[148px]">
      <div className="mx-auto flex w-full max-w-4xl justify-end px-4 sm:px-6">
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
    </div>
  );
}
