import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public browsing pages stay accessible.
// Creation pages require authentication, while each creation page performs
// its own profile-completion check before allowing the user to submit.
const AUTH_REQUIRED_PATHS = [
  "/resources/new",
  "/exchange/new",
  "/community/create",
];

function isAuthRequiredPath(pathname: string) {
  return AUTH_REQUIRED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Browsing pages are public.
  if (!isAuthRequiredPath(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  // Creation pages require a signed-in user.
  // Profile completion is intentionally NOT checked here because the client
  // creation pages perform the profile check themselves. This avoids a false
  // redirect when the browser session/profile data are temporarily out of sync.
  if (!user) {
    const loginResponse = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
    copyCookies(supabaseResponse, loginResponse);
    return loginResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
