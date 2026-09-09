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
    <div className="pointer-events-none fixed inset-x-0 top-[128px] z-50">
      <div className="mx-auto flex w-full max-w-4xl justify-end px-4 sm:px-6 md:px-8">
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
